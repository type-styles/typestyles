import type { APIRoute } from 'astro';
import { getAllDocs, getDocBySlug } from '../../lib/docs';
import { docEntryToAiMarkdown } from '../../lib/aiMarkdown';

export const prerender = true;

export async function getStaticPaths() {
  const docs = await getAllDocs();
  return docs.map((entry) => ({
    params: { slug: entry.slug },
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response('Not found', { status: 404 });
  }
  const entry = await getDocBySlug(slug);
  if (!entry) {
    return new Response('Not found', { status: 404 });
  }
  const markdown = await docEntryToAiMarkdown(entry);
  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
