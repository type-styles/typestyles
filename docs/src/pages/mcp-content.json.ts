import type { APIRoute } from 'astro';
import { buildMcpContentBundle } from '../lib/mcpContent';

export const prerender = true;

export const GET: APIRoute = async () => {
  const bundle = await buildMcpContentBundle();
  return new Response(JSON.stringify(bundle), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
