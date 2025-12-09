# PixelPerfect

A tool for procedurally generating graphics. I primarily use it to generate labels for thermal printers (180dpi, monochrome), but it's general-purpose enough for other kinds of asset generation.

It provides:

- Canvases with reactive parameters (sliders, text inputs, buttons)
- Procedural graphics generation via an imperative API (inspired by ImGui)
- File system access for loading proprietary assets (fonts, images)
- TrueType font rendering optimized for low-DPI monochrome printing (based on `freetype-wasm`)
- QR code generation

![](https://im.dt.in.th/ipfs/bafybeign7gdadmb337jndknozq7z5yynsuadlr3p6x7pcxccrf567kzrw4/image.webp)

## Quick Example

See [`src/scenes/example.ts`](src/scenes/example.ts) for an example. [Preview it live](https://pixel-perfect.pages.dev/).

<em>(Note: Most scenes starting with `dtinth_` will not render correctly as they rely on proprietary assets.)</em>

## Creating a Scene

Each scene is a TypeScript file in `src/scenes/` that exports a `render()` function:

```typescript
import * as px from "../packlets/runtime";

export function render() {
  // Imperative code runs here synchronously
}
```

The `render()` function is called whenever a parameter changes (slider, text input, button click) or when async operations complete (image loading, file system access). It runs top-to-bottom, imperatively drawing to canvases.

### Parameters and Controls

Parameters are created on-the-fly as your code calls control functions:

```typescript
const text = px.textBox("text", "Hello World");
```

This registers a text input control and returns the current value. When the user changes the input, `render()` is called again. This time, `textBox()` will returns the updated value, allowing subsequent drawing code to use it.

### Async Operations

Some operations are async (loading files, images, fonts). On first render, they return a "loading" state. Once ready, `render()` is called again.

```typescript
const img = px.image("logo", "https://example.com/logo.png");
if (img.loaded) {
  ctx.drawImage(img.image, 0, 0);
} else g.loading();
```

## API Reference

- **`px.createGraphics(name, width, height)`** &rarr; `g` - Create or retrieve a canvas (same name = same instance (cached)), returns a Graphics object.
  - `g.ctx` - CanvasRenderingContext2D
  - `g.canvas` - HTMLCanvasElement
  - `g.loading()` - Mark graphics as loading (shows loading overlay in UI)
  - `g.filename` - Set suggested filename for download (e.g., "label.png")
- **`px.group(name, fn)`** - Namespace controls with dot notation (e.g., "group.size").
- **`px.slider(name, initialValue, { min?, max?, step? })`** - Range slider, returns current value.
- **`px.textBox(name, initialValue)`** - Text input, returns current value.
- **`px.params`** - Access URL query parameters as an object.
- **`px.button(name, label, onClick)`** - Button that calls a callback when clicked.
- **`px.showInfo(message)`** - Display an info message (green).
- **`px.showError(message)`** - Display an error message (red).
- **`px.resource(name, factory)`** - Persist objects across frames. Factory runs once.
- **`px.weakResource(key, factory)`** - Create derived resource from another object. Recreates when key changes.
- **`px.requestRerender()`** - Request a re-render (useful after async operations or state changes).

These APIs are built on top of `px.resource`:

- **`px.image(name, url)`** &rarr; `img` - Load an image asynchronously. If `url` is null, you get a placeholder object (`{ loaded: false }`) that is not cached.
  - `img.image` - HTMLImageElement
  - `img.loaded` - Boolean indicating if the image is loaded
- **`px.fileSystem(key)`** &rarr; `fs` - Access user's file system. This will render a button to let user pick a directory. Useful for loading proprietary assets that should not be hosted publicly. Until permission is granted, all file accesses return placeholder objects.
  - `fs.file(name)` &rarr; `file` - Access a file in the directory.
    - `file.loaded` - Boolean indicating if the file contents is loaded
    - `file.data` - ArrayBuffer of file contents
    - `file.url` - Object URL (for use with `px.image()`)
- **`px.freeTypeRenderer(fontData)`** &rarr; - Render TrueType fonts optimized for low-DPI monochrome printing. Takes in font data as ArrayBuffer (or null, for placeholder).
  - **`font.textGraphics(name, size, text, { lineHeight?, letterSpacing? })`** - Generate text as a canvas. Returns a Graphics (or null, if font not loaded yet).
- **`px.qrGraphics(data, { scale, invert, ecc })`** - Generate a QR code as a canvas. Returns a Graphics.

## Development

```bash
pnpm install
pnpm run dev     # Start dev server with HMR
pnpm run build   # Build for production
pnpm run lint    # Type-check + ESLint
```

## Creating a Scene

1. Create `src/scenes/myScene.ts`
2. Export a `render()` function
3. Visit `?scene=myScene`

The scene picker and controls panel auto-generate from your code.
