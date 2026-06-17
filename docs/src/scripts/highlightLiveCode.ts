import hljs from 'highlight.js/lib/core';
import css from 'highlight.js/lib/languages/css';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';

hljs.registerLanguage('css', css);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('tsx', typescript);
hljs.registerLanguage('xml', xml);

export function highlightLiveCode(code: string, lang: string): { safeLang: string; html: string } {
  const language = hljs.getLanguage(lang) ? lang : 'plaintext';
  const safeLang = language.toLowerCase();
  return {
    safeLang,
    html: hljs.highlight(code, { language }).value,
  };
}

/** Update a `<pre><code>` (or container holding `code`) with highlighted markup. */
export function applyLiveCodeHighlight(container: Element, code: string, lang: string): void {
  const codeEl = container.querySelector('code');
  if (!codeEl || !(codeEl instanceof HTMLElement)) return;
  const { safeLang, html } = highlightLiveCode(code, lang);
  codeEl.className = `hljs language-${safeLang}`;
  codeEl.innerHTML = html;
}
