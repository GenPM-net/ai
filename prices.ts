// Precios por millón de tokens en USD, por id de AI_MODEL. EDITA este archivo con los precios vigentes de tu proveedor;
// los modelos que no estén aquí se registran con coste null.
export const PRICES: Record<string, { input: number; output: number }> = {
  // 'anthropic:<model-id>': { input: 3, output: 15 },
};

/** Coste en millonésimas de dólar (entero, sin errores de coma flotante). */
export function costMicroUsd(model: string, inputTokens: number, outputTokens: number): number | null {
  const p = PRICES[model];
  return p ? Math.round(inputTokens * p.input + outputTokens * p.output) : null;
}
