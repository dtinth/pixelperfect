export interface Graphics {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  loading: () => void;
  isLoading: () => boolean;
  filename?: string;
}

export interface SliderOpts {
  min?: number;
  max?: number;
  step?: number;
}

export interface ControlDef {
  key: string;
  type: "slider" | "textbox" | "button";
  label: string;
  defaultValue: number | string;
  opts?: SliderOpts;
  onClick?: () => void | Promise<void>;
}

export interface MessageDef {
  key: string;
  type: "info" | "error";
  message: string;
}

export interface FrameResult {
  canvases: Map<string, Graphics>;
  controls: ControlDef[];
  messages: MessageDef[];
}

export interface ResourceContext {
  requestRerender: () => void;
}

export interface Disposable {
  [Symbol.dispose](): void;
}
