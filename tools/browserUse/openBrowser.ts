import { tool } from "@fragola-ai/agentic-sdk-core";
import z from "zod";
import { globalStoreType } from "../../store/globalStore";
import puppeteer from "puppeteer";
import { createCoordinatesOverlay } from "./gridOverlay";
import { nanoid } from "nanoid";
import { takeScreenshotCallback } from "./takeScreenshot";

export const openBrowser = tool({
    name: "open_browser",
    description: "open a new web browser",
    // schema: z.object({}),
    handler: async (params, context) => {
        const globalStore = context.getGlobalStore<globalStoreType>();
        if (!globalStore) {
            return { fail: "failed to retrieve globalStore, you may not proceed further" };
        }
        if (globalStore?.value.browser) {
            return { success: "the browser is already opened, you may proceed" };
        }
        try {
            const browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 2560, height: 1440, deviceScaleFactor: 1 },
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--window-size=2560,1440",
                ],
            });
            globalStore.set({
                ...globalStore.value,
                browser,
            });
            return { success: "you may proceed" };
        } catch (error) {
            return { fail: `failed to launch browser: ${(error as Error).message}` };
        }
    }
});