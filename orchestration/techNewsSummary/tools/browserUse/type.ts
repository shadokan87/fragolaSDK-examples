import { tool } from "@fragola-ai/agentic-sdk-core";
import z from "zod";
import { globalStoreType } from "../../store/globalStore";
import { takeScreenshotCallback } from "./takeScreenshot";
import { createCoordinatesOverlay } from "./gridOverlay";
import { nanoid } from "nanoid";
import { AfterClick, clickInternal } from "./click";

export const typeText = tool({
  name: "type_text",
  description: "Type the provided text into the element located from the last screenshot's coordinates using its id.",
  schema: z.object({
    id: z.number().describe("The id of the element to type into"),
    screenshotId: z.string().describe("The id of the screenshot supplying coordinates"),
    text: z.string().describe("The text to type into the target element"),
    submit: z.boolean().optional().default(false).describe("If true, submits after typing (e.g., press Enter or submit form)"),
  }),
  handler: async ({ id, screenshotId, text, submit = false }, context) => {
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
    const afterClick: AfterClick = async (page) => {
      await page.keyboard.type(text, { delay: 20 });
      if (submit) {
        await page.keyboard.press('Enter');
        const waitForNav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null);
        await waitForNav;
        return "typed text and submitted. Check screenshot if submit worked, otherwise request another screenshot";
      }
      return "typed text";
    }
    return await clickInternal(id, coords, page, async () => await takeScreenshotCallback(undefined, context), async (regId) => {
      const id = nanoid();
      const coordinateScreenshot = await createCoordinatesOverlay(globalStore.value.screenshots.get(regId!)!);
      globalStore.value.screenshots.set(id, coordinateScreenshot);
      return id;
    }, afterClick);
  },
});
