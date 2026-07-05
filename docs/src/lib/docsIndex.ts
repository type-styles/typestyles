import type { DocEntry } from './docs';
import { findDoc } from '../navigation';
import { docHtmlUrl, docMarkdownUrl } from './siteUrl';

export type DocsIndexEntry = {
  slug: string;
  title: string;
  description?: string;
  category: string;
  mdUrl: string;
  htmlUrl: string;
};

export function buildDocsIndex(docs: DocEntry[]): DocsIndexEntry[] {
  return docs.map((entry) => {
    const nav = findDoc(entry.slug);
    return {
      slug: entry.slug,
      title: entry.title,
      ...(entry.description ? { description: entry.description } : {}),
      category: nav?.category.title ?? 'Documentation',
      mdUrl: docMarkdownUrl(entry.slug),
      htmlUrl: docHtmlUrl(entry.slug),
    };
  });
}
