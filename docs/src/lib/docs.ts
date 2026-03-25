import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { codeBlock } from '@examples/design-system';
import { docNavigation } from '../navigation';

export type DocMeta = {
  slug: string;
  title: string;
  description?: string;
};

export type DocEntry = DocMeta & {
  content: string;
  html: string;
};

const docsDir = new URL('../../content/docs', import.meta.url);

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  }),
);

function wrapCodeBlocks(html: string): string {
  // Marked emits <pre><code class="hljs language-xyz">…</code></pre> for fenced blocks.
  // We wrap that structure so the docs site can share a framework-agnostic CodeBlock recipe.
  return html.replace(
    /<pre><code class="hljs language-([^"]*)">([\s\S]*?)<\/code><\/pre>/g,
    (_match, lang: string, highlighted: string) => {
      const safeLang = (lang || 'text').toLowerCase();
      return [
        `<div class="${codeBlock('root')}" data-codeblock>`,
        `  <div class="${codeBlock('header')}">`,
        `    <div class="${codeBlock('title')}">`,
        `      <span class="${codeBlock('language')}">${safeLang}</span>`,
        `    </div>`,
        `    <div class="${codeBlock('actions')}">`,
        `      <button type="button" class="${codeBlock('copyButton')}" data-codeblock-copy aria-label="Copy code">Copy</button>`,
        `    </div>`,
        `  </div>`,
        `  <div class="${codeBlock('body')}">`,
        `    <pre class="${codeBlock('pre')}"><code class="hljs language-${safeLang} ${codeBlock('code')}">${highlighted}</code></pre>`,
        `  </div>`,
        `</div>`,
      ].join('\n');
    },
  );
}

function parseFrontmatter(markdown: string): { data: Record<string, string>; body: string } {
  if (!markdown.startsWith('---\n')) {
    return { data: {}, body: markdown };
  }

  const end = markdown.indexOf('\n---\n', 4);
  if (end === -1) {
    return { data: {}, body: markdown };
  }

  const raw = markdown.slice(4, end);
  const body = markdown.slice(end + 5);
  const data: Record<string, string> = {};

  for (const line of raw.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key) data[key] = value;
  }

  return { data, body };
}

async function listMarkdownFiles(dirPath: URL, acc: string[] = []): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dirPath.pathname, entry.name);
    if (entry.isDirectory()) {
      await listMarkdownFiles(new URL(`${entry.name}/`, dirPath), acc);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function slugFromAbsolutePath(filePath: string): string {
  return relative(docsDir.pathname, filePath).replace(/\\/g, '/').replace(/\.md$/, '');
}

async function loadDocByPath(filePath: string): Promise<DocEntry> {
  const markdown = await readFile(filePath, 'utf8');
  const { data, body } = parseFrontmatter(markdown);
  const slug = slugFromAbsolutePath(filePath);
  const html = wrapCodeBlocks(marked.parse(body) as string);

  return {
    slug,
    title: data.title ?? slug,
    description: data.description,
    content: body,
    html,
  };
}

export async function getAllDocs(): Promise<DocEntry[]> {
  const files = await listMarkdownFiles(docsDir);
  const docs = await Promise.all(files.map((filePath) => loadDocByPath(filePath)));
  return docs.sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function getDocBySlug(slug: string): Promise<DocEntry | null> {
  const path = join(docsDir.pathname, `${slug}.md`);
  try {
    return await loadDocByPath(path);
  } catch {
    return null;
  }
}

export function getDocNeighbors(slug: string): { prev: DocMeta | null; next: DocMeta | null } {
  const allDocs = docNavigation.categories.flatMap((cat) => cat.items);
  const index = allDocs.findIndex((doc) => doc.slug === slug);

  const toMeta = (item: (typeof allDocs)[number] | undefined): DocMeta | null =>
    item ? { slug: item.slug, title: item.title } : null;

  return {
    prev: toMeta(index > 0 ? allDocs[index - 1] : undefined),
    next: toMeta(index >= 0 && index < allDocs.length - 1 ? allDocs[index + 1] : undefined),
  };
}
