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
  }

  return parts.join('\n');
}

function formatVariantLine(variant: TokenValueVariant): string {
  const swatch = colorSwatchMarkdown(variant.color ?? variant.value);
  const detail = variant.detail ? ` _(${variant.detail})_` : '';
  return `${swatch} **${variant.label}**${detail} — \`${variant.value}\``;
}

export function colorSwatchMarkdown(colorOrValue: string): string {
  const color = parseColor(colorOrValue);
  if (!color) return '◻️';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect x="1" y="1" width="14" height="14" rx="3" fill="${escapeXml(color)}" stroke="%23888" stroke-width="1"/></svg>`;
  return `![${escapeMarkdownAlt(colorOrValue)}](data:image/svg+xml,${svg})`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeMarkdownAlt(value: string): string {
  return value.replace(/\[|\]/g, '');
}
