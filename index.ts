import { globalStoreType } from "./store/globalStore";
import { conversationUtils } from "@fragola-ai/agentic-sdk-core";
import { openTab } from "./tools/browserUse/tabs";
import { click } from "./tools/browserUse/click";
import { typeText } from "./tools/browserUse/type";
import { takeScreenshot } from "./tools/browserUse/takeScreenshot";
import { FragolaHook } from "@fragola-ai/agentic-sdk-core/hook";

type screenshotId = {
    screenshotId: string
}
export const browserUse = (): FragolaHook => {
    return (agent) => {
        agent.onAfterStateUpdate(async (context) => {
            console.log(JSON.stringify(context.state.conversation, null, 2));
            if (context.state.conversation.at(-1)?.role == "assistant") {
                const messageBefore = context.state.conversation.at(-2);
                if (messageBefore && messageBefore.role == "tool") {
                    const origin = conversationUtils(context.state.conversation).toolCallOrigin(messageBefore);
                    if (origin && origin.type == "function" && [openTab, click, typeText, takeScreenshot].map(t => t.name).includes(origin.function.name)) {
                        const { screenshotId } = JSON.parse(messageBefore.content as string) as screenshotId;
                        const screenshot = context.instance.getStore<globalStoreType>()?.value.screenshots.get(screenshotId);
                        if (screenshot) {
                            const dataUrl = `data:${screenshot.mime};base64,${screenshot.base64}`;
                            // Send the image to the agent as a userMessage with OpenAI-like content parts
                            void agent.userMessage({
                                content: [
                                    { type: "text", text: `${screenshotId}` },
                                    { type: "image_url", image_url: { url: dataUrl } },
                                ],
                            });
                        } else {
                            void agent.userMessage({
                                content: `An error occured for screenshot with id ${screenshotId}, you must call the 'take_screenshot' tool to try again.`
                            })
                        }
                    }
                }
            }
        });

        agent.onModelInvocation(async (callApi, context) => {
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
    }
}