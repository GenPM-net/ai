// Prompts de sistema versionados: cada cambio sube `version`, y el registro de uso guarda `id@version` para comparar
// calidad y coste entre versiones. Añade aquí los prompts de tu app.
export type PromptDef = { id: string; version: number; system: string };

export const prompts = {
  assistant: {
    id: 'assistant',
    version: 1,
    system:
      'You are a helpful assistant inside this app. Answer concisely. Use the available tools when they help, and say when you do not know.',
  },
} as const satisfies Record<string, PromptDef>;

export type PromptName = keyof typeof prompts;

export const promptKey = (p: PromptDef) => `${p.id}@${p.version}`;
