import {
  createGraphics,
  fileSystem,
  freeTypeRenderer,
  group,
  image,
  params,
  qrGraphics,
  slider,
  textBox,
} from "../packlets/runtime";
import { assetTagGraphic } from "../shared/assetTagGraphic";

function assetUrl(assetId: string, assetKey: string) {
  if (assetId === "EXAMPLE") {
    return "https://youtu.be/dQw4w9WgXcQ";
  }
  return `https://found.dt.in.th/${assetId}/${assetKey}`;
}

export function render() {
  const fs = fileSystem("labeling");
  const arimoFont = fs.file("Arimo-Bold.ttf");
  const arimo = freeTypeRenderer(arimoFont.data);

  // A simple label
  group("tag", () => {
    const assetId = textBox("id", params["assetId"] || "EXAMPLE");
    const assetKey = textBox("key", params["assetKey"] || "dummy");
    const text = textBox(
      "text",
      params["text"] || "Scan QR||to contact||owner"
    );
    const diameter = slider("diameter", +params["diameter"] || 5, {
      min: 1,
      max: 20,
    });
    const flagSize = 112;
    const pixelsPerMillimeter = 112 / 18;
    const wrapAroundCable = Math.round(
      pixelsPerMillimeter * +diameter * Math.PI
    );
    const out = createGraphics(
      "out",
      flagSize + wrapAroundCable + flagSize,
      flagSize
    );
    out.filename = `${assetId}.png`;
    const { canvas, ctx } = out;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, out.canvas.width, out.canvas.height);

    // QR code
    const url = assetUrl(assetId, assetKey);
    const qr = qrGraphics(url, { scale: 3, invert: false });
    const id = assetTagGraphic(fs, "id", assetId);
    const xb = Math.floor(canvas.height / 2 - qr.canvas.height / 2);
    ctx.drawImage(qr.canvas, 3, xb);

    // Contact owner image
    const contactImageFile = fs.file("contact_owner_vertical.png");
    const contactImage = image("contact", contactImageFile.url);
    if (contactImage.loaded) {
      ctx.drawImage(contactImage.image, flagSize, 0);
    } else {
      out.loading();
    }

    // Owner name
    const ownerNameImageFile = fs.file("dtinth_small.png");
    const ownerNameImage = image("ownerName", ownerNameImageFile.url);
    if (ownerNameImage.loaded) {
      ctx.drawImage(
        ownerNameImage.image,
        canvas.width - 7 - ownerNameImage.image.width,
        canvas.height - 24 - ownerNameImage.image.height
      );
    } else {
      out.loading();
    }

    // Asset ID
    if (id) {
      ctx.drawImage(
        id.canvas,
        canvas.width - 3 - id.canvas.width,
        canvas.height - 3 - id.canvas.height
      );
    }

    // Text
    const originX = canvas.width - flagSize + 5;
    const gfx = arimo.textGraphics(
      "itemName",
      20,
      text.split("||").join("\n"),
      { lineHeight: 22 }
    );
    if (gfx) {
      ctx.drawImage(gfx.canvas, originX, 0);
    }
  });
}
