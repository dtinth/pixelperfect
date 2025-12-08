# PixelPerfect Spec

A reactive system for generating pixel-perfect graphics using HTML Canvas 2D, with an IMGUI-style API.

## Core Concepts

- **Immediate mode**: Call drawing commands each frame, framework handles canvas reuse
- **Reactive controls**: IMGUI-style controls (sliders, text boxes) that render UI and return values
- **Grouping**: Namespace controls and canvases for reusable components
- **Auto-gallery**: All created canvases displayed automatically
- **Scenes**: Multiple render functions defined in `src/scenes/*.ts`, switchable via URL params
- **Packlets**: Enforced module boundaries with `@rushstack/eslint-plugin-packlets`

## API

### `createGraphics(name: string, width: number, height: number): Graphics`

Creates or reuses a canvas with the given name.

```typescript
interface Graphics {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}
```

- Same name = same canvas instance across frames
- Canvas is cleared at start of each frame
- If size changes, canvas is resized (and cleared)
- Name is prefixed with current group stack (e.g., `label.out`)

### `group<T>(name: string, fn: () => T): T`

Groups controls and canvases under a namespace.

```typescript
const result = group('label', () => {
  const size = slider('size', 24)  // key becomes 'label.size'
  const g = createGraphics('out', 100, 50)  // name becomes 'label.out'
  return g.canvas
})
```

- Pushes name onto prefix stack, runs fn, pops
- Nested groups accumulate: `a.b.c`
- Returns whatever fn returns

### `slider(name: string, defaultValue: number, opts?: SliderOpts): number`

```typescript
interface SliderOpts {
  min?: number   // default 0
  max?: number   // default 100
  step?: number  // default 1
}
```

- Renders a slider in the control panel
- Returns current value (default on first frame)
- Key is prefixed with group stack

### `textBox(name: string, defaultValue: string): string`

- Renders a text input in the control panel
- Returns current value
- Key is prefixed with group stack

## Architecture

```
src/
├── packlets/
│   └── runtime/           # Packlet boundary
│       ├── index.ts       # Public exports only
│       ├── controller.ts  # RuntimeController class
│       ├── api.ts         # createGraphics, group, setValue, etc.
│       ├── controls.ts    # slider, textBox implementations
│       ├── react.tsx      # RuntimeProvider component
│       ├── hooks.ts       # useFrameResult hook
│       └── types.ts       # Core interfaces
├── scenes/                # User-defined scenes
│   ├── index.ts           # Scene loader with glob imports
│   └── example.ts         # Example scene (render function)
├── App.tsx                # Main app with gallery + controls + scene selector
└── main.tsx               # Entry point
```

## Implementation Details

### RuntimeController

Core imperative runtime logic (not React):

```typescript
class RuntimeController {
  $frame = atom<FrameResult>()  // Published to React via nanostores

  setValue(key, value)          // Update control value
  getValue(key, default)        // Read control value
  createGraphics(name, w, h)    // Create/reuse canvas
  group(name, fn)               // Push/pop namespace
  registerControl(control)      // Collect control definition
  setRenderFn(fn)               // Set user's render function
}
```

**Key insight**: Controller runs imperatively during `setValue()` calls, triggering `runFrame()` which:
1. Clears controls and canvases
2. Calls user's render function
3. Publishes frame result to React via nanostores

### Render Loop

User defines scenes in `src/scenes/*.ts`:

```typescript
// src/scenes/example.ts
export function render() {
  group('label', () => {
    const text = textBox('text', 'Hello World')
    const g = createGraphics('out', 300, 60)
    // ... drawing code
  })
}
```

Runtime flow:
1. App loads scene from URL param `?scene=name` (defaults to `example`)
2. `RuntimeProvider` creates RuntimeController and sets render function
3. User changes a control value
4. `setValue()` triggers `controller.runFrame()`
5. Frame result published to nanostores
6. React re-renders to display updated canvases/controls

