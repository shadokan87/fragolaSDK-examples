import { fileSystemSave } from "@fragola-ai/agentic-sdk-core/hook/presets";
import browserUse from ".";
import { fragola } from "./client";

const browserAgent = fragola.agent({
    name: "browserUse",
    instructions: "",
    description: ""
})
.use(browserUse({screenshotPath: "./test_birds_two"})) // for browser
.use(fileSystemSave("./test_birds_two")); // to save conversation

// Logging conversation on terminal
browserAgent.onAfterStateUpdate((context) => {
    console.log(JSON.stringify(context.state.conversation, null, 2));
});

await browserAgent.userMessage({content: "Search for the music 'imagine dragons birds live' on youtube and play the first result that match"})