export function attachDocAiActions(): void {
  const handler = async (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest('[data-doc-copy-md]');
    if (!button) return;
    const root = button.closest('[data-doc-ai-actions]');
    const mdUrl = root?.getAttribute('data-md-url');
    if (!mdUrl) return;
    event.preventDefault();
    try {
      const res = await fetch(mdUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      const label = button.textContent;
      button.textContent = 'Copied!';
      window.setTimeout(() => {
        button.textContent = label;
      }, 2000);
    } catch {
      button.textContent = 'Copy failed';
      window.setTimeout(() => {
        button.textContent = 'Copy as Markdown';
      }, 2000);
    }
  };

  document.addEventListener('click', handler);
  document.addEventListener('astro:page-load', () => {
    document.removeEventListener('click', handler);
    document.addEventListener('click', handler);
  });
}
