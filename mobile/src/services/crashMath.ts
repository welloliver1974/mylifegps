/**
 * Matemática pura da detecção de acidente veicular (Etapa 9.3).
 *
 * Este módulo NÃO importa nenhum módulo nativo (sensores, storage), o que o torna
 * auditável e testável fora do app — ver `scripts/test-crash-math.ts`.
 */

export type CrashSensitivity = 'low' | 'medium' | 'high';
export type CrashSeverity = 'minor' | 'moderate' | 'severe';

/**
 * Limiares de magnitude total em Gs (inclui a gravidade de 1G em repouso).
 * Quanto mais sensível, menor o pico necessário para acionar a contagem de segurança.
 */
export const SENSITIVITY_THRESHOLDS: Record<CrashSensitivity, number> = {
  high: 2.5,   // Mais sensível (impactos leves, veículos com suspensão macia)
  medium: 3.0, // Padrão equilibrado (colisões veiculares reais)
  low: 3.8,    // Menos sensível (evita alarme falso em estrada esburacada)
};

export const DEFAULT_SENSITIVITY: CrashSensitivity = 'medium';
export const DEFAULT_MIN_SPEED_KMH = 20;
export const DEFAULT_COUNTDOWN_SECONDS = 30;

/**
 * Magnitude da aceleração vetorial em Gs: sqrt(x² + y² + z²).
 * Em repouso com o aparelho parado o resultado fica próximo de 1.0.
 * Valores não finitos caem para 1.0 (leitura neutra) em vez de propagar NaN.
 */
export function calculateGForce(x: number, y: number, z: number): number {
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  return Number.isFinite(magnitude) ? Math.round(magnitude * 100) / 100 : 1.0;
}

/** Classifica a gravidade estimada do impacto pelo pico de força G. */
export function getGForceSeverity(gForce: number): CrashSeverity {
  if (gForce >= 4.0) return 'severe';
  if (gForce >= 3.0) return 'moderate';
  return 'minor';
}

/** Verdadeiro quando a magnitude atinge o limiar configurado. */
export function isCrashImpact(magnitude: number, thresholdG: number): boolean {
  return magnitude >= thresholdG;
}

/**
 * Verdadeiro quando a velocidade é compatível com deslocamento veicular.
 * Filtra o falso positivo mais comum: o celular cai da mão/mesa com o usuário parado.
 */
export function isSpeedEligible(speedKmh: number, minSpeedKmh: number): boolean {
  return Number.isFinite(speedKmh) && speedKmh >= minSpeedKmh;
}

/** Resolve o limiar em Gs de uma sensibilidade, com fallback seguro para o padrão. */
export function resolveThreshold(sensitivity: CrashSensitivity): number {
  return SENSITIVITY_THRESHOLDS[sensitivity] ?? SENSITIVITY_THRESHOLDS[DEFAULT_SENSITIVITY];
}

/** Monta a mensagem padronizada exibida no painel e enviada por push à família. */
export function formatCrashMessage(
  userName: string | null | undefined,
  gForce: number,
  speedKmh: number
): string {
  const name = (userName || '').trim() || 'Membro da Família';
  const speedText = speedKmh > 0 ? ` a ~${Math.round(speedKmh)} km/h` : '';
  return `🚗💥 POSSÍVEL ACIDENTE DETECTADO: ${name} sofreu impacto de ${gForce.toFixed(1)}G${speedText}! O usuário não respondeu ao alerta de segurança.`;
}

/** Valida e normaliza a configuração lida do armazenamento local. */
export function normalizeCrashConfig(raw: any): {
  enabled: boolean;
  sensitivity: CrashSensitivity;
  minSpeedKmh: number;
  countdownSeconds: number;
} {
  const parsed = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
    sensitivity: (['low', 'medium', 'high'] as CrashSensitivity[]).includes(parsed.sensitivity)
      ? (parsed.sensitivity as CrashSensitivity)
      : DEFAULT_SENSITIVITY,
    minSpeedKmh:
      typeof parsed.minSpeedKmh === 'number' && parsed.minSpeedKmh >= 0
        ? parsed.minSpeedKmh
        : DEFAULT_MIN_SPEED_KMH,
    countdownSeconds:
      typeof parsed.countdownSeconds === 'number' && parsed.countdownSeconds > 0
        ? parsed.countdownSeconds
        : DEFAULT_COUNTDOWN_SECONDS,
  };
}

/** Verdadeiro quando o evento pode disparar o fluxo (impacto + velocidade elegível). */
export function shouldTriggerCrashFlow(params: {
  magnitude: number;
  speedKmh: number;
  sensitivity: CrashSensitivity;
  minSpeedKmh: number;
}): boolean {
  const threshold = resolveThreshold(params.sensitivity);
  return isCrashImpact(params.magnitude, threshold) && isSpeedEligible(params.speedKmh, params.minSpeedKmh);
}
