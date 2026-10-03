// Scaffold de tool-calling. Cada tool: descripción clara para el modelo, `inputSchema` en zod y `execute` en el
// servidor. Valida y autoriza dentro de `execute`: el modelo decide cuándo llamarla, no si el usuario puede.
import { tool } from 'ai';
import { z } from 'zod';

export const tools = {
  currentTime: tool({
    description: 'Current date and time, optionally in an IANA time zone such as "Europe/Madrid".',
    inputSchema: z.object({ timeZone: z.string().optional() }),
    execute: async ({ timeZone }) => ({
      iso: new Date().toISOString(),
      local: new Date().toLocaleString('en-US', timeZone ? { timeZone } : {}),
    }),
  }),
};

export type AppTools = typeof tools;
