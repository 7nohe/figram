import { type FSWatcher, watch } from "node:fs";

export interface WatcherOptions {
  debounceMs?: number;
}

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs: number;

  constructor(options: WatcherOptions = {}) {
    this.debounceMs = options.debounceMs ?? 200;
  }

  watch(filePath: string, onChange: () => void): void {
    this.close();

    try {
      this.watcher = watch(filePath, () => {
        this.scheduleCallback(onChange);
      });
      console.log(`Watching: ${filePath}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Warning: failed to watch ${filePath}: ${message}`);
    }
  }

  private scheduleCallback(callback: () => void): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(callback, this.debounceMs);
  }

  close(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  isWatching(): boolean {
    return this.watcher !== null;
  }
}

export class IconsWatcher {
  private watcher: FSWatcher | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentPath: string | null = null;
  private readonly debounceMs: number;

  constructor(options: WatcherOptions = {}) {
    this.debounceMs = options.debounceMs ?? 200;
  }

  update(filePath: string | null, onChange: () => void): void {
    const shouldReset = this.currentPath !== filePath;
    this.currentPath = filePath;

    if (!shouldReset && this.watcher) return;

    this.close();

    if (!filePath) return;

    try {
      this.watcher = watch(filePath, () => {
        this.scheduleCallback(onChange);
      });
      console.log(`Watching icons: ${filePath}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[icons] Warning: failed to watch ${filePath}: ${message}`);
    }
  }

  private scheduleCallback(callback: () => void): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(callback, this.debounceMs);
  }

  close(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.currentPath = null;
  }

  getCurrentPath(): string | null {
    return this.currentPath;
  }
}
