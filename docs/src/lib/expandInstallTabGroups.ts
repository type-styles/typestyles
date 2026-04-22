import { highlightDocCode } from './highlightDocCode';
import { markdownCodeBlockHtml } from './markdownCodeBlockHtml';

/**
 * Replace `<!-- doc-install-tabs -->` … `<!-- /doc-install-tabs -->` regions (fenced bash blocks)
 * with a tabbed code-block group. Parsed before `marked.parse` so highlighted HTML matches normal
 * fenced blocks and copy buttons work unchanged.
 */
const REGION_RE = /<!--\s*doc-install-tabs\s*-->\s*([\s\S]*?)\s*<!--\s*\/doc-install-tabs\s*-->/g;

const FENCE_RE = /```(?:bash|sh)\s*\n([\s\S]*?)```/g;

let tabGroupSeq = 0;

function inferTabLabel(code: string): string {
  const first = code.trim().split(/\s+/)[0]?.toLowerCase();
  if (first === 'pnpm' || first === 'npm' || first === 'yarn') return first;
  return 'shell';
}

function renderTabGroup(blocks: { label: string; html: string }[]): string {
  const gid = `doc-install-tabs-${tabGroupSeq++}`;
  const buttons = blocks
    .map(
      (b, i) =>
        `<button type="button" role="tab" class="doc-install-tabs-tab" data-doc-install-tab="${i}" id="${gid}-tab-${i}" aria-selected="${i === 0 ? 'true' : 'false'}" aria-controls="${gid}-panel-${i}" tabindex="${i === 0 ? '0' : '-1'}">${escapeHtml(b.label)}</button>`,
    )
    .join('');

  const panels = blocks
    .map(
      (b, i) =>
        `<div class="doc-install-tabs-panelwrap" data-doc-install-panel="${i}" id="${gid}-panel-${i}" role="tabpanel" aria-labelledby="${gid}-tab-${i}" ${i === 0 ? '' : 'hidden'}>${b.html}</div>`,
    )
    .join('');

  return `\n\n<div class="doc-install-tabs" data-doc-install-tabs>\n<div class="doc-install-tabs-tablist" role="tablist" aria-label="Package manager">${buttons}</div>\n<div class="doc-install-tabs-panels">${panels}</div>\n</div>\n\n`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function expandInstallTabGroups(markdown: string): string {
  return markdown.replace(REGION_RE, (_full, inner: string) => {
    const codes: string[] = [];
    let m: RegExpExecArray | null;
    const re = new RegExp(FENCE_RE.source, FENCE_RE.flags);
    while ((m = re.exec(inner)) !== null) {
      codes.push(m[1].trim());
    }
    if (codes.length === 0) {
      return _full;
    }
    const blocks = codes.map((code) => {
      const { safeLang, highlighted } = highlightDocCode(code, 'bash');
      return { label: inferTabLabel(code), html: markdownCodeBlockHtml(safeLang, highlighted) };
    });
    return renderTabGroup(blocks);
  });
}

export function prepareDocMarkdown(markdown: string): string {
  return expandInstallTabGroups(markdown);
}
