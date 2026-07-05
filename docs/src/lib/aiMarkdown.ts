import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLiveDemoSpec } from '../demos/registry';
import type { DocEntry } from './docs';
import { docHtmlUrl } from './siteUrl';

const docsPackageRoot = fileURLToPath(new URL('../..', import.meta.url));

const LIVE_DEMO_RE = /<!--\s*doc-live-demo\s+id="([^"]+)"\s*-->/g;
const INSTALL_TABS_REGION_RE =
  /<!--\s*doc-install-tabs\s*-->\s*([\s\S]*?)\s*<!--\s*\/doc-install-tabs\s*-->/g;
const INSTALL_FENCE_RE = /```(?:bash|sh)\s*\n([\s\S]*?)```/g;

function parseFrontmatter(markdown: string): { description?: string; body: string } {
  if (!markdown.startsWith('---\n')) {
    return { body: markdown };
  }
  const end = markdown.indexOf('\n---\n', 4);
  if (end === -1) {
    return { body: markdown };
  }
  const raw = markdown.slice(4, end);
  const body = markdown.slice(end + 5);
  let description: string | undefined;
  for (const line of raw.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    if (key === 'description') {
      description = line
        .slice(idx + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');
    }
  }
  return { description, body };
}

async function readDemoSource(id: string): Promise<string> {
  const spec = getLiveDemoSpec(id);
  if (!spec) {
    throw new Error(`Unknown live demo id in doc content: "${id}"`);
  }
  const sourcePath = join(docsPackageRoot, 'src/demos', `${id}.source.txt`);
  try {
    return await readFile(sourcePath, 'utf8');
  } catch {
    const mod = (await spec.load()) as { demoSourceCode?: string };
    if (typeof mod.demoSourceCode === 'string') {
      return mod.demoSourceCode;
    }
    throw new Error(`No demo source for id: "${id}"`);
  }
}

function replaceLiveDemos(markdown: string): string {
  return markdown.replace(LIVE_DEMO_RE, (_full, id: string) => {
    if (!getLiveDemoSpec(id)) {
      throw new Error(`Unknown live demo id in doc content: "${id}"`);
    }
    return `__LIVE_DEMO_${id}__`;
  });
}

async function resolveLiveDemoPlaceholders(markdown: string, htmlUrl: string): Promise<string> {
  const ids = [...markdown.matchAll(/__LIVE_DEMO_([^_]+)__/g)].map((m) => m[1]);
  let out = markdown;
  for (const id of ids) {
    const source = await readDemoSource(id);
    const block = [
      '',
      `> Interactive demo: ${htmlUrl}`,
      '',
      '```ts',
      source.trimEnd(),
      '```',
      '',
    ].join('\n');
    out = out.replace(`__LIVE_DEMO_${id}__`, block);
  }
  return out;
}

function inferTabLabel(code: string): string {
  const first = code.trim().split(/\s+/)[0]?.toLowerCase();
  if (first === 'pnpm' || first === 'npm' || first === 'yarn') return first;
  return 'shell';
}

function normalizeInstallTabGroups(markdown: string): string {
  return markdown.replace(INSTALL_TABS_REGION_RE, (_full, inner: string) => {
    const codes: string[] = [];
    let m: RegExpExecArray | null;
    const re = new RegExp(INSTALL_FENCE_RE.source, INSTALL_FENCE_RE.flags);
    while ((m = re.exec(inner)) !== null) {
      codes.push(m[1].trim());
    }
    if (codes.length === 0) {
      return _full;
    }

    const byLabel = new Map<string, string>();
    for (const code of codes) {
      byLabel.set(inferTabLabel(code), code);
    }

    const pnpm = byLabel.get('pnpm') ?? codes[0];
    const lines = [pnpm];
    for (const label of ['npm', 'yarn'] as const) {
      const alt = byLabel.get(label);
      if (alt && alt !== pnpm) {
        lines.push(`# ${label}: ${alt}`);
      }
    }

    return ['', '```bash', lines.join('\n'), '```', ''].join('\n');
  });
}

export type AiMarkdownOptions = {
  /** When set, appended as the final line (canonical HTML URL). */
  htmlUrl?: string;
};

/** Convert raw doc markdown (with frontmatter) into AI-clean markdown. */
export async function docContentToAiMarkdown(
  rawMarkdown: string,
  meta: { title: string; description?: string; slug: string },
  options: AiMarkdownOptions = {},
): Promise<string> {
  const { description: fmDescription, body } = parseFrontmatter(rawMarkdown);
  const description = meta.description ?? fmDescription;
  const htmlUrl = options.htmlUrl ?? docHtmlUrl(meta.slug);

  let bodyClean = normalizeInstallTabGroups(body);
  bodyClean = replaceLiveDemos(bodyClean);
  bodyClean = await resolveLiveDemoPlaceholders(bodyClean, htmlUrl);

  const parts: string[] = [`# ${meta.title}`];
  if (description) {
    parts.push('', description);
  }
  parts.push('', bodyClean.trimEnd());
  if (htmlUrl) {
    parts.push('', `Source: ${htmlUrl}`);
  }
  return parts.join('\n');
}

/** Convert a loaded `DocEntry` (body only, no frontmatter in content) into AI-clean markdown. */
export async function docEntryToAiMarkdown(
  entry: DocEntry,
  options: AiMarkdownOptions = {},
): Promise<string> {
  const htmlUrl = options.htmlUrl ?? docHtmlUrl(entry.slug);
  let bodyClean = normalizeInstallTabGroups(entry.content);
  bodyClean = replaceLiveDemos(bodyClean);
  bodyClean = await resolveLiveDemoPlaceholders(bodyClean, htmlUrl);

  const parts: string[] = [`# ${entry.title}`];
  if (entry.description) {
    parts.push('', entry.description);
  }
  parts.push('', bodyClean.trimEnd());
  if (htmlUrl) {
    parts.push('', `Source: ${htmlUrl}`);
  }
  return parts.join('\n');
}

/** Exported for unit tests — install tab normalization only. */
export function normalizeInstallTabGroupsForAi(markdown: string): string {
  return normalizeInstallTabGroups(markdown);
}

/** Exported for unit tests — frontmatter strip helper. */
export function stripFrontmatterForAi(markdown: string): { description?: string; body: string } {
  return parseFrontmatter(markdown);
}
