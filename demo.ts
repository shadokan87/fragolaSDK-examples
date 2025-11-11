import { tool } from "@fragola-ai/agentic-sdk-core";
import { fragola } from "./client";
import { skip, UserMessageQuery } from "@fragola-ai/agentic-sdk-core/agent";
import z from "zod";
import { fileSystemSave, guardrail, Guardrail, orchestration } from "@fragola-ai/agentic-sdk-core/hook/presets";


// agent simple

// plugin guardrail
const isOffTopic = (topic: string): Guardrail => async (fail, userMessage, context) => {
    if (await context.instance.boolean(`This user message: ${userMessage.content}, is off topic for the topic: ${topic}`)) {
        return fail(`Is off topic: ${topic}`)
    }
}

const planner = fragola.agent({
    name: "planner",
    instructions: "You create markdown plans with checkboxes like todos, but generate also a spec, then the todos",
    description: "Planner agent to generate complete plans and steps to complete a given task"
});

const assistant = fragola.agent({
    name: "assistant",
    instructions: "you are a helpful assistant",
    description: "a simple assitant agent",
}).use(fileSystemSave("./test_orchestration_demo"));

assistant.use(orchestration((lead) => {
    return {
        participants: [lead, planner],
        flow: [
            [assistant, {to: planner}],
        ]
    }
}));

console.log(assistant.context.options.instructions);
// const state = await assistant.userMessage({content: "give me a plan to cook pesto pasta"});
// console.log(JSON.stringify(state, null, 2));


// assistant.context.raw.updateConversation((prev) => [...prev, {role: "user", content: "say hello"}], "userMessage");
// const state = await assistant.step();
// console.log(JSON.stringify(state, null, 2));
// // .use(guardrail([isOffTopic("medical")]));
// const state = assistant.use(parallel([{}, {}])).single();
// assistant.userMessage({content: "combine all previous result for analyze"});

// try {
//     const userMessage: UserMessageQuery = {
//         content: "what is the capital of France"
//     }
//     const [state, guardrailResult] = await Promise.all([
//         assistant.userMessage(userMessage),
//         assistant.fork().use(guardrail([isOffTopic("medical")])).userMessage(userMessage)
//     ]);
//     console.log("state", state.conversation)
// } catch(e) {
//     console.error(e);
//     // console.log(JSON.stringify(assistant.state.conversation, null, 2));
// }

// json mode
// type JsonQuery<S extends z.ZodTypeAny = z.ZodTypeAny> = {
//     name: string;
//     content: string | OpenAI.Chat.Completions.ChatCompletionContentPart[];
//     step?: StepParams | undefined;
//     preferToolCalling?: boolean | undefined;
//     schema: S;
//     ignoreUserMessageEvents?: boolean | undefined;
//     description?: string | undefined;
//     strict?: boolean | null | undefined;
// }
// const json = await fragola.json({
//     name: "extract_user_info",
//     content: "I am eclipse, 26, I live in paris and I am a software engineer",
//     schema: z.object({
//         name: z.string().optional(),
//         age: z.number().optional(),
//         profession: z.string().optional(),
//         location: z.string().optional()
//     })
// });

// console.log(JSON.stringify(json, null, 2));
// console.log(await fragola.boolean("Paris is the capital of France"));

// boolean mode

// const state = await assistant.fork().userMessage({content: "say hello"});

// console.log(JSON.stringify(state, null, 2));

//events
// function doSomething() {
// const greeting = "Hola !"
// assistant.onToolCall((params, tool, context) => {
//     switch (tool.name) {
//         case "greeting": {
//          return greeting;     
//         }
//         default: {
//             return skip();
//         }
//     }
// });
// }
// doSomething();

// assistant.onAiMessage(async (message, isPartial, context) => {
//     const prevTool = context.state.conversation.at(-2);
//     if (prevTool?.role == "tool") {
//         return {role: "assistant", content: prevTool.content}
//     }
//     return message;
// });

// assistant.onModelInvocation(async (callApi, context) => {
//     const message = await callApi(async (chunck) => {
//         chunck.choices[0].delta.content = "salut";
//         return chunck;
//     });
//     return message;
// });

// assistant.onUserMessage((message, context) => {
//     message.content = "say hello world";
//     context.setInstructions("You are a kind helpful assistant");
//     return message;
// });

// const state = await assistant.userMessage({content: "greet the new user"});
// console.log(JSON.stringify(state, null, 2));
// console.log("system", assistant.options.instructions);

// autres methodes agents


// plugin web



//plugin orchestration

// autre plugin


//metadata