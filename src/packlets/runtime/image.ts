import { resource } from "./api";
import type { ResourceContext } from "./types";

export interface ImageResource {
  readonly loaded: boolean;
  readonly image: HTMLImageElement;
}

export function image(
  name: string,
  url: string | null
): ImageResource | { loaded: false } {
  if (!url) {
    return { loaded: false };
  }
  return resource(`image:${name}`, (context: ResourceContext) => {
    const img = new Image();
    let _loaded = false;

    img.onload = () => {
      _loaded = true;
      context.requestRerender();
    };

    img.onerror = () => {
      _loaded = false;
      context.requestRerender();
    };

    img.src = url;

    return {
      get loaded() {
        return _loaded;
      },
      get image() {
        return img;
      },
      [Symbol.dispose]() {
        img.src = "";
      },
    };
  });
}
