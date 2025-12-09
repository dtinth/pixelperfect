import {
  createGraphics,
  fileSystem,
  freeTypeRenderer,
  group,
  textBox,
} from "../packlets/runtime";

export function render() {
  const fs = fileSystem("labeling");
  const virtueFont = fs.file("virtue.ttf");
  const virtue = freeTypeRenderer(virtueFont.data);
  const arimoFont = fs.file("Arimo-Bold.ttf");
  const arimo = freeTypeRenderer(arimoFont.data);

  // A simple label
  group("label", () => {
    const title = textBox("title", "Wi-Fi Repeater");
    const description = textBox("description", "TP-LINK TL-WA1201");

    const titleGraphics = virtue.textGraphics("title", 12, title);
    const descriptionGraphics = virtue.textGraphics(
      "description",
      12,
      description
    );

    arimo.textGraphics("extra", 20, "Powered by PixelPerfect");

    const g = createGraphics(
      "out",
      32 +
        Math.max(
          (titleGraphics?.canvas.width ?? 0) * 3,
          (descriptionGraphics?.canvas.width ?? 0) * 2
        ),
      112
    );
    const { ctx, canvas } = g;
    ctx.fillStyle = "#fff";
    ctx.imageSmoothingEnabled = false;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (titleGraphics) {
      ctx.drawImage(
        titleGraphics.canvas,
        16,
        16,
        titleGraphics.canvas.width * 3,
        titleGraphics.canvas.height * 3
      );
    }
    if (descriptionGraphics) {
      ctx.drawImage(
        descriptionGraphics.canvas,
        16,
        64,
        descriptionGraphics.canvas.width * 2,
        descriptionGraphics.canvas.height * 2
      );
    }
  });
}
