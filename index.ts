import { storeType, namespace } from "./store/store";
import { conversationUtils } from "@fragola-ai/agentic-sdk-core";
import { openTab, setTabUrl } from "./tools/browserUse/tabs";
import { click } from "./tools/browserUse/click";
import { typeText } from "./tools/browserUse/type";
import { takeScreenshot } from "./tools/browserUse/takeScreenshot";
import { FragolaHook } from "@fragola-ai/agentic-sdk-core/hook";
import { createStore } from "@fragola-ai/agentic-sdk-core/store";
import { openBrowser } from "./tools/browserUse/openBrowser";
import {Prompt, load} from "@fragola-ai/prompt";

type screenshotId = {
    screenshotId: string
}

export interface browserUseOptions {
    screenshotPath: string | undefined
}

const browserUse = (options?: browserUseOptions): FragolaHook => {
    return (agent) => {
        agent.context.addStore(createStore<storeType>({
            screenshots: new Map(),
            browser: undefined,
            focusedPage: undefined,
            pages: []
        }, namespace));

        agent.context.updateTools((prev) => [...prev, openBrowser, openTab, setTabUrl, takeScreenshot, click, typeText],
        );

        const systemPrompt = new Prompt(load("./agents/browserUsePrompt"));
        agent.context.setInstructions(`${agent.options.instructions}\n${systemPrompt.value}`);
        agent.context.setOptions({...agent.options, description: `${agent.context.options.description}\nCaptures webpage screenshots using Puppeteer and stores them in memory.`})

        agent.onAfterStateUpdate(async (context) => {
            console.log(JSON.stringify(context.state.conversation, null, 2));
            if (context.state.conversation.at(-1)?.role == "assistant") {
                const messageBefore = context.state.conversation.at(context.state.conversation.length - 2);
                if (messageBefore && messageBefore.role == "tool") {
                    const origin = conversationUtils(context.state.conversation).toolCallOrigin(messageBefore);
                    if (origin != undefined && origin.type == "function" && [openTab, click, typeText, takeScreenshot].map(t => t.name).includes(origin.function.name)) {
                        const { screenshotId } = JSON.parse(messageBefore.content as string) as screenshotId;
                        const screenshot = context.getStore<storeType>(namespace)?.value.screenshots.get(screenshotId);
                        if (screenshot) {
                            const dataUrl = `data:${screenshot.mime};base64,${screenshot.base64}`;
                            // Save screenshot to file if screenshotPath is defined
                            if (options?.screenshotPath) {
                                const fs = require("fs");
                                const path = require("path");
                                const filePath = path.join(options.screenshotPath, `${screenshotId}.png`);
                                fs.writeFileSync(filePath, Buffer.from(screenshot.base64, "base64"));
                            }
                            // Send the image to the agent as a userMessage with OpenAI-like content parts
                            void await agent.userMessage({
                                content: [
                                    { type: "text", text: `${screenshotId}` },
                                    { type: "image_url", image_url: { url: dataUrl } },
                                ],
                            });
                        } else {
                            void await agent.userMessage({
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

export default browserUse;