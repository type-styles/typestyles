/** Tabbed install regions from `expandInstallTabGroups` — delegated so View Transitions keep working. */
let delegated = false;

function activateTab(root: HTMLElement, index: number): void {
  const tabs = root.querySelectorAll<HTMLButtonElement>('[data-doc-install-tab]');
  const panels = root.querySelectorAll<HTMLElement>('[data-doc-install-panel]');

  tabs.forEach((tab, i) => {
    const selected = i === index;
    tab.setAttribute('aria-selected', selected ? 'true' : 'false');
    tab.tabIndex = selected ? 0 : -1;
  });

  panels.forEach((panel, i) => {
    if (i === index) {
      panel.removeAttribute('hidden');
    } else {
      panel.setAttribute('hidden', '');
    }
  });
}

export function attachDocInstallTabs(): void {
  if (delegated || typeof document === 'undefined') return;
  delegated = true;

  document.addEventListener('click', (e) => {
    const tab = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      '[data-doc-install-tab]',
    );
    if (!tab) return;
    const root = tab.closest<HTMLElement>('[data-doc-install-tabs]');
    if (!root) return;
    const idx = Number.parseInt(tab.dataset.docInstallTab ?? '0', 10);
    if (Number.isNaN(idx)) return;
    activateTab(root, idx);
    tab.focus();
  });
}
