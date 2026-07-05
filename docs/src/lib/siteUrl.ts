/** Canonical production origin for AI-facing URLs and metadata. */
export const SITE_ORIGIN = 'https://typestyles.dev';

export function docHtmlUrl(slug: string): string {
  return `${SITE_ORIGIN}/docs/${slug}`;
}

export function docMarkdownUrl(slug: string): string {
  return `${SITE_ORIGIN}/docs/${slug}.md`;
}

export function changelogHtmlUrl(scope: string, name: string): string {
  return `${SITE_ORIGIN}/docs/changelog/${scope}/${name}`;
}

export function changelogMarkdownUrl(scope: string, name: string): string {
  return `${SITE_ORIGIN}/docs/changelog/${scope}/${name}.md`;
}
