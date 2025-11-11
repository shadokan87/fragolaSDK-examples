import { fragola } from "./client";
import browserUse from "./";
import { fileSystemSave, guardrail, Guardrail } from "@fragola-ai/agentic-sdk-core/hook/presets";
import * as readline from "readline";

const isOffTopicQuestion = (topic: string): Guardrail => (async (fail, userMessage, context) => {
    if (await context.instance.boolean(`This message is not appropriate for the topic '${topic}'. userMessage: ${userMessage.content}`))
        return fail(`Message must be about ${topic}`)
});

const assistant = fragola.agent({
    name: "assistant",
    instructions: "You are a helpful assistant",
    description: "",
    modelSettings: {
        model: fragola.options.model,
        // stream: true
    }
}).use(fileSystemSave("./testGuardrail"))
.use(guardrail([isOffTopicQuestion("Cooking food")]))
// .use(browserUse({screenshotPath: "./testGoogleTwo"}));

assistant.onAfterStateUpdate((context) => {
    console.log(JSON.stringify(context.state.conversation, null, 2));
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (question: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

const main = async () => {
    while (true) {
        const userInput = await askQuestion("You: ");
        if (userInput.toLowerCase() === "exit") {
            rl.close();
            break;
        }
        await assistant.userMessage({ content: userInput }).catch(e => {});
    }
};

main();