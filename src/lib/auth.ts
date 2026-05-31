import { NextRequest } from 'next/server';
import { getAgentByApiKey } from './store';

export async function getAgentFromRequest(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return null;
  return getAgentByApiKey(apiKey);
}
