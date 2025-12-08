import { useStore } from '@nanostores/react'
import { getRuntime } from './api'

export function useFrameResult() {
  const runtime = getRuntime()
  return useStore(runtime.$frame)
}
