import type { TokenPreview, TokenValueVariant } from './theme-index';
import { parseColor } from './document-index';

export function formatTokenPreviewMarkdown(preview: TokenPreview): string {
  const path = preview.path.join('.');
  const parts = [
    `**TypeStyles token** — \`${path}\``,
    '',
    `CSS variable: \`${preview.cssVar}\``,
    '',
  ];

  for (const variant of preview.variants) {
    parts.push(formatVariantLine(variant));
    parts.push('');
  }

  return parts.join('\n').trimEnd();
}

function formatVariantLine(variant: TokenValueVariant): string {
  const swatch = colorSwatchHtml(variant.color ?? variant.value);
  const detail = variant.detail ? ` _(${variant.detail})_` : '';
  return `${swatch}**${variant.label}**${detail} — \`${variant.value}\``;
}

/**
 * Inline HTML color chip for VS Code hovers (`supportHtml: true`).
 * Markdown image data-URIs break when hex colors contain `#` (URL fragment).
 */
export function colorSwatchHtml(colorOrValue: string): string {
  const color = parseColor(colorOrValue);
  if (!color) return '◻️ ';

  const safe = escapeHtmlAttr(color);
  return `<span style="display:inline-block;width:14px;height:14px;background-color:${safe};border:1px solid rgba(128,128,128,0.55);border-radius:3px;vertical-align:middle;margin-right:6px;" aria-hidden="true"></span>`;
}

/** @deprecated Use colorSwatchHtml — kept as alias for tests. */
export const colorSwatchMarkdown = colorSwatchHtml;

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;');
}