### Control Panel UI

- Scene selector dropdown at top
- Controls grouped by their prefix (collapsible sections)
- Each control shows its short name (without prefix)
- Input changes trigger `setValue()` which updates render

### Gallery UI

- Grid of all canvases
- Show canvas name above each
- Click to download as PNG (filename = canvas name + .png)

### Scene Loading

Vite's `import.meta.glob()` discovers all `src/scenes/*.ts` files at build time:

```typescript
// src/scenes/index.ts
const scenes = import.meta.glob<{ render: () => void }>('./*.ts', { eager: true })

export function getScene(name: string) {
  // Extract scene name from path and return render function
}
```

Adding a new scene is as simple as creating `src/scenes/myScene.ts` with a `render()` export.

## Example Scene

```typescript
import { createGraphics, group, slider, textBox } from '../packlets/runtime'

export function render() {
  group('label', () => {
    const text = textBox('text', 'Hello World')
    const fontSize = slider('fontSize', 24, { min: 12, max: 48 })
    const bg = textBox('bg', '#1a1a2e')
    const fg = textBox('fg', '#eef')

    const g = createGraphics('out', 300, 60)
    const { ctx } = g

    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 300, 60)

    ctx.fillStyle = fg
    ctx.font = `${fontSize}px monospace`
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 16, 30)
  })

  // Reusable component
  function badge(name: string, defaults: { text: string; color: string }) {
    return group(name, () => {
      const text = textBox('text', defaults.text)
      const color = textBox('color', defaults.color)

      const g = createGraphics('out', 80, 28)
      const { ctx } = g

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(0, 0, 80, 28, 6)
      ctx.fill()

      ctx.fillStyle = '#fff'
      ctx.font = '14px monospace'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.fillText(text, 40, 14)

      return g.canvas
    })
  }

  const onlineBadge = badge('badge-online', { text: 'Online', color: '#22c55e' })
  const offlineBadge = badge('badge-offline', { text: 'Offline', color: '#ef4444' })

  group('status-bar', () => {
    const g = createGraphics('out', 200, 80)
    const { ctx } = g

    ctx.fillStyle = '#333'
    ctx.fillRect(0, 0, 200, 80)

    ctx.drawImage(onlineBadge, 16, 16)
    ctx.drawImage(offlineBadge, 16, 48)
  })
}
```

## Key Design Patterns

### Packlets Module Boundary

The `src/packlets/runtime/` packlet enforces clean API:

```typescript
// ✅ Allowed: import from packlet entry point
import { createGraphics, group, slider } from '../packlets/runtime'

// ❌ Error: internal file import (ESLint packlets rule)
import { RuntimeController } from '../packlets/runtime/controller'
```

### Imperative Runtime, Reactive UI

The controller manages graphics rendering imperatively (outside React):
- Not tied to React's render cycle
- `setValue()` directly triggers frame updates
- nanostores atom syncs results to React for display
- Clean separation: controller is pure logic, React is just display

### Scene Composition

Scenes can be simple or complex:

```typescript
// Simple: just controls and graphics
export function render() {
  const val = slider('x', 0, { min: 0, max: 100 })
  // ... use val
}

// Complex: reusable components, composition
export function render() {
  const canvas1 = myComponent('comp1', { ... })
  const canvas2 = myComponent('comp2', { ... })

  group('combined', () => {
    const g = createGraphics('out', 400, 200)
    g.ctx.drawImage(canvas1, 0, 0)
    g.ctx.drawImage(canvas2, 200, 0)
  })
}
```

## Notes

- Keep it simple. Raw `ctx` access, no wrapper methods.
- Canvas clears each frame - stateless, predictable.
- Control values persist via nanostores Map (survives page reloads within session).
- No fancy state management - nanostores atoms are minimal and explicit.
- ESLint packlets enforcement prevents internal APIs from leaking.
