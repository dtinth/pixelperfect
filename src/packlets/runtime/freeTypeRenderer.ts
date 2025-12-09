import {
  createFreeTypeRenderer,
  type FontAtSize,
  type LoadedFont,
} from "../freetype-renderer";
import { createGraphics, requestRerender } from "./api";
import type { Graphics } from "./types";

const rendererPromise = createFreeTypeRenderer();
const freeTypeRendererResourceMap = new WeakMap<
  ArrayBuffer,
  FreeTypeRendererResource
>();
interface FreeTypeRendererResource {
  textGraphics(
    name: string,
    size: number,
    text: string,
    options?: {
      lineHeight?: number;
      letterSpacing?: number;
    }
  ): Graphics | null;
}
export function freeTypeRenderer(
  source: ArrayBuffer | null
): FreeTypeRendererResource {
  if (!source) {
    return {
      textGraphics() {
        return null;
      },
    };
  }
  const existing = freeTypeRendererResourceMap.get(source);
  if (existing) {
    return existing;
  }
  let font: LoadedFont | null = null;
  const sizeCache: Map<number, FontAtSize> = new Map();
  const resource: FreeTypeRendererResource = {
    textGraphics(name, size, text, options = {}) {
      const lineHeight = options.lineHeight ?? size;
      const letterSpacing = options.letterSpacing ?? 0;
      if (!font) return null;
      let fontAtSize = sizeCache.get(size);
      if (!fontAtSize) {
        fontAtSize = font.withSize(size);
        sizeCache.set(size, fontAtSize);
      }
      const lines: {
        text: string;
        width: number;
        y: number;
        height: number;
      }[] = [];
      for (const [i, line] of text.split("\n").entries()) {
        const lineWidth = fontAtSize.measure(line, { letterSpacing });
        const lineY = i * lineHeight;
        lines.push({
          text: line,
          width: lineWidth,
          y: lineY,
          height: size * 1.2,
        });
      }
      const width = Math.max(...lines.map((l) => l.width));
      const height = Math.max(...lines.map((l) => l.y + l.height));
      const g = createGraphics(name, Math.ceil(width), Math.ceil(height));
      const { ctx } = g;
      for (const line of lines) {
        fontAtSize.draw(ctx, line.text, 0, line.y + size, { letterSpacing });
      }
      return g;
    },
  };
  const init = async () => {
    const renderer = await rendererPromise;
    font = await renderer.loadFont(source);
    requestRerender();
  };
  freeTypeRendererResourceMap.set(source, resource);
  init();
  return resource;
}
