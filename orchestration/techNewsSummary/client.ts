import { Fragola } from "@fragola-ai/agentic-sdk-core";

export const fragola = new Fragola({
  baseURL: process.env.TEST_BASEURL,
  apiKey: process.env.TEST_API_KEY,
  model: "gpt-4.1-mini",
});
