/** Base URL for “edit this page” links (markdown under `docs/content/docs/`). */
export const DOCS_GITHUB_EDIT_BASE =
  'https://github.com/typestyles/typestyles/edit/main/docs/content/docs';

export function editUrlForDocSlug(slug: string): string {
  return `${DOCS_GITHUB_EDIT_BASE}/${slug}.md`;
}
