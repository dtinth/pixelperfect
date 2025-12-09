import reactLogo from "../assets/react.svg?url";
import {
  button,
  createGraphics,
  group,
  image,
  requestRerender,
  resource,
  showError,
  showInfo,
  slider,
  textBox,
} from "../packlets/runtime";

export function render() {
  // Load an image
  const img = image("react", reactLogo);

  // A simple label
  group("label", () => {
    const text = textBox("text", "Hello World");
    const fontSize = slider("fontSize", 24, { min: 12, max: 48 });
    const bg = textBox("bg", "#1a1a2e");
    const fg = textBox("fg", "#eef");

    const g = createGraphics("out", 300, 60);
    const { ctx } = g;

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 300, 60);

    // Text
    ctx.fillStyle = fg;
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "middle";
    ctx.fillText(text, 16, 30);
  });

  // A reusable badge component
  function badge(name: string, defaults: { text: string; color: string }) {
    return group(name, () => {
      const text = textBox("text", defaults.text);
      const color = textBox("color", defaults.color);

      const g = createGraphics("out", 80, 28);
      const { ctx } = g;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(0, 0, 80, 28, 6);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "14px monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(text, 40, 14);

      return g.canvas;
    });
  }

  // Multiple badges
  const onlineBadge = badge("badge-online", {
    text: "Online",
    color: "#22c55e",
  });
  const offlineBadge = badge("badge-offline", {
    text: "Offline",
    color: "#ef4444",
  });

  // Composed graphic
  group("status-bar", () => {
    const g = createGraphics("out", 200, 80);
    const { ctx } = g;

    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, 200, 80);

    ctx.drawImage(onlineBadge, 16, 16);
    ctx.drawImage(offlineBadge, 16, 48);
  });

  // Draw the loaded image
  group("image-viewer", () => {
    const g = createGraphics("out", 120, 120);
    const { ctx } = g;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, 120, 120);

    if (img.loaded) {
      ctx.drawImage(img.image, 10, 10, 100, 100);
    } else {
      ctx.fillStyle = "#888";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Loading...", 60, 60);
    }
  });

  // Test button and messages
  group("demo", () => {
    const action = resource("action", () => {
      return {
        fn: () => {},
      };
    });

    button("testBtn", "Click me!", () => {
      action.fn = () => {
        showInfo("Action performed!");
      };
      requestRerender();
    });

    button("errorBtn", "Show error", () => {
      action.fn = () => {
        showError("This is an error message.");
      };
      requestRerender();
    });

    action.fn();

    const count = slider("count", 0, { min: 0, max: 10 });
    if (count > 5) {
      showInfo(`Count is high: ${count}`);
    }
  });
}
