import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import MiniSearch from 'minisearch';
import { getAllDocs, type DocEntry } from './docs';
import { docEntryToAiMarkdown } from './aiMarkdown';
import { buildSearchIndex, type SearchIndexItem } from './searchIndex';
import { listChangelogRefs, type ChangelogRef } from './changelogs';
import { docHtmlUrl, docMarkdownUrl } from './siteUrl';
import { findDoc } from '../navigation';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

export type McpDocRecord = {
  slug: string;
  title: string;
  description?: string;
  category: string;
  markdown: string;
  mdUrl: string;
  htmlUrl: string;
};

export type McpCodeExample = {
  topic: string;
  slug: string;
  heading: string;
  lang: string;
  code: string;
  htmlUrl: string;
};

export type McpChangelogRecord = {
  scope: string;
  name: string;
  pkg: string;
  markdown: string;
  versions: Record<string, string>;
};

export type McpListDocsCategory = {
  title: string;
  items: Array<{ slug: string; title: string; description?: string }>;
};

export type McpContentBundle = {
  version: 1;
  docs: Record<string, McpDocRecord>;
  searchIndex: SearchIndexItem[];
  apiReference: Record<string, string>;
  examples: McpCodeExample[];
  changelogs: Record<string, McpChangelogRecord>;
  listDocs: McpListDocsCategory[];
};

const FENCE_RE = /```(\w*)\n([\s\S]*?)```/g;

/** Split api-reference clean markdown into symbol-keyed sections. */
export function splitApiReferenceSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = markdown.split('\n');
  let currentKey: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentKey && currentLines.length > 0) {
      sections[currentKey] = currentLines.join('\n').trim();
    }
  };

  for (const line of lines) {
    const h3 = /^###\s+`([^`]+)`/.exec(line);
    const h2 = /^##\s+(.+)$/.exec(line);
    if (h3) {
      flush();
      currentKey = h3[1].trim();
      currentLines = [line];
      continue;
    }
    if (h2 && !h3) {
      flush();
      currentKey = h2[1].trim();
      currentLines = [line];
      continue;
    }
    if (currentKey) {
      currentLines.push(line);
    }
  }
  flush();

  // Index dotted method symbols from bullet lines like `- styles.component(...)`
  for (const [key, section] of Object.entries({ ...sections })) {
    const methodRe = /-\s+`([a-zA-Z0-9_.]+)\([^`]*\)`/g;
    let m: RegExpExecArray | null;
    while ((m = methodRe.exec(section)) !== null) {
      const symbol = m[1];
      if (!sections[symbol]) {
        sections[symbol] = section;
      }
    }
    // Also expose bare heading keys lowercased
    sections[key.toLowerCase()] = section;
  }

  return sections;
}

function extractCodeExamples(docs: DocEntry[]): McpCodeExample[] {
  const examples: McpCodeExample[] = [];

  for (const doc of docs) {
    // Walk content tracking nearest heading per fence
    let lastHeading = doc.title;
    const fenceRe = new RegExp(FENCE_RE.source, FENCE_RE.flags);
    let m: RegExpExecArray | null;
    let pos = 0;
    while ((m = fenceRe.exec(doc.content)) !== null) {
      const before = doc.content.slice(pos, m.index);
      pos = m.index + m[0].length;
      const headingMatches = [...before.matchAll(/^(#{1,6})\s+(.+)$/gm)];
      if (headingMatches.length > 0) {
        lastHeading = headingMatches[headingMatches.length - 1][2].replace(/`/g, '').trim();
      }
      const lang = m[1] || 'text';
      const code = m[2].trim();
      if (code.length < 8) continue;
      examples.push({
        topic: `${doc.slug} ${lastHeading}`.toLowerCase(),
        slug: doc.slug,
        heading: lastHeading,
        lang,
        code,
        htmlUrl: docHtmlUrl(doc.slug),
      });
    }
  }

  return examples;
}

function splitChangelogVersions(markdown: string): Record<string, string> {
  const versions: Record<string, string> = {};
  const parts = markdown.split(/^##\s+/m);
  for (const part of parts) {
    if (!part.trim()) continue;
    const nl = part.indexOf('\n');
    const versionLine = nl === -1 ? part : part.slice(0, nl);
    const body = nl === -1 ? '' : part.slice(nl + 1);
    const version = versionLine.trim();
    if (version) {
      versions[version] = `## ${version}\n${body}`.trim();
    }
  }
  return versions;
}

async function loadChangelogMarkdown(ref: ChangelogRef): Promise<string> {
  const path = join(repoRoot, ref.scope, ref.name, 'CHANGELOG.md');
  return readFile(path, 'utf8');
}

export async function buildMcpContentBundle(): Promise<McpContentBundle> {
  const docs = await getAllDocs();
  const searchIndex = await buildSearchIndex();
  const docsRecord: Record<string, McpDocRecord> = {};

  for (const entry of docs) {
    const nav = findDoc(entry.slug);
    const markdown = await docEntryToAiMarkdown(entry);
    docsRecord[entry.slug] = {
      slug: entry.slug,
      title: entry.title,
      ...(entry.description ? { description: entry.description } : {}),
      category: nav?.category.title ?? 'Documentation',
      markdown,
      mdUrl: docMarkdownUrl(entry.slug),
      htmlUrl: docHtmlUrl(entry.slug),
    };
  }

  const apiMarkdown = docsRecord['api-reference']?.markdown ?? '';
  const apiReference = splitApiReferenceSections(apiMarkdown);
  const examples = extractCodeExamples(docs);

  const changelogRefs = await listChangelogRefs();
  const changelogs: Record<string, McpChangelogRecord> = {};
  for (const ref of changelogRefs) {
    const markdown = await loadChangelogMarkdown(ref);
    const pkg = ref.name;
    changelogs[pkg] = {
      scope: ref.scope,
      name: ref.name,
      pkg,
      markdown,
      versions: splitChangelogVersions(markdown),
    };
  }

  const { docNavigation } = await import('../navigation');
  const listDocs: McpListDocsCategory[] = docNavigation.categories.map((category) => ({
    title: category.title,
    items: category.items
      .filter((item): item is { slug: string; title: string } => Boolean(item.slug))
      .map((item) => {
        const doc = docsRecord[item.slug];
        return {
          slug: item.slug,
          title: item.title,
          ...(doc?.description ? { description: doc.description } : {}),
        };
      }),
  }));

  return {
    version: 1,
    docs: docsRecord,
    searchIndex,
    apiReference,
    examples,
    changelogs,
    listDocs,
  };
}

export function createDocSearch(index: SearchIndexItem[]): MiniSearch<SearchIndexItem> {
  const mini = new MiniSearch<SearchIndexItem>({
    fields: ['title', 'description', 'categoryTitle', 'headings', 'body'],
    storeFields: ['slug', 'title', 'description', 'categoryTitle'],
    idField: 'slug',
    searchOptions: {
      boost: { title: 3, categoryTitle: 2, headings: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  mini.addAll(index);
  return mini;
}

export function nearestMatches(
  search: MiniSearch<SearchIndexItem>,
  query: string,
  limit = 5,
): string[] {
  if (!query.trim()) return [];
  const results = search.search(query, { limit });
  return results.map((r) => {
    const slug = (r.slug as string).replace(/^\/docs\//, '');
    return slug;
  });
}
