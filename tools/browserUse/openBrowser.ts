import { tool } from "@fragola-ai/agentic-sdk-core";
import z from "zod";
import { namespace, storeType } from "../../store/store";
import puppeteer from "puppeteer";
import { createCoordinatesOverlay } from "../../dom/gridOverlay";
import { nanoid } from "nanoid";
import { takeScreenshotCallback } from "./takeScreenshot";

export const openBrowser = tool({
    name: "open_browser",
    description: "open a new web browser",
    // schema: z.object({}),
    handler: async (params, context) => {
        const store = context.getStore<storeType>(namespace);
        if (!store) {
            return { fail: "failed to retrieve store, you may not proceed further" };
        }
        if (store?.value.browser) {
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
            store.set({
                ...store.value,
                browser,
            });
            return { success: "you may proceed" };
        } catch (error) {
            return { fail: `failed to launch browser: ${(error as Error).message}` };
        }
    }
});