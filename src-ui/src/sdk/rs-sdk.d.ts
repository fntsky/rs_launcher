/**
 * RS Launcher iframe SDK
 * 注入到插件 iframe 后由主窗口拼装，暴露 window.RS 全局对象。
 */

export interface RSCapabilities {
  file: { read?: boolean };
  image: { read?: boolean };
  fs: { write?: boolean };
  [key: string]: unknown;
}

export interface RSTheme {
  mode: 'dark' | 'light';
  vars: Record<string, string>;
  name?: string;
}

export interface RSConfig {
  hotkey: string;
  [key: string]: unknown;
}

export interface RSContext {
  pluginId: string;
  query: string;
  config: RSConfig;
  theme: RSTheme;
}

export interface RSInvokeRes<T = unknown> {
  ok: boolean;
  value?: T;
  error?: string;
}

export interface RSKeyEvent {
  key: string;
  code?: string;
  keyCode?: number;
  which?: number;
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  repeat?: boolean;
  type?: 'keydown' | 'keyup' | 'keypress';
  target?: EventTarget;
}

export type RSEventName =
  | 'theme-change'
  | 'query-change'
  | 'context-change'
  | 'keydown'
  | 'back';

export interface RSApi {
  readonly version: string;
  readonly context: RSContext | null;
  readonly theme: RSTheme | null;
  readonly query: string;
  invoke<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T>;
  readBinary(path: string): Promise<ArrayBuffer>;
  convertFileSrc(path: string): Promise<string>;
  openFile(path: string): Promise<void>;
  hideWindow(): Promise<void>;
  notifyBack(): void;
  setWindowSize(width: number, height: number): void;
  on(event: RSEventName, handler: (payload: any) => void): () => void;
  off(event: RSEventName, handler: (payload: any) => void): void;
  log(level: 'info' | 'warn' | 'error', ...args: unknown[]): void;
  ready: Promise<void>;
  applyTheme(theme: RSTheme): void;
}

declare global {
  interface Window {
    RS: RSApi;
    __RS__: RSApi;
    __RS_SDK_LOADED__?: boolean;
  }
}

export {};
