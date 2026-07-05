import type { APIRoute } from 'astro';
import { getAllDocs } from '../lib/docs';
import { buildDocsIndex } from '../lib/docsIndex';

export const prerender = true;

export const GET: APIRoute = async () => {
  const docs = await getAllDocs();
  const index = buildDocsIndex(docs);
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
