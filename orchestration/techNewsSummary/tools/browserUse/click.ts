import { tool } from "@fragola-ai/agentic-sdk-core";
import z from "zod";
import { globalStoreType } from "../../store/globalStore";
import { takeScreenshot, takeScreenshotCallback } from "./takeScreenshot";
import { ExtractToolHandler } from "../../utils";
import { createCoordinatesOverlay } from "./gridOverlay";
import { nanoid } from "nanoid";

export const click = tool({
    name: "click",
    description: "Click the center of the element with the given id from the last screenshot's coordinates.",
    schema: z.object({ id: z.string() }),
    handler: async ({ id }, context) => {
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
        // For now, click the center of the first coordinate rectangle
        const rect = coords[0];
        if (!rect) {
            return { fail: `no valid rectangle to click for id ${id}` };
        }
        // Use centerX/centerY if present, else fallback to x+width/2, y+height/2
        const x = typeof rect.centerX === 'number' ? rect.centerX : rect.x + rect.width / 2;
        const y = typeof rect.centerY === 'number' ? rect.centerY : rect.y + rect.height / 2;
        try {
            await page.mouse.click(x, y);
            const screenshot = await takeScreenshotCallback(undefined, context);
            if (screenshot["fail"])
                return screenshot;
            const coordinateScreenshot = await createCoordinatesOverlay(globalStore.value.screenshots.get(screenshot.id!)!);
            const coordinateScreenshotId = nanoid();
            globalStore.value.screenshots.set(coordinateScreenshotId, coordinateScreenshot);
            return { success: true, message: `clicked at (${x}, ${y}) for id ${id}`, screenshotId: coordinateScreenshotId};
        } catch (e) {
            return { fail: `error clicking at (${x}, ${y}) for id ${id}: ${(e as Error).message}` };
        }
    },
});