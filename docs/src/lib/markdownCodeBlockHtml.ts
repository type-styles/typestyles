import { codeBlock } from '@examples/design-system';

/**
 * HTML for a fenced markdown code block (highlighted inner HTML only).
 * Keep in sync with `components/docs/Code.astro` selectors; copy wiring via `DocsCodeBlockCopy.astro`.
 */
export function markdownCodeBlockHtml(safeLang: string, highlighted: string): string {
  return [
    `<div class="${codeBlock('root')}" data-codeblock>`,
    `  <div class="${codeBlock('header')}" data-codeblock-header>`,
    `    <div class="${codeBlock('title')}">`,
    `      <span class="${codeBlock('language')}" data-codeblock-language>${safeLang}</span>`,
    `    </div>`,
    `    <div class="${codeBlock('actions')}">`,
    `      <button type="button" class="${codeBlock('copyButton')} ${codeBlock('copyButtonIdle')}" data-codeblock-copy data-copy-label="Copy code" data-copied-label="Copied" aria-label="Copy code">Copy</button>`,
    `    </div>`,
    `  </div>`,
    `  <div class="${codeBlock('body')}" data-codeblock-body>`,
    `    <pre class="${codeBlock('pre')}" data-codeblock-pre><code class="hljs language-${safeLang} ${codeBlock('code')}">${highlighted}</code></pre>`,
    `  </div>`,
    `</div>`,
  ].join('\n');
}
