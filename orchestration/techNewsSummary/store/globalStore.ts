import { createStore } from "@fragola-ai/agentic-sdk-core/store";
import { getInteractiveElementsPosition } from "../dom/getInteractiveElementsPosition";

export type ScreenshotMeta = {
  url: string;
  mime: string;
  base64: string;
  createdAt: string;
  coordinates: Awaited<ReturnType<typeof getInteractiveElementsPosition>>;
};

export interface globalStoreType {
    screenshots: Map<string, ScreenshotMeta>
};

export const globalStore = createStore<globalStoreType>({
    screenshots: new Map()
});