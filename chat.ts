// Chat con streaming (AI SDK) + registro de uso. Los adaptadores devuelven `result.toUIMessageStreamResponse()`,
// compatible con `useChat` de @ai-sdk/react.
import { convertToModelMessages, stepCountIs, streamText, type ToolSet, type UIMessage } from 'ai';
import { type Executor, getDb } from '../db/index.js';
import { costMicroUsd } from './prices.js';
import { type PromptName, promptKey, prompts } from './prompts.js';
import { aiUsage } from './schema.js';
import { tools as defaultTools } from './tools.js';
import { getModel, modelId } from './model.js';

export async function recordUsage(
  row: { userId: string | null; model: string; prompt: string; inputTokens: number; outputTokens: number },
  db: Executor = getDb(),
): Promise<void> {
  await db.insert(aiUsage).values({ ...row, costMicroUsd: costMicroUsd(row.model, row.inputTokens, row.outputTokens) });
}

/** Límites de lo que el navegador puede mandar: cada mensaje y cada carácter cuestan tokens. */
export const CHAT_LIMITS = { messages: 50, chars: 32_000 };

export class ChatInputError extends Error {}

/**
 * Mensajes que llegan del cliente: solo `user` y `assistant` (un `system` del navegador reemplazaría tus prompts) y
 * dentro de `CHAT_LIMITS`. Lanza `ChatInputError` si no se cumplen.
 */
export function sanitizeMessages(input: unknown): UIMessage[] {
  if (!Array.isArray(input) || input.length === 0) throw new ChatInputError('messages required');
  const messages = (input as UIMessage[]).filter((m) => m && (m.role === 'user' || m.role === 'assistant'));
  if (messages.length === 0) throw new ChatInputError('messages required');
  if (messages.length > CHAT_LIMITS.messages) throw new ChatInputError(`at most ${CHAT_LIMITS.messages} messages`);
  if (JSON.stringify(messages).length > CHAT_LIMITS.chars * 2) throw new ChatInputError(`at most ${CHAT_LIMITS.chars} characters`);
  return messages;
}

export async function streamChat(opts: {
  messages: UIMessage[];
  userId?: string | null;
  prompt?: PromptName;
  tools?: ToolSet;
  maxSteps?: number;
  abortSignal?: AbortSignal;
}) {
  const p = prompts[opts.prompt ?? 'assistant'];
  const model = await getModel();
  const id = modelId();
  const tools = opts.tools ?? defaultTools;
  const result = streamText({
    model,
    system: p.system,
    messages: await convertToModelMessages(sanitizeMessages(opts.messages), { tools }),
    tools,
    stopWhen: stepCountIs(opts.maxSteps ?? 5),
    ...(opts.abortSignal ? { abortSignal: opts.abortSignal } : {}),
  });
  // El uso total (todas las llamadas de la conversación con tools) se registra al terminar, sin bloquear el stream.
  const recorded = Promise.resolve(result.totalUsage)
    .then((u) =>
      recordUsage({
        userId: opts.userId ?? null,
        model: id,
        prompt: promptKey(p),
        inputTokens: u.inputTokens ?? 0,
        outputTokens: u.outputTokens ?? 0,
      }),
    )
    .catch((e: unknown) => console.error('[ai] could not record usage', e));
  return Object.assign(result, { recorded });
}
