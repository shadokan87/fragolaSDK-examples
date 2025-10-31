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

  // Load fonts for labels
  const [fontWhite, fontBlack] = await Promise.all([
    Jimp.loadFont(Jimp.FONT_SANS_16_WHITE),
    Jimp.loadFont(Jimp.FONT_SANS_16_BLACK),
  ]);

  // Helpers to draw basic primitives
  const drawVLine = (x: number, y0: number, y1: number, color: number) => {
    const xx = Math.round(x);
    const from = Math.max(0, Math.min(y0, y1));
    const to = Math.min(imgH - 1, Math.max(y0, y1));
    if (xx < 0 || xx >= imgW) return;
    for (let yy = from; yy <= to; yy++) image.setPixelColor(color, xx, yy);
  };
  const drawHLine = (y: number, x0: number, x1: number, color: number) => {
    const yy = Math.round(y);
    const from = Math.max(0, Math.min(x0, x1));
    const to = Math.min(imgW - 1, Math.max(x0, x1));
    if (yy < 0 || yy >= imgH) return;
    for (let xx = from; xx <= to; xx++) image.setPixelColor(color, xx, yy);
  };
  const drawFilledRect = (x: number, y: number, w: number, h: number, color: number) => {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(imgW - 1, Math.floor(x + w - 1));
    const y1 = Math.min(imgH - 1, Math.floor(y + h - 1));
    if (x0 > x1 || y0 > y1) return;
    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) image.setPixelColor(color, xx, yy);
    }
  };

  // Draw a label placed outside the rectangle: prefer above; otherwise place below.
  const drawLabel = (rect: { x: number; y: number; width: number; height: number; id?: string }) => {
    const text = rect.id ?? "";
    if (!text) return; // nothing to show

    const padX = 6;
    const padY = 3;
    const textW = Jimp.measureText(fontWhite, text);
    const textH = Jimp.measureTextHeight(fontWhite, text, textW);
    const boxW = textW + padX * 2;
    const boxH = textH + padY * 2;

    const x0 = Math.floor(rect.x);
    const y0 = Math.floor(rect.y);

    // Place label at the top-left of the element, touching the frame (no gap).
    // Prefer just above the frame; if not enough space, place BELOW the frame.
    // In no case should the label be drawn INSIDE the rectangle.
    let labelX = x0;
    labelX = Math.max(0, Math.min(labelX, imgW - boxW));

    const aboveY = y0 - boxH; // label bottom touches frame top
    let labelY: number;
    if (aboveY >= 0) {
      // Enough room above
      labelY = aboveY;
    } else {
      // Not enough room above: place just below the frame
      const belowY = Math.ceil(y0 + rect.height); // label top touches frame bottom
      if (belowY + boxH <= imgH) {
        // Fits fully below
        labelY = belowY;
      } else {
        // Try clamping to bottom edge if it still stays below the rectangle
        const clampedBottom = imgH - boxH;
        if (clampedBottom >= Math.ceil(y0 + rect.height)) {
          labelY = clampedBottom;
        } else {
          // As a last resort, keep it just below the rectangle (may be partially clipped)
          labelY = belowY;
        }
      }
    }

    // Background box for the label uses the same color as the red frame
    const bgColor = borderColor;
    drawFilledRect(labelX, labelY, boxW, boxH, bgColor);

    // High-contrast text on red background
    image.print(fontWhite, labelX + padX, labelY + padY, text);
  };

  // Draw frames for all detected element rectangles
  for (const rect of coordinates ?? []) {
    drawFrame(rect.x, rect.y, rect.width, rect.height);
    // Draw label using rect.id if provided
    // @ts-ignore - coordinates elements may carry an id field depending on extractor
    drawLabel(rect);
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