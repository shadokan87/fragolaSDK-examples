import { tool } from "@fragola-ai/agentic-sdk-core";
import z from "zod";
import { namespace, storeType } from "../../store/store";
import { nanoid } from "nanoid";
import { createCoordinatesOverlay } from "../../dom/gridOverlay";
import { takeScreenshotCallback } from "./takeScreenshot";

export const openTab = tool({
    name: "open_tab",
    description: "open a new browser tab with the specified URL",
    schema: z.object({
        url: z.string().url(),
    }),
    handler: async (params, context) => {
        const store = context.getStore<storeType>(namespace);
        if (!store) {
            return { fail: "failed to retrieve store, you may not proceed further" };
        }
        const browser = store.value.browser;
        if (!browser) {
            return { fail: "failed: browser is not opened. Please open the browser first." };
        }
        try {
            const page = await browser.newPage();
            store.set({ ...store.value, focusedPage: page, pages: [...store.value.pages, page] });
            await page.goto(params.url, { waitUntil: "domcontentloaded" });
            const screenshot = await takeScreenshotCallback(undefined, context);
            if (screenshot["fail"])
                return { fail: "the new tab opened successfully, but the screenshot failed. Try to reopen a tab with the same url" };
            const coordinateScreenshot = await createCoordinatesOverlay(store.value.screenshots.get(screenshot.id!)!);
            const coordinateScreenshotId = nanoid();
            store.value.screenshots.set(coordinateScreenshotId, coordinateScreenshot);
            return {
                success: true,
                message: `opened new tab for ${params.url}.`,
                tabId: store.value.pages.length == 0 ? 0 : store.value.pages.length - 1,
                screenshotId: coordinateScreenshotId,
            };
        } catch (error) {
            return { fail: `failed to open tab: ${(error as Error).message}` };
        }
    }
});

export const setTabUrl = tool({
    name: "set_tab_url",
    description: "navigate the currently focused tab to the specified URL",
    schema: z.object({
        url: z.string().url(),
    }),
    handler: async (params, context) => {
        const store = context.getStore<storeType>(namespace);
        if (!store) {
            return { fail: "failed to retrieve store, you may not proceed further" };
        }
        const page = store.value.focusedPage;
        if (!page) {
            return { fail: "failed: no focused tab. Please open or focus a tab first." };
        }
        try {
            await page.goto(params.url, { waitUntil: "domcontentloaded" });
                     const screenshot = await takeScreenshotCallback(undefined, context);
            if (screenshot["fail"])
                return { fail: "the new tab opened successfully, but the screenshot failed. Try to reopen a tab with the same url" };
            const coordinateScreenshot = await createCoordinatesOverlay(store.value.screenshots.get(screenshot.id!)!);
            const coordinateScreenshotId = nanoid();
            store.value.screenshots.set(coordinateScreenshotId, coordinateScreenshot);
            return { success: `focused tab url is now "${params.url}"`, screenshotId: coordinateScreenshotId};
        } catch (error) {
            return { fail: `failed to navigate tab: ${(error as Error).message}` };
        }
    }
});