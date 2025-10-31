import { fragola } from "../client";

export const orchestrator = fragola.agent({
  name: "orchestrator",
  instructions: "Coordinate between scraperAgent and visionAgent.",
  description: "Orchestrates the workflow.",
});