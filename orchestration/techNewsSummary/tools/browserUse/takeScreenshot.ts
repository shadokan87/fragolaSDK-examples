import { tool } from "@fragola-ai/agentic-sdk-core";
import puppeteer from "puppeteer";
import z from "zod";
import { nanoid } from "nanoid";
import { globalStoreType } from "../../store/globalStore";
import { getInteractiveElementsPosition } from "../../dom/getInteractiveElementsPosition";
import { AgentContext } from "@fragola-ai/agentic-sdk-core/agent";
import { createCoordinatesOverlay } from "./gridOverlay";

// Independent screenshot callback
export async function takeScreenshotCallback(parameters: any, context: AgentContext<{}, globalStoreType, {}>) {
  void parameters;

  const globalStore = context.globalStore;
  if (!globalStore) {
    return { fail: "Global store undefined error" };
  }
  if (!globalStore.value.browser) {
    return { fail: "failed: browser is not opened. Please open the browser first." };
  }
  const { browser, focusedPage } = globalStore.value;
  const page = focusedPage;
  if (!page) {
    return { fail: "failed: you must open a new tab first. no focused page found" };
  }
  try {
    const coordinates = await getInteractiveElementsPosition(page);
    const base64 = (await page.screenshot({
      type: "png",
      encoding: "base64",
      fullPage: false, // Only capture the viewport, not the entire page
    })) as string;
    const regId = nanoid();
    const mime = "image/png";
    globalStore.value.screenshots.set(regId, { coordinates, url: page.url(), mime, base64, createdAt: new Date().toISOString() });
    
    const id = nanoid();
    const coordinateScreenshot = await createCoordinatesOverlay(globalStore.value.screenshots.get(regId!)!);
    globalStore.value.screenshots.set(id, coordinateScreenshot);
    return {
      id,
      screenshotId: id
    };
  } finally {
    // Do not close the browser, just leave it open
  }
}

export const takeScreenshot = tool({
  name: "take_screenshot",
  description:
    "Take a screenshot of the focused page then return and id for the file handler",
  handler: takeScreenshotCallback,
});
