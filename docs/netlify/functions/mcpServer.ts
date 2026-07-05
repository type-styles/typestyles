import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import MiniSearch from 'minisearch';
import { z } from 'zod';
import bundle from './mcp-content.json';

type SearchIndexItem = {
  slug: string;
  title: string;
  categoryTitle: string;
  description?: string;
  headings: string[];
  body: string;
};

type McpCodeExample = {
  topic: string;
  slug: string;
  heading: string;
  lang: string;
  code: string;
  htmlUrl: string;
};

type McpContentBundle = {
  docs: Record<
    string,
    {
      slug: string;
      title: string;
      description?: string;
      category: string;
      markdown: string;
      mdUrl: string;
      htmlUrl: string;
    }
  >;
  searchIndex: SearchIndexItem[];
  apiReference: Record<string, string>;
  examples: McpCodeExample[];
  changelogs: Record<
    string,
    {
      pkg: string;
      markdown: string;
      versions: Record<string, string>;
    }
  >;
  listDocs: Array<{
    title: string;
    items: Array<{ slug: string; title: string; description?: string }>;
  }>;
};

const content = bundle as McpContentBundle;
const SITE_ORIGIN = 'https://typestyles.dev';

function docMarkdownUrl(slug: string): string {
  return `${SITE_ORIGIN}/docs/${slug}.md`;
}

