import {
  createGraphics,
  image,
  type FileSystemResourceApi,
} from "../packlets/runtime";

export function assetTagGraphic(
  fs: FileSystemResourceApi,
  name: string,
  assetId: string
) {
  const gfxFile = fs.file("monospace.png");
  if (!gfxFile.url) return null;
  const sheet = image("monospace", gfxFile.url);
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  if (!sheet.loaded) return null;
  const g = createGraphics(name, assetId.length * 13, sheet.image.height);
  for (let i = 0; i < assetId.length; i++) {
    const char = assetId[i];
    const index = charset.indexOf(char);
    if (index === -1) continue;
    const sourceX = index * 11;
    g.ctx.drawImage(
      sheet.image,
      sourceX,
      0,
      11,
      sheet.image.height,
      i * 13,
      0,
      11,
      sheet.image.height
    );
  }
  return g;
}
