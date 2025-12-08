# PixelPerfect Spec

A reactive system for generating pixel-perfect graphics using HTML Canvas 2D, with an IMGUI-style API.

## Core Concepts

- **Immediate mode**: Call drawing commands each frame, framework handles canvas reuse
- **Reactive controls**: IMGUI-style controls (sliders, text boxes) that render UI and return values
- **Grouping**: Namespace controls and canvases for reusable components
- **Auto-gallery**: All created canvases displayed automatically

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
- Name is prefixed with current group stack (e.g., `label.canvas`)

### `group<T>(name: string, fn: () => T): T`

Groups controls and canvases under a namespace.

```typescript
const result = group('label', () => {
  const size = slider('size', 24)  // key becomes 'label.size'
  const g = createGraphics('out', 100, 50)  // key becomes 'label.out'
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

## Architecture

```
src/
├── lib/
│   ├── runtime.tsx     # createGraphics, group, render loop, context
│   ├── controls.tsx    # slider, textBox implementations
│   └── types.ts        # shared types
├── render.ts           # user's render function
├── App.tsx             # main app with gallery + controls
└── main.tsx            # entry point
```

## Implementation Details

### Runtime Context

Use React context to provide runtime state to controls:

```typescript
interface RuntimeState {
  // Canvas registry: key -> { canvas, ctx }
  canvases: Map<string, Graphics>

  // Control values: key -> current value
  values: Map<string, unknown>

  // Controls to render: collected during render pass
  controls: ControlDef[]

  // Current group prefix stack
  prefixStack: string[]
}
```

### Render Loop

1. User calls `render()` function
2. `render()` calls `createGraphics`, `slider`, `textBox`, etc.
3. These register canvases and controls in runtime state
4. After render, React displays:
   - All canvases in a gallery grid
   - All controls in a panel (grouped by prefix)
5. When control value changes, trigger re-render

### Control Panel UI

- Controls grouped by their prefix (collapsible sections)
- Format: `[group name]` as section header, then controls within
- Each control shows its short name (without prefix)

### Gallery UI

- Grid of all canvases
- Show canvas name above each
- Click to download as PNG (filename = canvas name + .png)

## Example render.ts

```typescript
import { createGraphics, group, slider, textBox } from './lib/runtime'

export function render() {
  // A simple label
  group('label', () => {
    const text = textBox('text', 'Hello World')
    const fontSize = slider('fontSize', 24, { min: 12, max: 48 })
    const bg = textBox('bg', '#1a1a2e')
    const fg = textBox('fg', '#eef')

    const g = createGraphics('out', 300, 60)
    const { ctx } = g

    // Background
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 300, 60)

    // Text
    ctx.fillStyle = fg
    ctx.font = `${fontSize}px monospace`
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 16, 30)
  })

  // A reusable badge component
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

  // Multiple badges
  const onlineBadge = badge('badge-online', { text: 'Online', color: '#22c55e' })
  const offlineBadge = badge('badge-offline', { text: 'Offline', color: '#ef4444' })

  // Composed graphic
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

## Implementation Order

1. **types.ts** - Define interfaces (Graphics, RuntimeState, ControlDef, SliderOpts)
2. **runtime.tsx** - Implement RuntimeContext, createGraphics, group, and the provider
3. **controls.tsx** - Implement slider, textBox using the runtime context
4. **App.tsx** - Gallery grid + control panel UI
5. **render.ts** - Example graphics to test the system

## Notes

- Keep it simple. Raw `ctx` access, no wrapper methods.
- Canvas clears each frame - stateless, predictable.
- Control values persist until page refresh (useState in runtime).
- No fancy state management - React useState + context is enough.
