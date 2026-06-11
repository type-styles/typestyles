/** Serialized from the server for style × color-mode class mapping. */
export type AppearanceBootstrap = {
  clear: string[];
  map: Record<string, { className: string; dataStyle?: string }>;
};

/**
 * Reads the persisted style choice, falling back to `default` for unknown values.
 * Keep in sync with the blocking boot script in `../components/Head.astro`.
 */
export function readStoredStyle(config: AppearanceBootstrap): string {
  const style = localStorage.getItem('typestyles-style') ?? '';
  return config.map[style] ? style : 'default';
}

export function readStoredMode(): 'light' | 'dark' | 'system' {
  const m = localStorage.getItem('typestyles-theme');
  if (m === 'light' || m === 'dark' || m === 'system') return m;
  return 'system';
}

/** Apply token theme class and docs style marker only (does not write localStorage). */
export function syncDocumentClass(
  config: AppearanceBootstrap,
  style: string,
  mode: 'light' | 'dark' | 'system',
): void {
  const root = document.documentElement;
  for (const c of config.clear) {
    if (c) root.classList.remove(c);
  }
  const next = config.map[style]?.className ?? '';
  if (next) root.classList.add(next);
  root.setAttribute('data-style', config.map[style]?.dataStyle ?? style);
  if (mode === 'system') root.removeAttribute('data-mode');
  else root.setAttribute('data-mode', mode);
}

export function persistAppearance(style: string, mode: 'light' | 'dark' | 'system'): void {
  localStorage.setItem('typestyles-style', style);
  localStorage.setItem('typestyles-theme', mode);
}
