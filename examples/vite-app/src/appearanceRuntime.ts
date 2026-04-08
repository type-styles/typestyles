/** Same contract as `docs/src/lib/docsAppearanceRuntime.ts` — shared keys as the docs site. */
export type AppearanceBootstrap = {
  clear: string[];
  map: Record<string, { className: string }>;
};

export function readStoredPalette(config: AppearanceBootstrap): string {
  const raw = localStorage.getItem('typestyles-palette');
  const p = raw && raw.length > 0 ? raw : 'default';
  return config.map[p] ? p : 'default';
}

export function readStoredMode(): 'light' | 'dark' | 'system' {
  const m = localStorage.getItem('typestyles-theme');
  if (m === 'light' || m === 'dark' || m === 'system') return m;
  return 'system';
}

export function syncDocumentClass(
  config: AppearanceBootstrap,
  palette: string,
  mode: 'light' | 'dark' | 'system',
): void {
  const root = document.documentElement;
  for (const c of config.clear) {
    if (c) root.classList.remove(c);
  }
  const next = config.map[palette]?.className ?? '';
  if (next) root.classList.add(next);
  if (mode === 'system') root.removeAttribute('data-mode');
  else root.setAttribute('data-mode', mode);
}

export function persistAppearance(palette: string, mode: 'light' | 'dark' | 'system'): void {
  localStorage.setItem('typestyles-palette', palette);
  localStorage.setItem('typestyles-theme', mode);
}
