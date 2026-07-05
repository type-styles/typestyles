import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listChangelogRefs,
  loadChangelogPage,
  type ChangelogScope,
} from '../../../../lib/changelogs';
import { changelogHtmlUrl } from '../../../../lib/siteUrl';

const repoRoot = fileURLToPath(new URL('../../../../../../', import.meta.url));

export const prerender = true;

export async function getStaticPaths() {
  const refs = await listChangelogRefs();
  return refs.map((ref) => ({
    params: { scope: ref.scope, name: ref.name },
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const scope = params.scope as ChangelogScope | undefined;
  const name = params.name;
  if ((scope !== 'packages' && scope !== 'examples') || !name) {
    return new Response('Not found', { status: 404 });
  }

  const path = join(repoRoot, scope, name, 'CHANGELOG.md');
  let markdown: string;
  try {
    markdown = await readFile(path, 'utf8');
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const page = await loadChangelogPage({ scope, name });
  const footer = page ? `\n\nSource: ${changelogHtmlUrl(scope, name)}` : '';
  return new Response(`${markdown.trimEnd()}${footer}`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
