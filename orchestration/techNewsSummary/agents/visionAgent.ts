import { describeImage } from "../tools/describeImage";
import { fragola } from "../client";

export const visionAgent = fragola.agent({
  name: "visionAgent",
  instructions: "Describe the content of an image you receive.",
  description: "Analyzes images and describes them.",
  tools: [describeImage],
});

