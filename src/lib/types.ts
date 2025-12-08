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

export interface RuntimeState {
  canvases: Map<string, Graphics>
  values: Map<string, unknown>
  controls: ControlDef[]
  prefixStack: string[]
}
