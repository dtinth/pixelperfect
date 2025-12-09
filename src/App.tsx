import { useState } from "react";
import "./App.css";
import {
  handleButtonClick,
  RuntimeProvider,
  setValue,
  useFrameResult,
  type ControlDef,
  type Graphics,
} from "./packlets/runtime";
import { getScene, getScenes } from "./scenes";

function App() {
  const params = new URLSearchParams(window.location.search);
  const sceneName = params.get("scene") || "example";
  const renderFn = getScene(sceneName);

  if (!renderFn) {
    return <div style={{ padding: "20px" }}>Scene "{sceneName}" not found</div>;
  }

  return (
    <RuntimeProvider onRender={renderFn}>
      <AppContent
        sceneNames={Object.keys(getScenes())}
        selectedScene={sceneName}
      />
    </RuntimeProvider>
  );
}

function AppContent({
  sceneNames,
  selectedScene,
}: {
  sceneNames: string[];
  selectedScene: string;
}) {
  const frame = useFrameResult();

  const handleSceneChange = (sceneName: string) => {
    window.location.search = `?scene=${sceneName}`;
  };

  // Group controls by prefix
  const groupedControls = new Map<string, ControlDef[]>();

  frame.controls.forEach((control) => {
    const parts = control.key.split(".");
    const groupKey = parts.length > 1 ? parts.slice(0, -1).join(".") : "";
    if (!groupedControls.has(groupKey)) {
      groupedControls.set(groupKey, []);
    }
    groupedControls.get(groupKey)!.push(control);
  });

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        gap: "20px",
        padding: "20px",
      }}
    >
      {/* Control Panel */}
      <div style={{ width: "300px", flexShrink: 0 }}>
        <h2>PixelPerfect</h2>
        <div
          style={{
            marginBottom: "16px",
            border: "1px solid #333",
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: "12px",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            Scene
          </label>
          <select
            value={selectedScene}
            onChange={(e) => handleSceneChange(e.target.value)}
            style={{
              width: "100%",
              padding: "4px",
              background: "#1a1a1a",
              border: "1px solid #333",
              color: "#fff",
            }}
          >
            {sceneNames.sort().map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <h3>Controls</h3>
        {Array.from(groupedControls.entries()).map(([groupKey, controls]) => (
          <ControlGroup
            key={groupKey}
            groupKey={groupKey}
            controls={controls}
          />
        ))}
      </div>

      {/* Gallery */}
      <div style={{ flex: 1 }}>
        <h2>Gallery</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {Array.from(frame.canvases.entries()).map(
            ([key, graphics]: [string, Graphics]) => (
              <CanvasCard key={key} name={key} graphics={graphics} />
            )
          )}
        </div>
        {frame.messages.length > 0 && (
          <div
            style={{
              marginTop: "30px",
              border: "1px solid #444",
              padding: "16px",
              borderRadius: "4px",
              background: "#1a1a1a",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Messages</h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {frame.messages.map((msg) => (
                <div
                  key={msg.key}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "4px",
                    fontSize: "13px",
                    background: msg.type === "error" ? "#3a1a1a" : "#1a3a1a",
                    color: msg.type === "error" ? "#ff6b6b" : "#6bff6b",
                    border: `1px solid ${
                      msg.type === "error" ? "#5a2a2a" : "#2a5a2a"
                    }`,
                  }}
                >
                  {msg.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ControlGroup({
  groupKey,
  controls,
}: {
  groupKey: string;
  controls: ControlDef[];
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        marginBottom: "16px",
        border: "1px solid #333",
        padding: "8px",
        borderRadius: "4px",
      }}
    >
      {groupKey && (
        <div
          style={{ cursor: "pointer", fontWeight: "bold", marginBottom: "8px" }}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "▶" : "▼"} {groupKey}
        </div>
      )}
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {controls.map((control) => (
            <Control key={control.key} control={control} />
          ))}
        </div>
      )}
    </div>
  );
}

function Control({ control }: { control: ControlDef }) {
  if (control.type === "slider") {
    return (
      <div>
        <label
          style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}
        >
          {control.label}
        </label>
        <input
          type="range"
          min={control.opts?.min ?? 0}
          max={control.opts?.max ?? 100}
          step={control.opts?.step ?? 1}
          defaultValue={control.defaultValue}
          onChange={(e) => setValue(control.key, Number(e.target.value))}
          style={{ width: "100%" }}
        />
        <div style={{ fontSize: "11px", color: "#888" }}>
          {control.opts?.min ?? 0} - {control.opts?.max ?? 100}
        </div>
      </div>
    );
  }

  if (control.type === "textbox") {
    return (
      <div>
        <label
          style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}
        >
          {control.label}
        </label>
        <input
          type="text"
          defaultValue={control.defaultValue}
          onChange={(e) => setValue(control.key, e.target.value)}
          style={{
            width: "100%",
            padding: "4px",
            background: "#1a1a1a",
            border: "1px solid #333",
            color: "#fff",
          }}
        />
      </div>
    );
  }

  if (control.type === "button") {
    return (
      <button
        onClick={() => handleButtonClick(control.key)}
        style={{
          width: "100%",
          padding: "8px",
          background: "#2a5c8a",
          border: "1px solid #3a7caa",
          color: "#fff",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        {control.label}
      </button>
    );
  }

  return null;
}

function CanvasCard({ name, graphics }: { name: string; graphics: Graphics }) {
  return (
    <div
      style={{
        border: "1px solid #333",
        padding: "12px",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
      className="CanvasCard"
    >
      <div
        style={{ fontSize: "14px", marginBottom: "8px", fontWeight: "bold" }}
      >
        {name}
      </div>
      <div
        style={{ position: "relative" }}
        draggable={true}
        onDragStart={(e) => {
          const filename = graphics.filename || `${name}.png`;
          const dataUrl = graphics.canvas.toDataURL();
          e.dataTransfer.clearData();
          e.dataTransfer.setData(
            "DownloadURL",
            ["image/png", filename, dataUrl].join(":")
          );
        }}
      >
        <canvas
          ref={(el) => {
            if (el && el !== graphics.canvas) {
              el.replaceWith(graphics.canvas);
            }
          }}
        />
        {graphics.isLoading() && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              fontSize: "16px",
              pointerEvents: "none",
            }}
          >
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
