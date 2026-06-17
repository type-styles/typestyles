import type { TokenLeaf } from './ast-utils';
import { parseColor } from './document-index';

export function formatTokenLeafMarkdown(leaf: TokenLeaf): string {
  const path = leaf.path.join('.');
  const parts = [`**TypeStyles token** — \`${path}\``, '', `Value: \`${leaf.value}\``];

  const color = leaf.color ?? parseColor(leaf.value);
  if (color) {
    parts.push(
      '',
      `<span style="display:inline-block;width:56px;height:18px;background:${escapeHtml(color)};border:1px solid #888;vertical-align:middle"></span>`,
    );
  }

  return parts.join('\n');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
