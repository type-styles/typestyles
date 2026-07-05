import type { DocEntry } from './docs';
import { docNavigation } from '../navigation';
import { docMarkdownUrl, SITE_ORIGIN } from './siteUrl';

const PROJECT_SUMMARY =
  'TypeStyles is CSS-in-TypeScript: type-safe styles, design tokens as CSS custom properties, and zero-runtime production extraction via bundler plugins.';

export function buildLlmsTxt(docsBySlug: Record<string, DocEntry>): string {
  const lines: string[] = ['# typestyles', '', `> ${PROJECT_SUMMARY}`, ''];

  for (const category of docNavigation.categories) {
    lines.push(`## ${category.title}`);
    for (const item of category.items) {
      if (!item.slug) continue;
      const doc = docsBySlug[item.slug];
      const description = doc?.description ?? item.title;
      lines.push(`- [${item.title}](${docMarkdownUrl(item.slug)}): ${description}`);
    }
    lines.push('');
  }

  lines.push('## Optional');
  lines.push(
    `- [Full documentation bundle](${SITE_ORIGIN}/llms-full.txt): all pages as clean markdown`,
  );
  lines.push(
    `- [Documentation index](${SITE_ORIGIN}/docs-index.json): machine-readable doc metadata`,
  );
  lines.push(`- [Changelog index](${SITE_ORIGIN}/docs/changelog): package and example changelogs`);
  lines.push(`- [MCP server](${SITE_ORIGIN}/mcp): query docs from coding agents`);
  lines.push('');

  return lines.join('\n');
}
