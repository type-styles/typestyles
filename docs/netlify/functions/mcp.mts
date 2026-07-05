import type { Config } from '@netlify/functions';
import { handleMcpRequest } from './mcpServer';

export default async (req: Request) => handleMcpRequest(req);

export const config: Config = {
  path: '/mcp',
};
