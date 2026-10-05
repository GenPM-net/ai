// Adaptador Next.js (App Router): app/api/chat/route.ts → `export const POST = chatRoute();`
import type { UIMessage } from 'ai';
import { ChatInputError, sanitizeMessages, streamChat } from '../index.js';

export function chatRoute(opts: { getUserId?: (req: Request) => Promise<string | null | undefined>; requireUser?: boolean } = {}) {
  return async (req: Request): Promise<Response> => {
    const userId = (await opts.getUserId?.(req)) ?? null;
    if (opts.requireUser && !userId) return Response.json({ error: 'unauthorized' }, { status: 401 });
    const body = (await req.json().catch(() => ({}))) as { messages?: UIMessage[] };
    let messages: UIMessage[];
    try {
      messages = sanitizeMessages(body.messages);
    } catch (e) {
      if (e instanceof ChatInputError) return Response.json({ error: e.message }, { status: 400 });
      throw e;
    }
    const result = await streamChat({ messages, userId, abortSignal: req.signal });
    return result.toUIMessageStreamResponse();
  };
}
