import { fileSystemSave } from "@fragola-ai/agentic-sdk-core/hook/presets";
import { takeScreenshot } from "../tools/browserUse/takeScreenshot";
import { fragola } from "../client";
import { openBrowser } from "../tools/browserUse/openBrowser";
import { openTab, setTabUrl } from "../tools/browserUse/tabs";
import { click } from "../tools/browserUse/click";
import { typeText } from "../tools/browserUse/type";
import { load, Prompt } from "@fragola-ai/prompt";

// Load XML prompt with tool usage guidance
const systemPrompt = new Prompt(load("./agents/brwoserUsePrompt.xml"));

export const browserUseAgent = fragola
  .agent({
    name: "browserUseAgent",
    instructions: systemPrompt.value,
    description: "Captures webpage screenshots using Puppeteer and stores them in memory.",
    tools: [openBrowser, openTab, setTabUrl, takeScreenshot, click, typeText],
  })