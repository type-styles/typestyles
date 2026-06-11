import { designStyleList } from '../tokens';
import {
  type AppearanceBootstrap,
  persistAppearance,
  readStoredMode,
  readStoredStyle,
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

function setStyleMenuOpen(root: HTMLElement, open: boolean) {
  const trigger = root.querySelector<HTMLButtonElement>('[data-appearance-style-trigger]');
  const menu = root.querySelector<HTMLElement>('[data-appearance-style-menu]');
  if (!trigger || !menu) return;
  menu.hidden = !open;
  trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeAllStyleMenus() {
  for (const root of roots()) {
    setStyleMenuOpen(root, false);
  }
}

function syncOneRoot(root: HTMLElement, cfg: AppearanceBootstrap) {
  const style = readStoredStyle(cfg);
  const stored = readStoredMode();

  const modeBtn = root.querySelector<HTMLButtonElement>('[data-appearance-mode-toggle]');
  if (modeBtn) {
    modeBtn.setAttribute(
      'aria-label',
      stored === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
    );
    syncModeIconVisibility(modeBtn, stored);
  }

  for (const btn of root.querySelectorAll<HTMLButtonElement>('[data-appearance-style-id]')) {
    const styleId = btn.getAttribute('data-appearance-style-id');
    btn.setAttribute('aria-selected', styleId === style ? 'true' : 'false');
  }

  const trigger = root.querySelector<HTMLButtonElement>('[data-appearance-style-trigger]');
  if (trigger) {
    const label = designStyleList.find((p) => p.id === style)?.label ?? style;
    trigger.setAttribute('aria-label', `Visual style: ${label}`);
  }
}

function syncEveryRoot() {
  const cfg = firstConfig();
  if (!cfg) return;
  for (const root of roots()) {
    syncOneRoot(root, cfg);
  }
}

function apply(cfg: AppearanceBootstrap, style: string, mode: 'light' | 'dark' | 'system') {
  syncDocumentClass(cfg, style, mode);
  persistAppearance(style, mode);
  syncEveryRoot();
  closeAllStyleMenus();
}

function bindDocumentHandlersOnce() {
  if (document.documentElement.dataset[GLOBAL_UI_FLAG] === '1') return;
  document.documentElement.dataset[GLOBAL_UI_FLAG] = '1';

  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Node)) return;
    for (const root of roots()) {
      const host = root.querySelector('[data-appearance-style-host]');
      const menu = root.querySelector<HTMLElement>('[data-appearance-style-menu]');
      if (!(host instanceof HTMLElement) || !menu || menu.hidden) continue;
      if (!host.contains(e.target)) {
        setStyleMenuOpen(root, false);
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllStyleMenus();
  });
}

function bindRoot(root: HTMLElement, cfg: AppearanceBootstrap) {
  if (root.dataset.appearanceBound === 'true') return;
  root.dataset.appearanceBound = 'true';

  root
    .querySelector<HTMLButtonElement>('[data-appearance-mode-toggle]')
    ?.addEventListener('click', () => {
      const next = readStoredMode() === 'dark' ? 'light' : 'dark';
      apply(cfg, readStoredStyle(cfg), next);
    });

  root
    .querySelector<HTMLButtonElement>('[data-appearance-style-trigger]')
    ?.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = root.querySelector<HTMLElement>('[data-appearance-style-menu]');
      if (!menu) return;
      const wasOpen = !menu.hidden;
      closeAllStyleMenus();
      setStyleMenuOpen(root, !wasOpen);
    });

  for (const btn of root.querySelectorAll<HTMLButtonElement>('[data-appearance-style-id]')) {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-appearance-style-id');
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
