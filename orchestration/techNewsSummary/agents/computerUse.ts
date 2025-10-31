import { load, Prompt } from "@fragola-ai/prompt";
import { fragola } from "../client";
export const prompt = new Prompt(load("./agents/computerUsePrompt"));

export const computerUseAgent = fragola.agent({
    name: "news_website_explorer",
    instructions: prompt.value,
    description: "You navigate tech news websites to take screenshots of articles"
})