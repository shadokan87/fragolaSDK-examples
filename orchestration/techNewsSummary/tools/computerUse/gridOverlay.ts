import Jimp from "jimp";
import { ScreenshotMeta } from "../../store/globalStore";

// Draws a simple XY pixel-coordinate grid on top of the given screenshot
// and returns a new ScreenshotMeta with the overlay applied.
// - Grid lines every 50px
// - Labels every 100px along the top (x) and left (y)
// - Semi-transparent lines for easy readability
export const createCoordinatesOverlay = async (
    meta: ScreenshotMeta
): Promise<ScreenshotMeta> => {
    // Defensive: support both raw base64 and data URLs
    const { base64, mime } = meta;

    // Extract raw base64 payload if a data URL was provided
    const rawBase64 = base64.includes("base64,")
        ? base64.substring(base64.indexOf("base64,") + "base64,".length)
        : base64;

    const buf = Buffer.from(rawBase64, "base64");
    const image = await Jimp.read(buf);

    const width = image.getWidth();
    const height = image.getHeight();

    // Grid configuration
    const step = 50; // grid step in px
    const gridColor = Jimp.rgbaToInt(0, 255, 255, 100); // semi-transparent cyan
    const dotColor = Jimp.rgbaToInt(255, 64, 64, 255); // solid red-ish

    // Draw vertical grid lines
    for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y++) {
            image.setPixelColor(gridColor, x, y);
        }
    }

    // Draw horizontal grid lines
    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x++) {
            image.setPixelColor(gridColor, x, y);
        }
    }

    // Load small fonts for labels (black shadow + white text for contrast)
    const [fontWhite, fontBlack] = await Promise.all([
        Jimp.loadFont(Jimp.FONT_SANS_8_WHITE),
        Jimp.loadFont(Jimp.FONT_SANS_12_BLACK),
    ]);

    // Helper: draw a small square "dot" centered at (cx, cy)
    const drawDot = (cx: number, cy: number, size = 3) => {
        const half = Math.floor(size / 2);
        for (let dy = -half; dy <= half; dy++) {
            const yy = cy + dy;
            if (yy < 0 || yy >= height) continue;
            for (let dx = -half; dx <= half; dx++) {
                const xx = cx + dx;
                if (xx < 0 || xx >= width) continue;
                image.setPixelColor(dotColor, xx, yy);
            }
        }
    };

    // Iterate intersections, draw dots and coordinate labels
    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            // Dot at the intersection
            drawDot(x, y, 3);

            // Coordinate label next to the dot
            const text = `(${x},${y})`;
            const textW = Jimp.measureText(fontWhite, text);
            const textH = Jimp.measureTextHeight(fontWhite, text, textW);

            // Default: right of the dot, a bit above
            let labelX = x + 4;
            let labelY = y - textH - 2;

            // Keep labels on-canvas
            if (labelX + textW > width) {
                labelX = x - 4 - textW;
            }
            if (labelY < 0) {
                labelY = y + 4;
            }
            if (labelY + textH > height) {
                labelY = Math.max(0, height - textH - 1);
            }

            // Shadow
            image.print(fontBlack, labelX + 1, labelY + 1, text);
            // Foreground
            image.print(fontWhite, labelX, labelY, text);
        }
    }

    // Export in the same mime type as input, fallback to PNG
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