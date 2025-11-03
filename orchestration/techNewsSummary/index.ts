import { visionAgent } from "./agents/visionAgent";
import { orchestrator } from "./agents/orchestratorAgent";
import { fileSystemSave, orchestration } from "@fragola-ai/agentic-sdk-core/hook/presets";
import { browserUseAgent } from "./agents/browserUseAgent";
import { conversationUtils } from "@fragola-ai/agentic-sdk-core";
import { openTab } from "./tools/browserUse/tabs";
import { click } from "./tools/browserUse/click";
import { typeText } from "./tools/browserUse/type";
import path from "path";
import fs from "fs";
import { takeScreenshot } from "./tools/browserUse/takeScreenshot";
// // Wire orchestration: lead -> scraper -> vision -> lead
// orchestrator.use(
//   orchestration((lead) => ({
//     participants: [lead, brwoserUseAgent, visionAgent],
//     flow: [
//       [lead, { to: brwoserUseAgent }],
//       [brwoserUseAgent, { to: visionAgent }],
//       [visionAgent, { to: lead }],
//     ],
//   }))
// );
const topic = "google_signin";
type screenshotId = {
    screenshotId: string
}
browserUseAgent.use(fileSystemSave("./testOrchestration/" + topic));
browserUseAgent.onAfterStateUpdate(async (context) => {
    console.log(JSON.stringify(context.state.conversation, null, 2));
    if (context.state.conversation.at(-1)?.role == "assistant") {
        const messageBefore = context.state.conversation.at(-2);
        if (messageBefore && messageBefore.role == "tool") {
            const origin = conversationUtils(context.state.conversation).toolCallOrigin(messageBefore);
            if (origin && origin.type == "function" && [openTab, click, typeText, takeScreenshot].map(t => t.name).includes(origin.function.name)) {
                const { screenshotId } = JSON.parse(messageBefore.content as string) as screenshotId;
                const screenshot = context.globalStore?.value.screenshots.get(screenshotId);
                if (screenshot) {
                    const dataUrl = `data:${screenshot.mime};base64,${screenshot.base64}`;
                    const outPath = path.resolve(__dirname, `./testOrchestration/${topic}/${screenshotId}.png`);
                    const outBuffer = Buffer.from(screenshot.base64, "base64");
                    fs.writeFileSync(outPath, outBuffer);
                    // Send the image to the agent as a userMessage with OpenAI-like content parts
                    void browserUseAgent.userMessage({
                        content: [
                            { type: "text", text: `${screenshotId}` },
                            { type: "image_url", image_url: { url: dataUrl } },
                        ],
                    });
                } else {
                    void browserUseAgent.userMessage({
                        content: `An error occured for screenshot with id ${screenshotId}, you must call the 'take_screenshot' tool to try again.`
                    })
                }
            }
        }
    }
});

browserUseAgent.onModelInvocation(async (callApi, context) => {
    const lastMessage = context.state.conversation.at(-1);
    if (lastMessage && lastMessage.role == "tool") {
        const origin = conversationUtils(context.state.conversation).toolCallOrigin(lastMessage);
        if (!origin)
            return callApi();
        if (origin.type == "function" && [openTab, click, typeText].map(t => t.name).includes(origin.function.name)) {
            const { screenshotId } = JSON.parse(lastMessage.content as string) as screenshotId;
            return { role: "assistant", content: `I am now waiting for the screenshot with id: ${screenshotId}` }
        }
    }
    return callApi();
});

await browserUseAgent.userMessage({
    content: "create a new google docs and write hello world ! then save the document under hello_world. my temporary secured google credentials for testing purpose are 'mohamadoune.rouanet' and  'shodokan87' for the password.",
});

// await browserUseAgent.userMessage({
//     content: "search for the music 'imagine dragons, birds live' on youtube, play the first video",
// });

// await browserUseAgent.userMessage({
//     content: "search on duckduckgo search engine, for hello world ! and click on the wikipedia link, then stop and summarize what you did",
// });
