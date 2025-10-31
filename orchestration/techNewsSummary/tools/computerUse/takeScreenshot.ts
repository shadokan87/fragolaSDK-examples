import { tool } from "@fragola-ai/agentic-sdk-core";
import puppeteer from "puppeteer";
import z from "zod";
import { nanoid } from "nanoid";
import { globalStore, globalStoreType } from "../../store/globalStore";

export const takeScreenshot = tool({
  name: "takeScreenshot",
  description:
    "Loads an https URL in a headless browser, takes a full-page PNG screenshot, stores it in memory, and returns an ID.",
  schema: z.object({
    url: z.string().url().refine((u) => u.startsWith("https://"), "Only https URLs are allowed"),
  }),
  handler: async ({ url }, context) => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
      const base64 = (await page.screenshot({
        type: "png",
        encoding: "base64",
        fullPage: true,
      })) as string;
      const id = nanoid();
      const mime = "image/png";
      // Saving the screenshot in the global store so any agent can read it
      context.getGlobalStore<globalStoreType>()?.value.screenshots.set(id, { url, mime, base64, createdAt: new Date().toISOString() });
      return {
        id,
        url,
        mime,
        bytes: Math.floor((base64.length * 3) / 4),
      };
    } finally {
      await browser.close();
    }
  },
});
