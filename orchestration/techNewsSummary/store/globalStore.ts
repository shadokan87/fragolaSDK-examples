import { createStore } from "@fragola-ai/agentic-sdk-core/store";

export type ScreenshotMeta = {
  url: string;
  mime: string;
  base64: string;
  createdAt: string;
};

export interface globalStoreType {
    screenshots: Map<string, ScreenshotMeta>
};

export const globalStore = createStore<globalStoreType>({
    screenshots: new Map()
});