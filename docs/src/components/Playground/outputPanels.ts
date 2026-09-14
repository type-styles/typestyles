import type { editor } from 'monaco-editor';
import { formatDemoCss } from '../../lib/formatDemoCss';

export type OutputTab = 'result' | 'css' | 'errors';

export function bindOutputTabs(
  root: HTMLElement,
  onActivate?: (tab: OutputTab) => void,
): {
  activate: (tab: OutputTab) => void;
} {
  const tabs = root.querySelectorAll<HTMLButtonElement>('[data-playground-tab]');
  const panels = root.querySelectorAll<HTMLElement>('[data-playground-panel]');

  function activate(tab: OutputTab): void {
    for (const button of tabs) {
      const isActive = button.dataset.playgroundTab === tab;
      button.dataset.active = isActive ? 'true' : 'false';
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
    for (const panel of panels) {
      const isActive = panel.dataset.playgroundPanel === tab;
      panel.dataset.active = isActive ? 'true' : 'false';
      panel.hidden = !isActive;
    }
    onActivate?.(tab);
  }

  root.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-playground-tab]',
    );
    if (!target || !root.contains(target)) return;
    const tab = target.dataset.playgroundTab as OutputTab | undefined;
    if (tab) activate(tab);
  });

  return { activate };
}

export function setCssPanel(cssEditor: editor.IStandaloneCodeEditor | null, css: string): void {
  if (!cssEditor) return;
  const formatted = formatDemoCss(css).trim() || '/* No CSS registered yet */';
  const model = cssEditor.getModel();
  if (model && model.getValue() !== formatted) {
    model.setValue(formatted);
  }
}

export function setErrorsPanel(root: HTMLElement, error: string | null): void {
  const panel = root.querySelector<HTMLElement>('[data-playground-errors]');
  if (!panel) return;
  panel.textContent = error?.trim() ? error : 'No errors';
}

export function setConsolePanel(root: HTMLElement, message: string | null): void {
  const panel = root.querySelector<HTMLElement>('[data-playground-console]');
  if (!panel) return;
  panel.textContent = message?.trim() ? message : 'Ready';
}
