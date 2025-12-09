import { createGraphics, resource, textBox } from "../packlets/runtime";

export function render() {
  const measurer = createGraphics("measurer", 1, 1);
  const text = textBox("text", "Supplies");
  const ctxFont = '64px "Berkeley Mono"';
  measurer.ctx.font = ctxFont;
  const textWidth = measurer.ctx.measureText(text).width;

  const g = createGraphics("out", 72 + textWidth, 112);
  const { ctx, canvas } = g;
  ctx.font = ctxFont;

  // Generate a bunch of sha256 hash to use as random seed
  const rng = resource("random", () => {
    let _ready = false;
    const random: number[] = [];
    async function init() {
      for (let i = 0; i < 200; i++) {
        const hash = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(text + i)
        );
        for (const v of new Uint16Array(hash)) {
          random.push(v / 0xffff);
        }
      }
      _ready = true;
    }
    init();
    return {
      get ready() {
        return _ready;
      },
      get values() {
        return random;
      },
    };
  });
  if (!rng.ready) {
    g.loading();
    return;
  }

  const random = rng.values;
  const getGrid = (x: number, y: number) => {
    const index = (y + 10) * 50 + x * 3;
    return [random[index], random[index + 1], random[index + 2]];
  };

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;

  const vSize = 64;
  const viewingDistance = 160;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let alpha = 0;

      let vx = x;
      let vy = y;

      vx -= w / 2;
      vy -= h / 2;
      const targetY = (viewingDistance * vy) / (vy + viewingDistance);
      const scale = vy == 0 ? 1 : targetY / vy;

      vx *= scale;
      vy *= scale;

      vx += w / 2;
      vy += h / 2;

      const cellX = Math.floor(vx / vSize);
      const cellY = Math.floor(vy / vSize);
      const distances = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          let [gx, gy, color] = getGrid(cellX + dx, cellY + dy);
          gx = (cellX + dx + gx) * vSize;
          gy = (cellY + dy + gy) * vSize;
          color = Number(color);
          distances.push({ d: Math.hypot(gx - vx, gy - vy), color });
        }
      }
      distances.sort((a, b) => a.d - b.d);
      alpha = distances[0].color * 0.64;
      const nearEdge = Math.abs(distances[0].d - distances[1].d);
      const edgeAlpha = Math.exp(-nearEdge * 0.33);
      alpha = alpha * (1 - edgeAlpha) + edgeAlpha;
      alpha = Math.min(1, Math.max(0, alpha));
      alpha = alpha ** (1 + (1 - y / h));

      const v = 255 - Math.round(alpha * 255);
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  ctx.font = ctxFont;
  ctx.shadowColor = "#fff8";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;
  for (let i = 1; i <= 10; i++) {
    ctx.shadowBlur = i * 4;
    ctx.fillText(text, 36, 75);
  }

  const rendered = ctx.getImageData(0, 0, w, h);
  const debugDither = false;

  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      const color = 1 - (1 - rendered.data[i] / 255);
      let threshold = 0;

      const radius = Math.hypot(x - w / 2, y - h / 2);
      threshold = 1 - ((radius / 12) % 1);
      const adjust =
        (Math.sin((x / 12) * Math.PI * 2) + Math.sin((y / 12) * Math.PI * 2)) /
        2;
      threshold = (0.8 * threshold + 0.1 + adjust * 0.1) ** 1.5;

      let value = 0;
      if (debugDither) {
        value = threshold * 255;
      } else {
        value = color > threshold ? 255 : 0;
      }
      rendered.data[i] = value;
      rendered.data[i + 1] = value;
      rendered.data[i + 2] = value;
    }
  }
  ctx.putImageData(rendered, 0, 0);
}
