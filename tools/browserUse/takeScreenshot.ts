import { tool } from "@fragola-ai/agentic-sdk-core";
import puppeteer from "puppeteer";
import z from "zod";
import { nanoid } from "nanoid";
import { namespace, storeType } from "../../store/store";
import { getInteractiveElementsPosition } from "../../dom/getInteractiveElementsPosition";
import { AgentContext } from "@fragola-ai/agentic-sdk-core/agent";
import { createCoordinatesOverlay } from "../../dom/gridOverlay";

// Independent screenshot callback
export async function takeScreenshotCallback(parameters: any, context: AgentContext<{}, storeType, {}>) {
  void parameters;

  const store = context.getStore<storeType>(namespace);
  if (!store) {
    return { fail: "Global store undefined error" };
  }
  if (!store.value.browser) {
    return { fail: "failed: browser is not opened. Please open the browser first." };
  }
  const { browser, focusedPage } = store.value;
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
    store.value.screenshots.set(regId, { coordinates, url: page.url(), mime, base64, createdAt: new Date().toISOString() });
    
    const id = nanoid();
    const coordinateScreenshot = await createCoordinatesOverlay(store.value.screenshots.get(regId!)!);
    store.value.screenshots.set(id, coordinateScreenshot);
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
