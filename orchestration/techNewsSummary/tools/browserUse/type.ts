import { tool } from "@fragola-ai/agentic-sdk-core";
import z from "zod";
import { globalStoreType } from "../../store/globalStore";
import { takeScreenshotCallback } from "./takeScreenshot";
import { createCoordinatesOverlay } from "./gridOverlay";
import { nanoid } from "nanoid";

export const typeText = tool({
  name: "type",
  description: "Type the provided text into the element located from the last screenshot's coordinates using its id.",
  schema: z.object({ id: z.string(), text: z.string() }),
  handler: async ({ id, text }, context) => {
    const globalStore = context.getGlobalStore<globalStoreType>();
    if (!globalStore) {
      return { fail: "could not access global store." };
    }
    const page = globalStore.value.focusedPage;
    if (!page) {
      return { fail: "no focused page. Open a tab first." };
    }
    const meta = globalStore.value.screenshots.get(id);
    if (!meta) {
      return { fail: `no screenshot found for id ${id}` };
    }
    const coords = meta.coordinates;
    if (!coords || coords.length === 0) {
      return { fail: `no coordinates found in screenshot for id ${id}` };
    }

    // For now, type into the center of the first coordinate rectangle
    const rect = coords[0];
    if (!rect) {
      return { fail: `no valid rectangle to type into for id ${id}` };
    }

    const x = typeof (rect as any).centerX === 'number' ? (rect as any).centerX : rect.x + rect.width / 2;
    const y = typeof (rect as any).centerY === 'number' ? (rect as any).centerY : rect.y + rect.height / 2;

    try {
      // Focus the element by clicking
      await page.mouse.click(x, y);
      // Type the provided text
      await page.keyboard.type(text, { delay: 20 });

      // Take a new screenshot and return an annotated version id
      const screenshot = await takeScreenshotCallback(undefined, context);
      if ((screenshot as any)["fail"]) return screenshot as any;

      const coordinateScreenshot = await createCoordinatesOverlay(globalStore.value.screenshots.get((screenshot as any).id!)!);
      const coordinateScreenshotId = nanoid();
      globalStore.value.screenshots.set(coordinateScreenshotId, coordinateScreenshot);

      return { success: true, message: `typed text at (${x}, ${y}) for id ${id}`, screenshotId: coordinateScreenshotId };
    } catch (e) {
      return { fail: `error typing at (${x}, ${y}) for id ${id}: ${(e as Error).message}` };
    }
  },
});
