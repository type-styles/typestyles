const COPIED_MS = 1200;

let attached = false;

function setupCopyButton(button: HTMLButtonElement): void {
  const root = button.closest('[data-codeblock]');
  if (!root) return;
  const codeEl = root.querySelector('pre code');
  if (!codeEl) return;

  const idleLabel = button.dataset.copyLabel ?? 'Copy code';
  const copiedLabel = button.dataset.copiedLabel ?? 'Copied';

  const reset = () => {
    button.disabled = false;
    button.textContent = 'Copy';
    button.setAttribute('aria-label', idleLabel);
    delete button.dataset.copied;
    delete button.dataset.error;
  };

  button.addEventListener('click', () => {
    const text = codeEl.textContent ?? '';
    if (!navigator.clipboard?.writeText) {
      button.textContent = 'Error';
      button.disabled = true;
      button.setAttribute('aria-label', 'Copy failed');
      button.dataset.error = 'true';
      window.setTimeout(reset, COPIED_MS);
      return;
    }

    navigator.clipboard.writeText(text).then(
      () => {
        button.textContent = copiedLabel;
        button.disabled = true;
        button.setAttribute('aria-label', copiedLabel);
        button.dataset.copied = 'true';
        delete button.dataset.error;
        window.setTimeout(reset, COPIED_MS);
      },
      () => {
        button.textContent = 'Error';
        button.disabled = true;
        button.setAttribute('aria-label', 'Copy failed');
        button.dataset.error = 'true';
        delete button.dataset.copied;
        window.setTimeout(reset, COPIED_MS);
      },
    );
  });
}

/** One-shot setup for all doc code blocks (Markdown + {@link ../components/docs/Code.astro}). */
export function attachDocsCodeBlockCopyListeners(): void {
  if (attached || typeof document === 'undefined') return;
  attached = true;
  document.querySelectorAll<HTMLButtonElement>('[data-codeblock-copy]').forEach(setupCopyButton);
}
