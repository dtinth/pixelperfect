import * as px from "../packlets/runtime";
import { assetTagGraphic } from "../shared/assetTagGraphic";

function assetUrl(assetId: string, assetKey: string) {
  if (assetId === "EXAMPLE") {
    return "https://youtu.be/dQw4w9WgXcQ";
  }
  return `https://found.dt.in.th/${assetId}/${assetKey}`;
}

export function render() {
  const fs = px.fileSystem("labeling");
  const footerFile = fs.file("qr_tag_small_footer.png");
  const footerImage = px.image("footer", footerFile.url);

  // A simple label
  px.group("tag", () => {
    const out = px.createGraphics("out", 112, 174);
    const assetId = px.textBox("id", px.params["assetId"] || "TEST001");
    const assetKey = px.textBox("key", px.params["assetKey"] || "11111111");
    const url = assetUrl(assetId, assetKey);
    out.filename = `${assetId}.png`;

    const qr = px.qrGraphics(url, { scale: 3, invert: true });
    const id = assetTagGraphic(fs, "id", assetId);

    const { ctx } = out;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, out.canvas.width, out.canvas.height);

    // Asset ID
    if (id) {
      ctx.drawImage(
        id.canvas,
        ~~((out.canvas.width - id.canvas.width) / 2) + 1,
        4
      );
    } else out.loading();

    // QR code
    ctx.drawImage(qr.canvas, ~~((out.canvas.width - qr.canvas.width) / 2), 22);

    // Footer image
    if (footerImage.loaded) {
      ctx.drawImage(footerImage.image, 0, 132);
    } else out.loading();
  });
}
