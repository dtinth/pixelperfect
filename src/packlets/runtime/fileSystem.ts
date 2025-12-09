import { get, set } from "idb-keyval";
import { requestRerender, resource } from "./api";
import { button } from "./controls";
import { showError, showInfo } from "./messages";

export function fileSystem(key: string): FileSystemResource {
  const fsResource = resource(`fs:${key}`, () => {
    return new FileSystemResource(key);
  });
  fsResource.renderUi();
  return fsResource;
}

interface StoredState {
  handle: FileSystemDirectoryHandle;
}

export class FileSystemResource {
  private initialized = false;
  private handle?: FileSystemDirectoryHandle;
  private granted = false;
  constructor(private key: string) {
    this.init();
  }
  async init() {
    requestRerender();
    const state = await get<StoredState>(this.key);
    if (state?.handle) {
      this.handle = state.handle;
      const permission = await state.handle.queryPermission({
        mode: "readwrite",
      });
      this.granted = permission === "granted";
    }
    this.initialized = true;
    requestRerender();
  }
  renderUi() {
    if (!this.initialized) {
      showInfo("Initializing file system access...");
    } else if (!this.handle) {
      showInfo("No directory selected.");
    } else if (!this.granted) {
      showError("No permission to access the selected directory.");
    }
    button(
      "selectDir",
      this.granted ? "Re-select Directory" : "Select Directory",
      async () => {
        try {
          const handle = await showDirectoryPicker();
          const permission = await handle.requestPermission({
            mode: "readwrite",
          });
          if (permission !== "granted") {
            alert("Permission to access the directory was denied.");
            return;
          }
          await set(this.key, { handle });
          this.handle = handle;
          this.granted = permission === "granted";
          requestRerender();
        } catch (err) {
          console.error(`Unable to select directory`, err);
          alert(`Unable to select directory: ${err}`);
        }
      }
    );
    if (this.handle && !this.granted) {
      button("grantPermission", "Grant Permission", async () => {
        if (!this.handle) return;
        const permission = await this.handle.requestPermission({
          mode: "readwrite",
        });
        if (permission !== "granted") {
          alert("Permission to access the directory was denied.");
          return;
        }
        this.granted = permission === "granted";
        requestRerender();
      });
    }
  }
  file(fileName: string): FileResource {
    if (!this.handle || !this.granted) {
      return new UnloadedFileResource();
    }
    const fileResource = resource(`fsfile:${this.key}:${fileName}`, () => {
      return new FileSystemFileResource(this.handle!, fileName);
    });
    fileResource.renderUi();
    return fileResource;
  }
}

export interface FileResource {
  readonly loaded: boolean;
  readonly data: ArrayBuffer | null;
  readonly url: string | null;
}

export class FileSystemFileResource implements FileResource {
  loaded = false;
  private fileHandle?: FileSystemFileHandle;
  private fileData?: ArrayBuffer;
  error: string | null = null;
  url: string | null = null;
  constructor(
    private dirHandle: FileSystemDirectoryHandle,
    private fileName: string
  ) {
    this.load();
    requestRerender();
  }
  async load() {
    try {
      this.fileHandle = await this.dirHandle.getFileHandle(this.fileName);
      const file = await this.fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();
      this.fileData = arrayBuffer;
      this.error = null;
      this.loaded = true;
      this.url = URL.createObjectURL(new Blob([arrayBuffer]));
    } catch (err) {
      console.error(`Unable to load file ${this.fileName}`, err);
      this.error = String(err);
      this.loaded = false;
    }
    requestRerender();
  }
  get data(): ArrayBuffer | null {
    return this.fileData ?? null;
  }
  renderUi() {
    if (this.error) {
      showError(`Error loading file ${this.fileName}: ${this.error}`);
    } else if (!this.loaded) {
      showInfo(`Loading file: ${this.fileName}`);
    }
  }
}

class UnloadedFileResource {
  loaded = false;
  get data(): null {
    return null;
  }
  get url(): null {
    return null;
  }
}
