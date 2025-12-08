export interface Graphics {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

export interface SliderOpts {
  min?: number
  max?: number
  step?: number
}

export interface ControlDef {
  key: string
  type: 'slider' | 'textbox'
  label: string
  defaultValue: number | string
  opts?: SliderOpts
}

export interface FrameResult {
  canvases: Map<string, Graphics>
  controls: ControlDef[]
}

export interface ResourceContext {
  requestRerender: () => void
}

export interface Disposable {
  [Symbol.dispose](): void
}
