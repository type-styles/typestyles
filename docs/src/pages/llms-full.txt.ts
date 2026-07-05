import type { APIRoute } from 'astro';
import { getAllDocs } from '../lib/docs';
import { docEntryToAiMarkdown } from '../lib/aiMarkdown';

export const prerender = true;

export const GET: APIRoute = async () => {
  const docs = await getAllDocs();
  const parts: string[] = [];
  for (const entry of docs) {
    parts.push(await docEntryToAiMarkdown(entry));
  }
  const body = parts.join('\n\n---\n\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
