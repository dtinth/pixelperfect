import { useState } from 'react'
import { RuntimeProvider, useFrameResult, setValue, type ControlDef, type Graphics } from './packlets/runtime'
import { getScenes, getScene } from './scenes'
import './App.css'

function App() {
  const params = new URLSearchParams(window.location.search)
  const sceneName = params.get('scene') || 'example'
  const renderFn = getScene(sceneName)

  if (!renderFn) {
    return <div style={{ padding: '20px' }}>Scene "{sceneName}" not found</div>
  }

  return (
    <RuntimeProvider onRender={renderFn}>
      <AppContent sceneNames={Object.keys(getScenes())} selectedScene={sceneName} />
    </RuntimeProvider>
  )
}

function AppContent({ sceneNames, selectedScene }: { sceneNames: string[]; selectedScene: string }) {
  const frame = useFrameResult()

  const handleSceneChange = (sceneName: string) => {
    window.location.search = `?scene=${sceneName}`
  }

  // Group controls by prefix
  const groupedControls = new Map<string, ControlDef[]>()

  frame.controls.forEach((control) => {
    const parts = control.key.split('.')
    const groupKey = parts.length > 1 ? parts.slice(0, -1).join('.') : ''
    if (!groupedControls.has(groupKey)) {
      groupedControls.set(groupKey, [])
    }
    groupedControls.get(groupKey)!.push(control)
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', gap: '20px', padding: '20px' }}>
      {/* Control Panel */}
      <div style={{ width: '300px', flexShrink: 0 }}>
        <h2>PixelPerfect</h2>
        <div style={{ marginBottom: '16px', border: '1px solid #333', padding: '8px', borderRadius: '4px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
            Scene
          </label>
          <select
            value={selectedScene}
            onChange={(e) => handleSceneChange(e.target.value)}
            style={{ width: '100%', padding: '4px', background: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
          >
            {sceneNames
              .sort()
              .map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
          </select>
        </div>
        <h3>Controls</h3>
        {Array.from(groupedControls.entries()).map(([groupKey, controls]) => (
          <ControlGroup key={groupKey} groupKey={groupKey} controls={controls} />
        ))}
      </div>

      {/* Gallery */}
      <div style={{ flex: 1 }}>
        <h2>Gallery</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {Array.from(frame.canvases.entries()).map(([key, graphics]: [string, Graphics]) => (
            <CanvasCard key={key} name={key} graphics={graphics} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ControlGroup({ groupKey, controls }: { groupKey: string; controls: ControlDef[] }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ marginBottom: '16px', border: '1px solid #333', padding: '8px', borderRadius: '4px' }}>
      {groupKey && (
        <div
          style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '▶' : '▼'} {groupKey}
        </div>
      )}
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {controls.map(control => (
            <Control key={control.key} control={control} />
          ))}
        </div>
      )}
    </div>
  )
}

function Control({ control }: { control: ControlDef }) {
  if (control.type === 'slider') {
    return (
      <div>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          {control.label}
        </label>
        <input
          type="range"
          min={control.opts?.min ?? 0}
          max={control.opts?.max ?? 100}
          step={control.opts?.step ?? 1}
          defaultValue={control.defaultValue}
          onChange={(e) => setValue(control.key, Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: '11px', color: '#888' }}>
          {control.opts?.min ?? 0} - {control.opts?.max ?? 100}
        </div>
      </div>
    )
  }

  if (control.type === 'textbox') {
    return (
      <div>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          {control.label}
        </label>
        <input
          type="text"
          defaultValue={control.defaultValue}
          onChange={(e) => setValue(control.key, e.target.value)}
          style={{ width: '100%', padding: '4px', background: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
        />
      </div>
    )
  }

  return null
}

function CanvasCard({ name, graphics }: { name: string; graphics: Graphics }) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.download = `${name}.png`
    link.href = graphics.canvas.toDataURL()
    link.click()
  }

  return (
    <div style={{ border: '1px solid #333', padding: '12px', borderRadius: '4px' }}>
      <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>{name}</div>
      <canvas
        ref={(el) => {
          if (el && el !== graphics.canvas) {
            el.replaceWith(graphics.canvas)
          }
        }}
        style={{ display: 'block', maxWidth: '100%', cursor: 'pointer', border: '1px solid #555' }}
        onClick={handleDownload}
      />
    </div>
  )
}

export default App
