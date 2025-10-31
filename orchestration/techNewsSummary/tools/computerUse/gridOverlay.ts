import Jimp from "jimp";
import { ScreenshotMeta } from "../../store/globalStore";

// Draws a red rectangular frame (CSS-like border) around each element
// described in meta.coordinates and returns a new ScreenshotMeta with the
// overlay applied. No labels/text, just frames.
export type FrameOverlayOptions = {
  // border thickness in pixels
  borderWidth?: number;
  // RGBA for the border color (default: solid red)
  color?: { r: number; g: number; b: number; a?: number };
};

export const createCoordinatesOverlay = async (
  meta: ScreenshotMeta,
  opts: FrameOverlayOptions = {}
): Promise<ScreenshotMeta> => {
  const { base64, mime, coordinates } = meta;

  // Extract raw base64 payload if a data URL was provided
  const rawBase64 = base64.includes("base64,")
    ? base64.substring(base64.indexOf("base64,") + "base64,".length)
    : base64;

  const buf = Buffer.from(rawBase64, "base64");
  const image = await Jimp.read(buf);

  const imgW = image.getWidth();
  const imgH = image.getHeight();

  const borderWidth = Math.max(1, Math.floor(opts.borderWidth ?? 3));
  const colorDesc = {
    r: opts.color?.r ?? 255,
    g: opts.color?.g ?? 0,
    b: opts.color?.b ?? 0,
    a: opts.color?.a ?? 255,
  };
  const borderColor = Jimp.rgbaToInt(colorDesc.r, colorDesc.g, colorDesc.b, colorDesc.a);

  // Helper: draw a rectangle frame like CSS border
  const drawFrame = (x: number, y: number, w: number, h: number) => {
    if (w <= 0 || h <= 0) return;
    // Clamp to image bounds
    let x0 = Math.max(0, Math.floor(x));
    let y0 = Math.max(0, Math.floor(y));
    let x1 = Math.min(imgW - 1, Math.floor(x + w - 1));
    let y1 = Math.min(imgH - 1, Math.floor(y + h - 1));
    if (x0 > x1 || y0 > y1) return;

    // Draw borderWidth rings inward
    for (let i = 0; i < borderWidth; i++) {
      const tx0 = x0 + i;
      const ty0 = y0 + i;
      const tx1 = x1 - i;
      const ty1 = y1 - i;
      if (tx0 > tx1 || ty0 > ty1) break;

      // Top horizontal
      for (let xx = tx0; xx <= tx1; xx++) image.setPixelColor(borderColor, xx, ty0);
      // Bottom horizontal
      for (let xx = tx0; xx <= tx1; xx++) image.setPixelColor(borderColor, xx, ty1);
      // Left vertical
      for (let yy = ty0; yy <= ty1; yy++) image.setPixelColor(borderColor, tx0, yy);
      // Right vertical
      for (let yy = ty0; yy <= ty1; yy++) image.setPixelColor(borderColor, tx1, yy);
    }
  };

  // Draw frames for all detected element rectangles
  for (const rect of coordinates ?? []) {
    drawFrame(rect.x, rect.y, rect.width, rect.height);
  }

  // Export with same mime when possible (fallback to PNG)
  const outMime = mime || Jimp.MIME_PNG;
  const outBuffer = await image.getBufferAsync(outMime as any);
  const outBase64 = outBuffer.toString("base64");

  const result: ScreenshotMeta = {
    ...meta,
    base64: outBase64,
    mime: outMime,
    createdAt: new Date().toISOString(),
  };

  return result;
};