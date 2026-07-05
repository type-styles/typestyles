import type { APIRoute } from 'astro';
import { getAllDocs } from '../lib/docs';
import { buildLlmsTxt } from '../lib/llmsTxt';

export const prerender = true;

export const GET: APIRoute = async () => {
  const docs = await getAllDocs();
  const docsBySlug = Object.fromEntries(docs.map((entry) => [entry.slug, entry]));
  const body = buildLlmsTxt(docsBySlug);
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
