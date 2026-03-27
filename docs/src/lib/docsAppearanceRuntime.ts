/** Serialized from the server for palette × color-mode class mapping. */
export type AppearanceBootstrap = {
  clear: string[];
  map: Record<string, { light: string; dark: string }>;
};

export function readStoredPalette(config: AppearanceBootstrap): string {
  const raw = localStorage.getItem('typestyles-palette');
  const p = raw && raw.length > 0 ? raw : 'default';
  return config.map[p] ? p : 'default';
}

export function readStoredMode(): 'light' | 'dark' {
  const m = localStorage.getItem('typestyles-theme');
  if (m === 'light' || m === 'dark') return m;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Apply token theme classes only (does not write localStorage). */
export function syncDocumentClass(
  config: AppearanceBootstrap,
  palette: string,
  mode: 'light' | 'dark',
): void {
  const root = document.documentElement;
  for (const c of config.clear) {
    if (c) root.classList.remove(c);
  }
  const next = config.map[palette]?.[mode] ?? '';
  if (next) root.classList.add(next);
}

export function persistAppearance(palette: string, mode: 'light' | 'dark'): void {
  localStorage.setItem('typestyles-palette', palette);
  localStorage.setItem('typestyles-theme', mode);
}
