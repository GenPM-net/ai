// Registro de uso de la IA: una fila por respuesta del modelo (tokens y coste), para límites y facturación interna.
import { index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { primaryId, timestamps } from '../db/index.js';

export const aiUsage = pgTable(
  'ai_usage',
  {
    id: primaryId('aiu'),
    /** Usuario de la app si lo hay (sin FK: @core/ai no depende de @core/auth). */
    userId: text('user_id'),
    model: text('model').notNull(),
    prompt: text('prompt').notNull(),
    inputTokens: integer('input_tokens').notNull().default(0),
    outputTokens: integer('output_tokens').notNull().default(0),
    /** Coste en millonésimas de dólar (null si el modelo no está en prices.ts). */
    costMicroUsd: integer('cost_micro_usd'),
    ...timestamps,
  },
  (t) => [index('ai_usage_user_idx').on(t.userId, t.createdAt)],
);

export type AiUsage = typeof aiUsage.$inferSelect;
