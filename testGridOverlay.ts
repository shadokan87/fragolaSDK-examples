import fs from "fs";
import path from "path";
import { createCoordinatesOverlay } from "./dom/gridOverlay";
import { store, ScreenshotMeta } from "./store/store";
import { browserUseAgent } from "./agents/browserUseAgent";
async function main() {
  // store.onChange((value) => {
  //   console.log("!value change", value);
  // });
  await browserUseAgent.userMessage({content: "take a screenshot of the google homepage"});
  const screenshot = store.value.screenshots.values().next().value as ScreenshotMeta | undefined;
  if (!screenshot || !screenshot.coordinates) throw new Error("coordinates undefined");

  // Create overlay with red frames around detected elements and save to disk
  const processed = await createCoordinatesOverlay(screenshot);
  const outPath = path.resolve(__dirname, "./screenshot_processed.png");
  const outBuffer = Buffer.from(processed.base64, "base64");
  fs.writeFileSync(outPath, outBuffer);
  console.log("Overlay applied. Output saved to:", outPath);
}

// async function main() {
//   // Read the PNG file as base64
//   const inputPath = path.resolve(__dirname, "./screenshot.png");
//   const outputPath = path.resolve(__dirname, "./screenshot_processed.png");
//   if (!fs.existsSync(inputPath)) {
//     throw new Error(`Input file not found: ${inputPath}`);
//   }
//   const imgBuffer = fs.readFileSync(inputPath);
//   const base64 = imgBuffer.toString("base64");

//   const meta: ScreenshotMeta = {
//     url: "file://screenshot.png",
//     mime: "image/png",
//     base64,
//     createdAt: new Date().toISOString(),
//   };

//   const processed = await createCoordinatesOverlay(meta);
//   const outBuffer = Buffer.from(processed.base64, "base64");
//   fs.writeFileSync(outputPath, outBuffer);
//   console.log("Overlay applied. Output saved to:", outputPath);
// }

main().catch((err) => {
  console.error(err);
  process.exit(1);
});