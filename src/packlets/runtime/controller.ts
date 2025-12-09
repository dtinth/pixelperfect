import { atom } from "nanostores";
import type { ControlDef, FrameResult, Graphics, MessageDef } from "./types";

export class RuntimeController {
  $frame = atom<FrameResult>({
    canvases: new Map(),
    controls: [],
    messages: [],
  });

  private values = new Map<string, unknown>();
  private canvases = new Map<string, Graphics>();
  private controls: ControlDef[] = [];
  private messages: MessageDef[] = [];
  private prefixStack: string[] = [];
  private renderFn: (() => void) | null = null;
  private resources = new Map<string, unknown>();
  private messageCounter = 0;

  setRenderFn(fn: () => void) {
    this.renderFn = fn;
    this.requestRerender();
  }

  setValue(key: string, value: unknown) {
    this.values.set(key, value);
    this.requestRerender();
  }

  getValue<T>(key: string, defaultValue: T): T {
    if (this.values.has(key)) {
      return this.values.get(key) as T;
    }
    return defaultValue;
  }

  getCurrentKey(name: string): string {
    if (this.prefixStack.length === 0) {
      return name;
    }
    return [...this.prefixStack, name].join(".");
  }

  createGraphics(name: string, width: number, height: number): Graphics {
    const key = this.getCurrentKey(name);
    let graphics = this.canvases.get(key);

    if (!graphics) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      graphics = { canvas, ctx, loading: () => {}, isLoading: () => false };
      this.canvases.set(key, graphics);
    } else {
      if (
        graphics.canvas.width !== width ||
        graphics.canvas.height !== height
      ) {
        graphics.canvas.width = width;
        graphics.canvas.height = height;
      }
    }

    let loading = false;
    graphics.loading = () => {
      loading = true;
    };
    graphics.isLoading = () => loading;

    return graphics;
  }

  group<T>(name: string, fn: () => T): T {
    this.prefixStack.push(name);
    try {
      return fn();
    } finally {
      this.prefixStack.pop();
    }
  }

  registerControl(control: ControlDef) {
    this.controls.push(control);
  }

  handleButtonClick(key: string) {
    const control = this.controls.find(
      (c) => c.key === key && c.type === "button"
    );
    if (control && control.onClick) {
      control.onClick();
    }
  }

  addMessage(type: "info" | "error", message: string) {
    const key = this.getCurrentKey(`msg-${this.messageCounter++}`);
    this.messages.push({ key, type, message });
  }

  resource<T>(name: string, factory: () => T): T {
    const key = this.getCurrentKey(name);

    if (!this.resources.has(key)) {
      this.resources.set(key, factory());
    }

    return this.resources.get(key) as T;
  }

  clearResources() {
    for (const resource of this.resources.values()) {
      if (
        resource &&
        typeof resource === "object" &&
        Symbol.dispose in resource
      ) {
        (resource as { [Symbol.dispose]: () => void })[Symbol.dispose]();
      }
    }
    this.resources.clear();
  }

  runFrame() {
    if (!this.renderFn) return;

    // Clear controls and messages
    this.controls = [];
    this.messages = [];
    this.messageCounter = 0;

    // Clear all canvases
    this.canvases.forEach((g) => {
      g.ctx.clearRect(0, 0, g.canvas.width, g.canvas.height);
    });

    // Run user's render function
    this.renderFn();

    // Publish to React
    this.$frame.set({
      canvases: this.canvases,
      controls: [...this.controls],
      messages: [...this.messages],
    });
  }

  activeRaf: number | null = null;
  requestRerender() {
    if (this.activeRaf !== null) {
      cancelAnimationFrame(this.activeRaf);
      this.activeRaf = null;
    }
    this.activeRaf = requestAnimationFrame(() => {
      this.activeRaf = null;
      this.runFrame();
    });
  }
}