function createDocSearch(index: SearchIndexItem[]): MiniSearch<SearchIndexItem> {
  const mini = new MiniSearch<SearchIndexItem>({
    fields: ['title', 'description', 'categoryTitle', 'headings', 'body'],
    storeFields: ['slug', 'title', 'description', 'categoryTitle'],
    idField: 'slug',
    searchOptions: {
      boost: { title: 3, categoryTitle: 2, headings: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  mini.addAll(index);
  return mini;
}

function nearestMatches(search: MiniSearch<SearchIndexItem>, query: string, limit = 5): string[] {
  if (!query.trim()) return [];
  return search.search(query, { limit }).map((r) => (r.slug as string).replace(/^\/docs\//, ''));
}

const search = createDocSearch(content.searchIndex);

function didYouMean(query: string, extras: string[] = []): string {
  const matches = nearestMatches(search, query);
  const combined = [...new Set([...extras, ...matches])].slice(0, 5);
  if (combined.length === 0) return '';
  return ` Did you mean: ${combined.map((s) => `"${s}"`).join(', ')}?`;
}

function findApiSymbol(symbol: string): string | undefined {
  const normalized = symbol.trim();
  if (content.apiReference[normalized]) return content.apiReference[normalized];
  const lower = normalized.toLowerCase();
  if (content.apiReference[lower]) return content.apiReference[lower];
  const keys = Object.keys(content.apiReference);
  const partial = keys.find(
    (k) => k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase()),
  );
  return partial ? content.apiReference[partial] : undefined;
}

function findExamples(topic: string, limit = 8): McpCodeExample[] {
  const q = topic.toLowerCase().trim();
  return content.examples
    .map((ex) => {
      const hay = `${ex.topic} ${ex.slug} ${ex.heading}`.toLowerCase();
      let score = 0;
      if (hay.includes(q)) score += 10;
      for (const word of q.split(/\s+/)) {
        if (word.length > 2 && hay.includes(word)) score += 2;
      }
      return { ex, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ ex }) => ex);
}

function toolText(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

export const mcpTools = {
  searchDocs(query: string) {
    const results = search.search(query, { limit: 10 });
    if (results.length === 0) {
      return toolText(`No results for "${query}".${didYouMean(query)}`);
    }
    const lines = results.map((r) => {
      const slug = (r.slug as string).replace(/^\/docs\//, '');
      const doc = content.docs[slug];
      const snippet = doc?.description ?? '';
      return `- **${r.title}** (${doc?.category ?? 'Documentation'})\n  ${snippet}\n  ${docMarkdownUrl(slug)}`;
    });
    return toolText(lines.join('\n\n'));
  },

  getDoc(slug: string) {
    const doc = content.docs[slug];
    if (!doc) {
      return toolText(`Unknown doc slug "${slug}".${didYouMean(slug, Object.keys(content.docs))}`);
    }
    return toolText(doc.markdown);
  },

  listDocs() {
    const lines: string[] = [];
    for (const category of content.listDocs) {
      lines.push(`## ${category.title}`);
      for (const item of category.items) {
        lines.push(`- **${item.title}** (\`${item.slug}\`): ${item.description ?? ''}`);
      }
      lines.push('');
    }
    return toolText(lines.join('\n'));
  },

  lookupApi(symbol: string) {
    const section = findApiSymbol(symbol);
    if (!section) {
      const keys = Object.keys(content.apiReference);
      return toolText(
        `No API section for "${symbol}". Known symbols include: ${keys.slice(0, 10).join(', ')}…${didYouMean(symbol, keys)}`,
      );
    }
    return toolText(section);
  },

  getExamples(topic: string) {
    const examples = findExamples(topic);
    if (examples.length === 0) {
      return toolText(`No examples found for "${topic}".${didYouMean(topic)}`);
    }
    const blocks = examples.map(
      (ex) =>
        `### ${ex.heading} — [${ex.slug}](${ex.htmlUrl})\n\n\`\`\`${ex.lang}\n${ex.code}\n\`\`\``,
    );
    return toolText(blocks.join('\n\n'));
  },

  getChangelog(pkg: string, version?: string) {
    let record = content.changelogs[pkg];
    if (!record) {
      record = content.changelogs[pkg.replace(/^@typestyles\//, '')];
    }
    if (!record) {
      const pkgs = Object.keys(content.changelogs);
      return toolText(
        `Unknown package "${pkg}". Available: ${pkgs.join(', ')}${didYouMean(pkg, pkgs)}`,
      );
    }
    if (version) {
      const entry = record.versions[version];
      if (!entry) {
        const versions = Object.keys(record.versions);
        return toolText(
          `No changelog entry for version "${version}" in ${record.pkg}. Versions: ${versions.slice(0, 8).join(', ')}…`,
        );
      }
      return toolText(entry);
    }
    return toolText(record.markdown);
  },
};

export function listMcpToolNames(): string[] {
  return ['search_docs', 'get_doc', 'list_docs', 'lookup_api', 'get_examples', 'get_changelog'];
}

export function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: 'typestyles-docs', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {} } },
  );

  for (const [slug, doc] of Object.entries(content.docs)) {
    server.registerResource(
      slug,
      `typestyles://docs/${slug}`,
      { description: doc.description ?? doc.title, mimeType: 'text/markdown' },
      async () => ({
        contents: [
          {
            uri: `typestyles://docs/${slug}`,
            mimeType: 'text/markdown',
            text: doc.markdown,
          },
        ],
      }),
    );
  }

  server.registerTool(
    'search_docs',
    {
      description: 'Search typestyles documentation by keyword',
      inputSchema: { query: z.string().describe('Search query') },
    },
    async ({ query }) => mcpTools.searchDocs(query),
  );

  server.registerTool(
    'get_doc',
    {
      description: 'Fetch full clean markdown for a documentation page by slug',
      inputSchema: { slug: z.string().describe('Doc slug, e.g. getting-started') },
    },
    async ({ slug }) => mcpTools.getDoc(slug),
  );

  server.registerTool(
    'list_docs',
    {
      description: 'List all documentation pages grouped by sidebar category',
      inputSchema: {},
    },
    async () => mcpTools.listDocs(),
  );

  server.registerTool(
    'lookup_api',
    {
      description: 'Look up an API symbol section from api-reference',
      inputSchema: { symbol: z.string().describe('API symbol or heading name') },
    },
    async ({ symbol }) => mcpTools.lookupApi(symbol),
  );

  server.registerTool(
    'get_examples',
    {
      description: 'Find code examples from the docs matching a topic',
      inputSchema: { topic: z.string().describe('Topic keyword') },
    },
    async ({ topic }) => mcpTools.getExamples(topic),
  );

  server.registerTool(
    'get_changelog',
    {
      description: 'Get changelog markdown for a package',
      inputSchema: {
        pkg: z.string().describe('Package name, e.g. typestyles'),
        version: z.string().optional().describe('Optional version heading'),
      },
    },
    async ({ pkg, version }) => mcpTools.getChangelog(pkg, version),
  );

  return server;
}

export async function handleMcpRequest(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { toReqRes, toFetchResponse } = await import('fetch-to-node');
  const { req: nodeReq, res: nodeRes } = toReqRes(req);
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);
  const body = await req.json();

  const responsePromise = new Promise<Response>((resolve, reject) => {
    nodeRes.on('finish', () => {
      transport.close();
      server.close();
      resolve(toFetchResponse(nodeRes));
    });
    nodeRes.on('error', reject);
  });

  await transport.handleRequest(nodeReq, nodeRes, body);
  return responsePromise;
}

export { content as mcpContentBundle };
