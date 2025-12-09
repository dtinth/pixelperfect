import { encode, type QrCodeGenerateOptions } from "uqr";
import { createGraphics } from "./api";
import type { Graphics } from "./types";

export function qrGraphics(
  data: string,
  options: {
    scale?: number;
    invert?: boolean;
    ecc?: QrCodeGenerateOptions["ecc"];
  }
): Graphics {
  const scale = options.scale ?? 3;
  const qrData = encode(data, {
    boostEcc: true,
    border: 3,
    ecc: options.ecc ?? "M",
  });
  const g = createGraphics("qr", qrData.size * scale, qrData.size * scale);
  const { ctx, canvas } = g;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  for (let y = 0; y < qrData.size; y++) {
    for (let x = 0; x < qrData.size; x++) {
      if (qrData.data[y][x] != options.invert) {
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
  return g;
}
