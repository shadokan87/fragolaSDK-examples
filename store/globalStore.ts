import { createStore } from "@fragola-ai/agentic-sdk-core/store";
import { getInteractiveElementsPosition } from "../dom/getInteractiveElementsPosition";
import { Browser, Page } from "puppeteer";

export type ScreenshotMeta = {
  url: string;
  mime: string;
  base64: string;
  createdAt: string;
  coordinates: Awaited<ReturnType<typeof getInteractiveElementsPosition>>;
};

export interface globalStoreType {
    screenshots: Map<string, ScreenshotMeta>,
    browser: Browser | undefined,
    focusedPage: Page | undefined,
    pages: Page[]
};

export const globalStore = createStore<globalStoreType>({
    screenshots: new Map(),
    browser: undefined,
    focusedPage: undefined,
    pages: []
});