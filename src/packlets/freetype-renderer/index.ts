import FreeTypeInit, {
  type FT_GlyphSlotRec,
} from "freetype-wasm/dist/freetype.js";

// https://dt.in.th/FreeTypeJSBlackWhiteText
// Based on https://github.com/Ciantic/freetype-wasm/blob/master/example/example.js
export async function createFreeTypeRenderer() {
  const FreeType = await FreeTypeInit({
    locateFile: (path) =>
      `https://cdn.jsdelivr.net/npm/freetype-wasm@0.0.4/dist/${path}`,
  });

  /**
   * Loads a font from a URL or ArrayBuffer.
   */
  const loadFont = async (
    url: string | ArrayBuffer,
    { forceAutoHint = true } = {}
  ) => {
    let font;
    if (typeof url === "string") {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to load font");
      }
      font = await response.arrayBuffer();
    } else if (url instanceof ArrayBuffer) {
      font = url;
    } else {
      throw new Error("Invalid font source");
    }

    const [face] = FreeType.LoadFontFromBytes(new Uint8Array(font));

    /**
     * Creates a renderer for a specific font size.
     */
    const withSize = (
      size: number,
      handleNewGlyph: (
        code: number,
        char: string,
        glyph: FT_GlyphSlotRec
      ) => void = () => {}
    ) => {
      const cache = new Map<
        string,
        { glyph: FT_GlyphSlotRec; imageData: ImageData | null }
      >();
      function updateCache(str: string) {
        FreeType.SetFont(face.family_name, face.style_name);
        FreeType.SetCharmap(FreeType.FT_ENCODING_UNICODE);
        FreeType.SetPixelSize(0, size);

        // Get char codes without bitmaps
        const codes = [];
        for (const char of new Set(str)) {
          const point = char.codePointAt(0);
          if (!cache.has(char) && point !== undefined) {
            codes.push(point);
          }
        }

        // Populate missing bitmaps
        const newGlyphs = FreeType.LoadGlyphs(
          codes,
          FreeType.FT_LOAD_RENDER |
            FreeType.FT_LOAD_MONOCHROME |
            FreeType.FT_LOAD_TARGET_MONO |
            (forceAutoHint ? FreeType.FT_LOAD_FORCE_AUTOHINT : 0)
        );
        for (const [code, glyph] of newGlyphs) {
          const char = String.fromCodePoint(code);
          handleNewGlyph(code, char, glyph);
          cache.set(char, {
            glyph,
            imageData: glyph.bitmap.imagedata,
          });
        }
      }

      const draw = (
        ctx: CanvasRenderingContext2D,
        str: string,
        offsetx: number,
        offsety: number,
        { letterSpacing = 0 } = {}
      ) => {
        updateCache(str);
        let prev = null;
        for (const char of str) {
          const { glyph, imageData } = cache.get(char) || {};
          if (glyph) {
            // Kerning
            if (prev) {
              const kerning = FreeType.GetKerning(
                prev.glyph_index,
                glyph.glyph_index,
                0
              );
              offsetx += kerning.x >> 6;
            }

            if (imageData) {
              ctx.putImageData(
                imageData,
                offsetx + glyph.bitmap_left,
                offsety - glyph.bitmap_top
              );
            }

            offsetx += glyph.advance.x >> 6;
            offsetx += letterSpacing;
            prev = glyph;
          }
        }
      };

      const measure = (str: string, { letterSpacing = 0 } = {}) => {
        updateCache(str);
        let width = 0;
        let prev = null;
        for (const char of str) {
          const { glyph } = cache.get(char) || {};
          if (glyph) {
            if (prev) {
              const kerning = FreeType.GetKerning(
                prev.glyph_index,
                glyph.glyph_index,
                0
              );
              width += kerning.x >> 6;
              width += letterSpacing;
            }
            width += glyph.advance.x >> 6;
            prev = glyph;
          }
        }
        return width;
      };

      const getGlyph = (char: string) => {
        updateCache(char);
        return cache.get(char);
      };
      return { draw, measure, getGlyph };
    };
    return { withSize };
  };
  return { loadFont };
}

export type FreeTypeRenderer = Awaited<
  ReturnType<typeof createFreeTypeRenderer>
>;
export type LoadedFont = Awaited<ReturnType<FreeTypeRenderer["loadFont"]>>;
export type FontAtSize = Awaited<ReturnType<LoadedFont["withSize"]>>;
