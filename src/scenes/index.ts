const scenes = import.meta.glob<{ render: () => void }>('./*.ts', { eager: true })

export function getScenes() {
  const sceneMap: Record<string, () => void> = {}
  for (const [path, module] of Object.entries(scenes)) {
    // Extract scene name from path: './example.ts' -> 'example'
    const name = path.replace('./', '').replace('.ts', '')
    sceneMap[name] = module.render
  }
  return sceneMap
}

export function getScene(name: string): (() => void) | null {
  const scenes = getScenes()
  return scenes[name] || null
}
