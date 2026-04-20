import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderDocBodyToHtml } from './docs';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

export type ChangelogScope = 'packages' | 'examples';

export type ChangelogRef = {
  scope: ChangelogScope;
  name: string;
};

export type ChangelogPage = ChangelogRef & {
  title: string;
  html: string;
  lastModified?: string;
};

function splitLeadingH1(markdown: string): { title: string; body: string } {
  const trimmed = markdown.replace(/^\uFEFF/, '').trimStart();
  const nl = trimmed.indexOf('\n');
  const firstLine = nl === -1 ? trimmed : trimmed.slice(0, nl);
  if (firstLine.startsWith('# ')) {
    const title = firstLine.slice(2).trim();
    const body = (nl === -1 ? '' : trimmed.slice(nl + 1)).trimStart();
    return { title: title || 'Changelog', body };
  }
  return { title: 'Changelog', body: trimmed };
}

export async function listChangelogRefs(): Promise<ChangelogRef[]> {
  const refs: ChangelogRef[] = [];
  for (const scope of ['packages', 'examples'] as const) {
    const base = join(repoRoot, scope);
    let entries;
    try {
      entries = await readdir(base, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const changelogPath = join(base, ent.name, 'CHANGELOG.md');
      try {
        await stat(changelogPath);
        refs.push({ scope, name: ent.name });
      } catch {
        /* no changelog */
      }
    }
  }
  return refs.sort((a, b) => `${a.scope}/${a.name}`.localeCompare(`${b.scope}/${b.name}`));
}

export async function loadChangelogPage(ref: ChangelogRef): Promise<ChangelogPage | null> {
  const path = join(repoRoot, ref.scope, ref.name, 'CHANGELOG.md');
  let markdown: string;
  let lastModified: string | undefined;
  try {
    markdown = await readFile(path, 'utf8');
    const st = await stat(path);
    lastModified = st.mtime.toISOString();
  } catch {
    return null;
  }
  const { title, body } = splitLeadingH1(markdown);
  const html = renderDocBodyToHtml(body);
  return { ...ref, title, html, lastModified };
}
