import { DefineMetaData, tool } from "@fragola-ai/agentic-sdk-core";
import z from "zod";
import { globalStoreType } from "../../store/globalStore";
import { takeScreenshot, takeScreenshotCallback } from "./takeScreenshot";
import { AwaitedReturn, ExtractToolHandler } from "../../utils";
import { createCoordinatesOverlay } from "./gridOverlay";
import { nanoid } from "nanoid";
import { AgentContext } from "@fragola-ai/agentic-sdk-core/agent";
import { InteractiveElementPosition } from "../../dom/getInteractiveElementsPosition";
import { Page } from "puppeteer";

export type AfterClick = (page: Page) => Promise<string>;
/**
 * Core click logic, extracted for reuse.
 * Returns the same result as the handler would.
 */
export const clickInternal = async (
    id: number,
    elementsPosition: InteractiveElementPosition[],
    page: Page,
    screenshotCallback: () => ReturnType<typeof takeScreenshotCallback>,
    annotatedScreenshotCallback: (regularScreenshotId: string) => Promise<string>,
    afterClick?: (page: Page) => Promise<string>
) => {

    // Prefer the rectangle matching the provided element id; fallback to the first rectangle
    const rect = (elementsPosition).find((r) => r?.id == String(id));
    if (!rect) {
        return { fail: `no valid rectangle to click for id ${id}` };
    }
    const [x, y] = [rect.centerX, rect.centerY];
    try {
        // Prepare for potential navigation caused by the click
        const waitForNav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null);

        await page.mouse.click(x, y);

        // Await navigation if it occurred (no-op if it didn’t)
        // await waitForNav;
        const afterOp = afterClick && await afterClick(page);

        // Take a fresh screenshot (retry once if the context was destroyed by nav)
        let screenshot: AwaitedReturn<typeof takeScreenshotCallback>;
        try {
            screenshot = await screenshotCallback();
        } catch (err) {
            if ((err as Error)?.message?.includes("destroyed")) {
                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null);
                screenshot = await screenshotCallback();
            } else {
                throw err;
            }
        }
        if (screenshot["fail"])
            return screenshot;

        // const coordinateScreenshot = await createCoordinatesOverlay(globalStore.value.screenshots.get(screenshot.id!)!);
        // const coordinateScreenshotId = nanoid();
        // globalStore.value.screenshots.set(coordinateScreenshotId, coordinateScreenshot);
        return { success: true, message: `clicked ${afterOp ? 'and' + afterOp : ''} at (${x}, ${y}) for id ${id}`, screenshotId: await annotatedScreenshotCallback(screenshot.id!) };
    } catch (e) {
        return { fail: `error clicking at (${x}, ${y}) for id ${id}: ${(e as Error).message}` };
    }
};

export const click = tool({
    name: "click",
    description: "Click the center of the element with the given id from the last screenshot's coordinates.",
    schema: z.object({ id: z.number().describe("The id of the element to click on"), screenshotId: z.string().describe("The id of the screenshot") }),
    handler: async ({ id, screenshotId }, context) => {
        const globalStore = context.getGlobalStore<globalStoreType>();
        if (!globalStore) {
            return { fail: "could not access global store." };
        }
        const page = globalStore.value.focusedPage;
        if (!page) {
            return { fail: "no focused page. Open a tab first." };
        }
        const meta = globalStore.value.screenshots.get(screenshotId);
        if (!meta) {
            return { fail: `no screenshot found for screenshotId ${screenshotId}` };
        }
        const coords = meta.coordinates;
        if (!coords || coords.length === 0) {
            return { fail: `no coordinates found in screenshot for id ${screenshotId}` };
        }
        return await clickInternal(id, coords, page, async () => await takeScreenshotCallback(undefined, context), async (regId) => {
            const id = nanoid();
            const coordinateScreenshot = await createCoordinatesOverlay(globalStore.value.screenshots.get(regId!)!);
            globalStore.value.screenshots.set(id, coordinateScreenshot);
            return id;
        });
    },
});