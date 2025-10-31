import { fileSystemSave } from "@fragola-ai/agentic-sdk-core/hook/presets";
import { takeScreenshot } from "../tools/computerUse/takeScreenshot";
import { fragola } from "../client";

export const scraperAgent = fragola
  .agent({
    name: "scraperAgent",
    instructions:
      "Take a screenshot of a given https URL and provide an ID for retrieval by other agents.",
    description: "Captures webpage screenshots using Puppeteer and stores them in memory.",
    tools: [takeScreenshot],
  })
  // Keep saving under the same folder as before for consistency
  .use(fileSystemSave("./testOrchestration"));

