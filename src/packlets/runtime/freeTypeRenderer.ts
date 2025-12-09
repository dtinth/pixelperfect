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
  textGraphics(name: string, size: number, text: string): Graphics | null;
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
    textGraphics(name, size, text) {
      if (!font) return null;
      let fontAtSize = sizeCache.get(size);
      if (!fontAtSize) {
        fontAtSize = font.withSize(size);
        sizeCache.set(size, fontAtSize);
      }
      const width = fontAtSize.measure(text, { letterSpacing: 0 });
      const height = size * 1.2;
      const g = createGraphics(name, Math.ceil(width), Math.ceil(height));
      const { ctx } = g;
      fontAtSize.draw(ctx, text, 0, size, { letterSpacing: 0 });
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
