// Adaptador Next.js (App Router): app/api/chat/route.ts → `export const POST = chatRoute();`
import type { UIMessage } from 'ai';
import { streamChat } from '../index.js';

export function chatRoute(opts: { getUserId?: (req: Request) => Promise<string | null | undefined>; requireUser?: boolean } = {}) {
  return async (req: Request): Promise<Response> => {
    const userId = (await opts.getUserId?.(req)) ?? null;
    if (opts.requireUser && !userId) return Response.json({ error: 'unauthorized' }, { status: 401 });
    const body = (await req.json().catch(() => ({}))) as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages)) return Response.json({ error: 'messages required' }, { status: 400 });
    const result = await streamChat({ messages: body.messages, userId, abortSignal: req.signal });
    return result.toUIMessageStreamResponse();
  };
}
