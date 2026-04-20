import { designPaletteList } from '../tokens';
import {
  type AppearanceBootstrap,
  persistAppearance,
  readStoredMode,
  readStoredPalette,
  syncDocumentClass,
} from './docsAppearanceRuntime';

const ROOT = '[data-appearance-controls]';
const GLOBAL_UI_FLAG = 'docsAppearanceGlobalUi';

function parseConfig(el: HTMLElement): AppearanceBootstrap | null {
  const raw = el.getAttribute('data-appearance-config');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppearanceBootstrap;
  } catch {
    return null;
  }
}

function roots(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(ROOT)];
}

function firstConfig(): AppearanceBootstrap | null {
  const r = roots()[0];
  return r ? parseConfig(r) : null;
}

/** Legacy behavior: `system` uses the same affordance as light for this toggle. */
function storedModeLooksDark(stored: ReturnType<typeof readStoredMode>): boolean {
  return stored === 'dark';
}

function syncModeIconVisibility(
  modeButton: HTMLButtonElement,
  stored: ReturnType<typeof readStoredMode>,
) {
  const sun = modeButton.querySelector<HTMLElement>('[data-appearance-icon-sun]');
  const moon = modeButton.querySelector<HTMLElement>('[data-appearance-icon-moon]');
  const showSun = storedModeLooksDark(stored);
  sun?.toggleAttribute('hidden', !showSun);
  moon?.toggleAttribute('hidden', showSun);
}

function setPaletteMenuOpen(root: HTMLElement, open: boolean) {
  const trigger = root.querySelector<HTMLButtonElement>('[data-appearance-palette-trigger]');
  const menu = root.querySelector<HTMLElement>('[data-appearance-palette-menu]');
  if (!trigger || !menu) return;
  menu.hidden = !open;
  trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeAllPaletteMenus() {
  for (const root of roots()) {
    setPaletteMenuOpen(root, false);
  }
}

function syncOneRoot(root: HTMLElement, cfg: AppearanceBootstrap) {
  const palette = readStoredPalette(cfg);
  const stored = readStoredMode();

  const modeBtn = root.querySelector<HTMLButtonElement>('[data-appearance-mode-toggle]');
  if (modeBtn) {
    modeBtn.setAttribute(
      'aria-label',
      stored === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
    );
    syncModeIconVisibility(modeBtn, stored);
  }

  for (const btn of root.querySelectorAll<HTMLButtonElement>('[data-appearance-palette-id]')) {
    const id = btn.getAttribute('data-appearance-palette-id');
    btn.setAttribute('aria-selected', id === palette ? 'true' : 'false');
  }

  const trigger = root.querySelector<HTMLButtonElement>('[data-appearance-palette-trigger]');
  if (trigger) {
    const label = designPaletteList.find((p) => p.id === palette)?.label ?? palette;
    trigger.setAttribute('aria-label', `Color palette: ${label}`);
  }
}

function syncEveryRoot() {
  const cfg = firstConfig();
  if (!cfg) return;
  for (const root of roots()) {
    syncOneRoot(root, cfg);
  }
}

function apply(cfg: AppearanceBootstrap, palette: string, mode: 'light' | 'dark' | 'system') {
  syncDocumentClass(cfg, palette, mode);
  persistAppearance(palette, mode);
  syncEveryRoot();
  closeAllPaletteMenus();
}

function bindDocumentHandlersOnce() {
  if (document.documentElement.dataset[GLOBAL_UI_FLAG] === '1') return;
  document.documentElement.dataset[GLOBAL_UI_FLAG] = '1';

  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Node)) return;
    for (const root of roots()) {
      const host = root.querySelector('[data-appearance-palette-host]');
      const menu = root.querySelector<HTMLElement>('[data-appearance-palette-menu]');
      if (!(host instanceof HTMLElement) || !menu || menu.hidden) continue;
      if (!host.contains(e.target)) {
        setPaletteMenuOpen(root, false);
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllPaletteMenus();
  });
}

function bindRoot(root: HTMLElement, cfg: AppearanceBootstrap) {
  if (root.dataset.appearanceBound === 'true') return;
  root.dataset.appearanceBound = 'true';

  root
    .querySelector<HTMLButtonElement>('[data-appearance-mode-toggle]')
    ?.addEventListener('click', () => {
      const next = readStoredMode() === 'dark' ? 'light' : 'dark';
      apply(cfg, readStoredPalette(cfg), next);
    });

  root
    .querySelector<HTMLButtonElement>('[data-appearance-palette-trigger]')
    ?.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = root.querySelector<HTMLElement>('[data-appearance-palette-menu]');
      if (!menu) return;
      const wasOpen = !menu.hidden;
      closeAllPaletteMenus();
      setPaletteMenuOpen(root, !wasOpen);
    });

  for (const btn of root.querySelectorAll<HTMLButtonElement>('[data-appearance-palette-id]')) {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-appearance-palette-id');
      if (!id || !cfg.map[id]) return;
      apply(cfg, id, readStoredMode());
    });
  }
}

export function initDocsAppearanceControls() {
  bindDocumentHandlersOnce();

  for (const root of roots()) {
    const cfg = parseConfig(root);
    if (!cfg) continue;
    bindRoot(root, cfg);
  }

  syncEveryRoot();
}
