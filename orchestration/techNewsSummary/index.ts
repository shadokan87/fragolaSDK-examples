import { scraperAgent } from "./agents/scraperAgent";
import { visionAgent } from "./agents/visionAgent";
import { orchestrator } from "./agents/orchestratorAgent";
import { orchestration } from "@fragola-ai/agentic-sdk-core/hook/presets";
import { prompt } from "./agents/computerUse";
console.log(prompt.value);
// // Wire orchestration: lead -> scraper -> vision -> lead
// orchestrator.use(
//   orchestration((lead) => ({
//     participants: [lead, scraperAgent, visionAgent],
//     flow: [
//       [lead, { to: scraperAgent }],
//       [scraperAgent, { to: visionAgent }],
//       [visionAgent, { to: lead }],
//     ],
//   }))
// );

// // Kick off a sample run (same as original example)
// await scraperAgent.userMessage({
//   content: "capture the dom of this website: https://www.google.com",
// });
