import {
  createFreeTypeRenderer,
  type FontAtSize,
  type LoadedFont,
} from "../freetype-renderer";
import { createGraphics, requestRerender, weakResource } from "./api";
import type { Graphics } from "./types";

let rendererPromise: ReturnType<typeof createFreeTypeRenderer> | null;
function getRendererPromise() {
  return (rendererPromise ??= createFreeTypeRenderer());
}

interface FreeTypeRendererResourceApi {
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
): FreeTypeRendererResourceApi {
  if (!source) {
    return {
      textGraphics() {
        return null;
      },
    };
  }
  const res = weakResource(source, () => new FreeTypeRendererResource(source));
  return res.api;
}

class FreeTypeRendererResource {
  private font: LoadedFont | null = null;
  private sizeCache: Map<number, FontAtSize> = new Map();
  constructor(source: ArrayBuffer) {
    const init = async () => {
      const renderer = await getRendererPromise();
      this.font = await renderer.loadFont(source);
      requestRerender();
    };
    init();
  }
  get api(): FreeTypeRendererResourceApi {
    return {
      textGraphics: (name, size, text, options = {}) => {
        const lineHeight = options.lineHeight ?? size;
        const letterSpacing = options.letterSpacing ?? 0;
        const { font, sizeCache } = this;
        if (!font) return null;
        let fontAtSize = this.sizeCache.get(size);
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
  }
}
