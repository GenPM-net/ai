// Modelo por entorno, nunca fijo en el código:
//   AI_MODEL="anthropic:<model-id>" (o "openai:…", "google:…", "mistral:…", "groq:…", "xai:…") + AI_PROVIDER_API_KEY
//   e instala el paquete del proveedor (`@ai-sdk/anthropic`, `@ai-sdk/openai`…).
//   AI_MODEL="<provider>/<model>" usa el AI Gateway de Vercel (AI_GATEWAY_API_KEY), sin paquete extra.
import type { LanguageModel } from 'ai';

const FACTORIES: Record<string, { pkg: string; fn: string }> = {
  anthropic: { pkg: '@ai-sdk/anthropic', fn: 'createAnthropic' },
  openai: { pkg: '@ai-sdk/openai', fn: 'createOpenAI' },
  google: { pkg: '@ai-sdk/google', fn: 'createGoogleGenerativeAI' },
  mistral: { pkg: '@ai-sdk/mistral', fn: 'createMistral' },
  groq: { pkg: '@ai-sdk/groq', fn: 'createGroq' },
  xai: { pkg: '@ai-sdk/xai', fn: 'createXai' },
};

let override: LanguageModel | null = null;

/** Fija el modelo a mano (tests, o un proveedor que no está en la lista). */
export function setModel(model: LanguageModel | null): void {
  override = model;
}

export function modelId(env: NodeJS.ProcessEnv = process.env): string {
  if (override) return typeof override === 'string' ? override : `${override.provider}:${override.modelId}`;
  const id = env.AI_MODEL;
  if (!id) throw new Error('AI_MODEL is not set, e.g. "anthropic:<model-id>" (see src/lib/ai/AGENTS.md)');
  return id;
}

export async function getModel(env: NodeJS.ProcessEnv = process.env): Promise<LanguageModel> {
  if (override) return override;
  const id = modelId(env);
  const sep = id.indexOf(':');
  if (sep < 0) return id; // "<provider>/<model>" → AI Gateway
  const provider = id.slice(0, sep);
  const name = id.slice(sep + 1);
  const f = FACTORIES[provider];
  if (!f) throw new Error(`Unknown AI provider "${provider}". Use one of ${Object.keys(FACTORIES).join(', ')} or setModel().`);
  let mod: Record<string, unknown>;
  try {
    mod = (await import(f.pkg)) as Record<string, unknown>;
  } catch {
    throw new Error(`Install ${f.pkg} to use AI_MODEL=${id}`);
  }
  const create = mod[f.fn] as (opts: { apiKey?: string }) => (model: string) => LanguageModel;
  return create({ apiKey: env.AI_PROVIDER_API_KEY })(name);
}
