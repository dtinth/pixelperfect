# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
# Development
pnpm install              # Install dependencies
pnpm run dev              # Start Vite dev server (HMR enabled)
pnpm run build            # Build for production (runs tsc + vite)
pnpm run lint             # Run ESLint with type checking
pnpm run preview          # Preview production build locally
```

## Architecture Overview

**PixelPerfect** is a reactive graphics generation system with an IMGUI-style API. Users define scenes (render functions) that imperatively call drawing commands, which reactively update a gallery view.

### Core Design Pattern: Imperative Runtime + Reactive UI

The architecture separates concerns cleanly:

1. **Imperative Runtime** (`src/packlets/runtime/`): Graphics rendering logic runs outside React
   - `RuntimeController`: Manages canvas creation, control values, frame updates
   - When a control value changes, `setValue()` triggers `runFrame()`
   - `runFrame()` clears canvases, calls user's render function, publishes results via nanostores atom
   - No React cycle involved—purely imperative and synchronous

2. **Reactive UI** (`src/App.tsx`): React only handles display
   - `useFrameResult()` hook subscribes to the `$frame` atom via nanostores
   - Changes to the atom trigger React re-renders
   - Clean separation: React doesn't know about graphics logic

### Directory Structure

```
src/packlets/runtime/          # Packlet: enforced module boundary via ESLint
├── index.ts                   # Public API exports only
├── controller.ts              # RuntimeController class (imperative logic)
├── api.ts                     # Public functions (createGraphics, group, setValue, etc.)
├── controls.ts                # slider, textBox implementations
├── react.tsx                  # RuntimeProvider component (minimal, just sets up controller)
├── hooks.ts                   # useFrameResult hook (in separate file for react-refresh)
└── types.ts                   # Interfaces (Graphics, ControlDef, FrameResult, etc.)

src/scenes/                    # User-defined render functions
├── index.ts                   # Scene loader using Vite's import.meta.glob()
└── example.ts                 # Example scene with render() export

src/App.tsx                    # Main UI: scene selector, control panel, canvas gallery
src/main.tsx                   # React entry point
```

### Packlets Module Boundary

The `@rushstack/eslint-plugin-packlets` rule enforces a clean API boundary:

- ✅ **Allowed**: `import { createGraphics, slider } from '../packlets/runtime'`
- ❌ **Error**: `import { RuntimeController } from '../packlets/runtime/controller'`

This prevents internal implementation details from leaking. Only exports from `index.ts` are usable.

### Scene Loading via Glob Imports

Vite's `import.meta.glob()` in `src/scenes/index.ts` discovers all `*.ts` files at build time:

```typescript
const scenes = import.meta.glob<{ render: () => void }>('./*.ts', { eager: true })
```

**Adding a new scene** is trivial: create `src/scenes/myScene.ts` with `export function render() { ... }`. No registration needed—the glob import automatically picks it up.

URL routing: `?scene=myScene` loads the scene dynamically. Defaults to `?scene=example`.

## Key Implementation Details

### RuntimeController Lifecycle

1. On app start: `RuntimeProvider` creates `RuntimeController`, calls `setRenderFn(userRenderFn)`
2. `setRenderFn()` calls `runFrame()` once to bootstrap
3. User interacts with control (slider/textBox)
4. `onChange` handler calls `setValue(key, newValue)`
5. `setValue()` updates internal `values` Map, calls `runFrame()`
6. `runFrame()`:
   - Clears `controls: []` and all canvas contexts
   - Calls user's render function (which calls `createGraphics`, `slider`, `textBox`, etc.)
   - Publishes frame result to `$frame` atom
7. React subscribes to `$frame` atom → renders updated UI

### Control Values Persist

Control values live in `RuntimeController.values` (a Map). Slider/textBox calls don't trigger React updates—they just read from this Map. Only `$frame` atom changes trigger React re-renders, keeping updates efficient.

### Canvas Caching by Name

`createGraphics(name, width, height)` maintains a persistent canvas registry. Same name = same canvas instance. Useful for composition: earlier renders create canvases that later renders can use via `ctx.drawImage()`.

## Type-Safe Linting

ESLint is configured with:

- `typescript-eslint` with `recommendedTypeChecked` (requires `projectService: true`)
- `@rushstack/eslint-plugin-packlets` for module boundary enforcement
- `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`

Run `pnpm run lint` to check both syntax and type-aware rules.

## Creating a New Scene

1. Create `src/scenes/myScene.ts`:
   ```typescript
   import { createGraphics, group, slider, textBox } from '../packlets/runtime'

   export function render() {
     group('myGraphics', () => {
       const val = slider('value', 50, { min: 0, max: 100 })
       const g = createGraphics('canvas', 200, 100)
       g.ctx.fillStyle = '#333'
       g.ctx.fillRect(0, 0, 200, 100)
       // ... more drawing code
     })
   }
   ```

2. Restart dev server or reload page. The scene appears in the dropdown automatically.

## Important Notes

- **No React context for runtime**: The controller is purely imperative. nanostores handles the only reactive boundary (the `$frame` atom).
- **Canvas clears each frame**: All canvases are cleared at the start of `runFrame()`. This makes logic stateless and predictable.
- **Controls are stateless from user perspective**: The user never manages control state. They just call `slider()` and it returns the current value. The framework handles persistence.
- **ESLint packlets rule is strict**: Only packlet exports are allowed. This enforces a clean public API.
- **Type checking is strict**: `tsconfig.json` has `noUnusedLocals`, `noUnusedParameters`, `strict: true`. Be explicit about types.

## See Also

- `SPEC.md`: Detailed architecture, design patterns, and full API documentation
- `eslint.config.js`: ESLint configuration with type-aware and packlets rules
