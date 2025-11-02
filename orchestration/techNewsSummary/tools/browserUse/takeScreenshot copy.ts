import { tool } from "@fragola-ai/agentic-sdk-core";
import puppeteer from "puppeteer";
import z from "zod";
import { nanoid } from "nanoid";
import { globalStoreType } from "../../store/globalStore";
import { getInteractiveElementsPosition } from "../../dom/getInteractiveElementsPosition";

export const takeScreenshot = tool({
  name: "takeScreenshot",
  description:
    "Loads an https URL in a headless browser, takes a full-page PNG screenshot, stores it in memory, and returns an ID.",
  schema: z.object({
    url: z.string().url().refine((u) => u.startsWith("https://"), "Only https URLs are allowed"),
  }),
  handler: async ({ url }, context) => {
    const globalStore = context.getGlobalStore<globalStoreType>()
    if (!globalStore) {
      throw new Error("Global store undefined error");
    }

    const browser = globalStore.value.browser ?? await puppeteer.launch({
      headless: true,
      // Set a 2K/1440p viewport for consistent sizing in headless mode
      defaultViewport: { width: 2560, height: 1440, deviceScaleFactor: 1 },
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--window-size=2560,1440",
      ],
    });
    // Allow browser process to not block Node.js exit
    if (!globalStore.value.browser) {
      browser.process()?.unref();
      globalStore.set({...globalStore.value, browser});
    }
    try {
      const page = globalStore.value.focusedPage ?? await browser.newPage();
      if (!globalStore.value.focusedPage)
        globalStore.set({...globalStore.value, focusedPage: page});
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
      const coordinates = await getInteractiveElementsPosition(page);
      const base64 = (await page.screenshot({
        type: "png",
        encoding: "base64",
        fullPage: true,
      })) as string;
      const id = nanoid();
      const mime = "image/png";
      // Saving the screenshot in the global store so any agent can read it
      globalStore.value.screenshots.set(id, { coordinates, url, mime, base64, createdAt: new Date().toISOString() });
      return {
        id,
        url,
        mime,
        bytes: Math.floor((base64.length * 3) / 4),
      };
    } finally {
      // Do not close the browser, just leave it open
    }
  },
});
