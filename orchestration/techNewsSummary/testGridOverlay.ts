import fs from "fs";
import path from "path";
import { createCoordinatesOverlay } from "./tools/computerUse/gridOverlay";
import { ScreenshotMeta } from "./store/globalStore";

async function main() {
  // Read the PNG file as base64
  const inputPath = path.resolve(__dirname, "./screenshot.png");
  const outputPath = path.resolve(__dirname, "./screenshot_processed.png");
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
  const imgBuffer = fs.readFileSync(inputPath);
  const base64 = imgBuffer.toString("base64");

  const meta: ScreenshotMeta = {
    url: "file://screenshot.png",
    mime: "image/png",
    base64,
    createdAt: new Date().toISOString(),
  };

  const processed = await createCoordinatesOverlay(meta);
  const outBuffer = Buffer.from(processed.base64, "base64");
  fs.writeFileSync(outputPath, outBuffer);
  console.log("Overlay applied. Output saved to:", outputPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});