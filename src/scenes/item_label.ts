import * as px from "../packlets/runtime";

export function render() {
  const fs = px.fileSystem("labeling");
  const virtueFont = fs.file("virtue.ttf");
  const virtue = px.freeTypeRenderer(virtueFont.data);
  const arimoFont = fs.file("Arimo-Bold.ttf");
  const arimo = px.freeTypeRenderer(arimoFont.data);

  // A simple label
  px.group("label", () => {
    const title = px.textBox("title", "Wi-Fi Repeater");
    const description = px.textBox("description", "TP-LINK TL-WA1201");

    const titleGraphics = virtue.textGraphics("title", 12, title);
    const descriptionGraphics = virtue.textGraphics(
      "description",
      12,
      description
    );

    arimo.textGraphics("extra", 20, "Powered by PixelPerfect");

    const g = px.createGraphics(
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
    } else g.loading();

    if (descriptionGraphics) {
      ctx.drawImage(
        descriptionGraphics.canvas,
        16,
        64,
        descriptionGraphics.canvas.width * 2,
        descriptionGraphics.canvas.height * 2
      );
    } else g.loading();
  });
}
