import hljs from 'highlight.js';

/** Highlighting for docs prose / {@link ../components/Code.astro Code}; matches marked pipeline. */
export function highlightDocCode(
  code: string,
  lang?: string,
): { safeLang: string; highlighted: string } {
  const raw = (lang ?? '').trim() || 'plaintext';
  const language = hljs.getLanguage(raw) ? raw : 'plaintext';
  const safeLang = language.toLowerCase();
  return {
    safeLang,
    highlighted: hljs.highlight(code, { language }).value,
  };
}
