import { useState, type ReactNode } from 'react'
import { RuntimeController } from './controller'
import { setCurrentRuntime } from './api'

export function RuntimeProvider({ children, onRender }: { children: ReactNode, onRender: () => void }) {
  useState(() => {
    const c = new RuntimeController()
    setCurrentRuntime(c)
    c.setRenderFn(onRender)
    return c
  })

  return <>{children}</>
}
