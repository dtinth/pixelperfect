import { atom } from 'nanostores'
import type { Graphics, ControlDef, FrameResult } from './types'

export class RuntimeController {
  $frame = atom<FrameResult>({ canvases: new Map(), controls: [] })

  private values = new Map<string, unknown>()
  private canvases = new Map<string, Graphics>()
  private controls: ControlDef[] = []
  private prefixStack: string[] = []
  private renderFn: (() => void) | null = null

  setRenderFn(fn: () => void) {
    this.renderFn = fn
    this.runFrame()
  }

  setValue(key: string, value: unknown) {
    this.values.set(key, value)
    this.runFrame()
  }

  getValue<T>(key: string, defaultValue: T): T {
    if (this.values.has(key)) {
      return this.values.get(key) as T
    }
    return defaultValue
  }

  getCurrentKey(name: string): string {
    if (this.prefixStack.length === 0) {
      return name
    }
    return [...this.prefixStack, name].join('.')
  }

  createGraphics(name: string, width: number, height: number): Graphics {
    const key = this.getCurrentKey(name)
    let graphics = this.canvases.get(key)

    if (!graphics) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      graphics = { canvas, ctx }
      this.canvases.set(key, graphics)
    } else {
      if (graphics.canvas.width !== width || graphics.canvas.height !== height) {
        graphics.canvas.width = width
        graphics.canvas.height = height
      }
    }

    return graphics
  }

  group<T>(name: string, fn: () => T): T {
    this.prefixStack.push(name)
    try {
      return fn()
    } finally {
      this.prefixStack.pop()
    }
  }

  registerControl(control: ControlDef) {
    this.controls.push(control)
  }

  private runFrame() {
    if (!this.renderFn) return

    // Clear controls
    this.controls = []

    // Clear all canvases
    this.canvases.forEach(g => {
      g.ctx.clearRect(0, 0, g.canvas.width, g.canvas.height)
    })

    // Run user's render function
    this.renderFn()

    // Publish to React
    this.$frame.set({
      canvases: this.canvases,
      controls: [...this.controls],
    })
  }
}
