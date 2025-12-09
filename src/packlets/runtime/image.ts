import { requestRerender, resource } from "./api";

export interface ImageResourceApi {
  readonly loaded: boolean;
  readonly image: HTMLImageElement;
}

class ImageResource {
  private loaded = false;
  private img = new Image();
  private currentSrc?: string;
  constructor() {
    this.img.onload = () => {
      this.loaded = true;
      requestRerender();
    };
    this.img.onerror = () => {
      this.loaded = false;
      requestRerender();
    };
  }
  set src(url: string) {
    if (this.currentSrc !== url) {
      this.currentSrc = url;
      this.loaded = false;
      this.img.src = url;
    }
  }
  get api(): ImageResourceApi {
    return {
      loaded: this.loaded,
      image: this.img,
    };
  }
}

export function image(
  name: string,
  url: string | null
): ImageResourceApi | { loaded: false } {
  if (!url) {
    return { loaded: false };
  }
  const res = resource(`image:${name}`, () => new ImageResource());
  res.src = url;
  return res.api;
}
