import type { Page } from "puppeteer";
import { nanoid } from "nanoid";
let id = 0;
const getId = () => {
	const _id = id;
	id++;
	return _id;
}

export type InteractiveElementPosition = {
	id: string,
	tag: string;
	kind:
		| "link"
		| "button"
		| "input"
		| "select"
		| "textarea"
		| "summary"
		| "label"
		| "media"
		| "generic";
	// Present when computed from a DOMSnapshot; omitted for live DOM scan
	nodeIndex?: number;
	x: number;
	y: number;
	width: number;
	height: number;
	centerX: number;
	centerY: number;
	text?: string;
	role?: string;
	href?: string;
};

/**
 * Extracts interactive elements and their absolute page coordinates using
 * Puppeteer's DOM utilities executed in the page context. No `any` params,
 * just pass a Puppeteer Page and get a typed list back.
 */
export async function getInteractiveElementsPosition(
	page: Page
): Promise<InteractiveElementPosition[]> {
	const selector = [
		// Obvious interactive elements
		"a[href]",
		"button",
		"input:not([type=hidden])",
		"select",
		"textarea",
		"summary",
		// ARIA/keyboard-focusable
		"[role=button]",
		"[role=link]",
		"[role=checkbox]",
		"[role=radio]",
		"[role=combobox]",
		"[role=menuitem]",
		"[role=switch]",
		// Explicitly tabbable
		"[tabindex]:not([tabindex='-1'])",
		// Content editable regions can be interactive
		"[contenteditable='true']",
	].join(",");

	const items = await page.$$eval(selector, (elements) => {
        const isVisible = (el: Element) => {
            const style = window.getComputedStyle(el as HTMLElement);
            // Be strict about opacity and visibility
            if (style.visibility === "hidden" || style.display === "none") return false;
            if (parseFloat(style.opacity || "1") <= 0.01) return false;

            const rect = (el as HTMLElement).getBoundingClientRect();

            // Must have a non-trivial rect
            if (rect.width <= 1 || rect.height <= 1) return false;

            // Must intersect the viewport
            const intersectsViewport =
                rect.right > 0 &&
                rect.bottom > 0 &&
                rect.left < window.innerWidth &&
                rect.top < window.innerHeight;
            if (!intersectsViewport) return false;

            // Exclude detached or fully clipped (except fixed)
            if ((el as HTMLElement).offsetParent === null && style.position !== "fixed") return false;

            return true;
        };

        // Walk into shadow roots to find the true topmost element at a point.
        const deepElementFromPoint = (x: number, y: number): Element | null => {
            let root: DocumentOrShadowRoot = document;
            let top: Element | null = null;

            while (true) {
                const candidate = root.elementFromPoint(x, y);
                if (!candidate) return top; // nothing at this point
                top = candidate;
                // If the hit element hosts a shadow root, dive in and try again
                const sr = (candidate as any).shadowRoot as ShadowRoot | undefined;
                if (sr && typeof sr.elementFromPoint === "function") {
                    root = sr;
                    continue;
                }
                return top;
            }
        };

        // Check if any of the sample points on the element would receive the pointer on this element.
        const isPointerReachable = (el: Element): boolean => {
            const rect = (el as HTMLElement).getBoundingClientRect();

            // Sample center + 4 near-corners (clamped into viewport)
            const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
            const rawPts: [number, number][] = [
                [rect.left + rect.width / 2, rect.top + rect.height / 2],
                [rect.left + 2, rect.top + 2],
                [rect.right - 2, rect.top + 2],
                [rect.left + 2, rect.bottom - 2],
                [rect.right - 2, rect.bottom - 2],
            ];

            const pts: [number, number][] = rawPts
                .map(([x, y]): [number, number] => [
                    clamp(x, 0, window.innerWidth - 1),
                    clamp(y, 0, window.innerHeight - 1),
                ])
                // Only keep points that are actually inside the element’s rect (after clamping)
                .filter(([x, y]) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);

            for (const [x, y] of pts) {
                const top = deepElementFromPoint(x, y);
                if (!top) continue;

                // If the top element is the element itself or a descendant, it is reachable.
                if (top === el || (el as HTMLElement).contains(top)) {
                    // Also ensure the element (not some overlay child) can receive pointer events
                    const style = window.getComputedStyle(el as HTMLElement);
                    if (style.pointerEvents !== "none") {
                        return true;
                    }
                }
            }
            return false;
        };

        const getText = (el: Element): string | undefined => {
            const tag = el.tagName.toLowerCase();
            const aria = el.getAttribute("aria-label");
            const title = el.getAttribute("title");
            if (aria && aria.trim()) return aria.trim();
            if (title && title.trim()) return title.trim();
            if (tag === "input" || tag === "textarea") {
                const anyEl = el as HTMLInputElement | HTMLTextAreaElement;
                const v = (anyEl.value ?? "").toString().trim();
                if (v) return v;
                const ph = anyEl.getAttribute("placeholder")?.trim();
                if (ph) return ph;
            }
            const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
            return txt || undefined;
        };

        const classify = (el: Element): {
            kind:
                | "link"
                | "button"
                | "input"
                | "select"
                | "textarea"
                | "summary"
                | "label"
                | "media"
                | "generic";
            href?: string;
        } => {
            const tag = el.tagName.toLowerCase();
            const role = el.getAttribute("role")?.toLowerCase();
            const tabindex = el.getAttribute("tabindex");
            const hasTabIndex = tabindex !== null && tabindex !== "-1";
            const clickable = (el as HTMLElement).onclick != null;

            if (tag === "a") return { kind: "link", href: (el as HTMLAnchorElement).getAttribute("href") || undefined };
            if (tag === "button") return { kind: "button" };
            if (tag === "input") return { kind: "input" };
            if (tag === "select") return { kind: "select" };
            if (tag === "textarea") return { kind: "textarea" };
            if (tag === "summary") return { kind: "summary" };
            if (tag === "label") return { kind: "label" };
            if ((tag === "video" || tag === "audio") && (el as HTMLMediaElement).controls)
                return { kind: "media" };

            if (
                clickable ||
                hasTabIndex ||
                role === "button" ||
                role === "link" ||
                role === "checkbox" ||
                role === "radio" ||
                role === "combobox" ||
                role === "menuitem" ||
                role === "switch"
            ) {
                return { kind: "generic" };
            }
            return { kind: "generic" }; // fallback
        };

        return elements
            .filter(isVisible)
            // Exclude elements occluded by overlays/modals or other stacking contexts
            .filter(isPointerReachable)
            .map((el) => {
                const rect = (el as HTMLElement).getBoundingClientRect();
                const x = rect.left + window.scrollX;
                const y = rect.top + window.scrollY;
                const width = rect.width;
                const height = rect.height;
                const centerX = x + width / 2;
                const centerY = y + height / 2;

                const { kind, href } = classify(el);
                const tag = el.tagName.toLowerCase();
                const role = el.getAttribute("role")?.toLowerCase() || undefined;
                const text = getText(el);

                return {
                    tag,
                    kind,
                    x,
                    y,
                    width,
                    height,
                    centerX,
                    centerY,
                    text,
                    role,
                    href,
                } as const;
            })
            .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
    });

	// Add a unique id to each element (generated in Node context)
	type WithoutId = Omit<InteractiveElementPosition, "id">;
	const withIds: InteractiveElementPosition[] = (items as WithoutId[]).map((el) => ({
		id: `${getId()}`,
		...el,
	}));
	id = 0;
	return withIds;
}