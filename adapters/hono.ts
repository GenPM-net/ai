// Adaptador Hono: `app.route('/ai', aiRoutes())` → POST /ai/chat (stream para `useChat`).
// Si usas @core/auth, monta antes `sessionMiddleware` y pasa `getUserId` para registrar el uso por usuario.
import type { Context } from 'hono';
import { Hono } from 'hono';
import type { UIMessage } from 'ai';
import { ChatInputError, sanitizeMessages, streamChat } from '../index.js';

export function aiRoutes(opts: { getUserId?: (c: Context) => string | null | undefined; requireUser?: boolean } = {}) {
  return new Hono().post('/chat', async (c) => {
    const userId = opts.getUserId?.(c) ?? null;
    if (opts.requireUser && !userId) return c.json({ error: 'unauthorized' }, 401);
    const body = await c.req.json<{ messages?: UIMessage[] }>().catch(() => ({ messages: undefined }));
    let messages: UIMessage[];
    try {
      messages = sanitizeMessages(body.messages);
    } catch (e) {
      if (e instanceof ChatInputError) return c.json({ error: e.message }, 400);
      throw e;
    }
    const result = await streamChat({ messages, userId, abortSignal: c.req.raw.signal });
    return result.toUIMessageStreamResponse();
  });
}
