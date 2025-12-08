import type { SliderOpts } from './types'
import { registerControl, getValue, getCurrentKey } from './api'

export function slider(name: string, defaultValue: number, opts?: SliderOpts): number {
  const key = getCurrentKey(name)

  registerControl({
    key,
    type: 'slider',
    label: name,
    defaultValue,
    opts: {
      min: opts?.min ?? 0,
      max: opts?.max ?? 100,
      step: opts?.step ?? 1,
    },
  })

  return getValue(key, defaultValue)
}

export function textBox(name: string, defaultValue: string): string {
  const key = getCurrentKey(name)

  registerControl({
    key,
    type: 'textbox',
    label: name,
    defaultValue,
  })

  return getValue(key, defaultValue)
}
