const COPIED_MS = 1200;

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

  if (navigator.clipboard?.writeText) {
    const text = codeEl.textContent ?? '';
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
        window.setTimeout(reset, COPIED_MS);
      },
    );
  } else {
    button.textContent = 'Error';
    button.disabled = true;
    button.setAttribute('aria-label', 'Copy failed');
    button.dataset.error = 'true';
    window.setTimeout(reset, COPIED_MS);
  }
}

let delegated = false;

/** Copy buttons work after View Transition swaps (delegated click). */
export function attachDocsCodeBlockCopyListeners(): void {
  if (delegated || typeof document === 'undefined') return;
  delegated = true;
  document.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      '[data-codeblock-copy]',
    );
    if (!button) return;
    setupCopyButton(button);
  });
}
