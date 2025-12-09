import { RuntimeController } from "./controller";
import type { ControlDef, Graphics } from "./types";

// Global runtime instance
let currentRuntime: RuntimeController | null = null;

export function getRuntime(): RuntimeController {
  if (!currentRuntime) {
    throw new Error("Runtime not initialized");
  }
  return currentRuntime;
}

export function setCurrentRuntime(runtime: RuntimeController) {
  currentRuntime = runtime;
}

// Public API
export function createGraphics(
  name: string,
  width: number,
  height: number
): Graphics {
  return getRuntime().createGraphics(name, width, height);
}

export function group<T>(name: string, fn: () => T): T {
  return getRuntime().group(name, fn);
}

export function registerControl(control: ControlDef) {
  getRuntime().registerControl(control);
}

export function getValue<T>(key: string, defaultValue: T): T {
  return getRuntime().getValue(key, defaultValue);
}

export function setValue(key: string, value: unknown) {
  getRuntime().setValue(key, value);
}

export function getCurrentKey(name: string): string {
  return getRuntime().getCurrentKey(name);
}

export function resource<T>(name: string, factory: () => T): T {
  return getRuntime().resource(name, factory);
}

const weakResourceMap = new WeakMap<object, unknown>();
export function weakResource<T>(key: object, factory: () => T): T {
  const existing = weakResourceMap.get(key) as T | undefined;
  if (existing) {
    return existing;
  }
  const newResource = factory();
  weakResourceMap.set(key, newResource);
  return newResource;
}

export function addMessage(type: "info" | "error", message: string) {
  getRuntime().addMessage(type, message);
}

export function handleButtonClick(key: string) {
  getRuntime().handleButtonClick(key);
}

export function requestRerender() {
  getRuntime().requestRerender();
}

export const params = Object.fromEntries(
  new URLSearchParams(window.location.search)
);
