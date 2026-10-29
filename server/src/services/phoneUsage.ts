import { prisma } from '../db.js';

/**
 * Uso de celular ao volante (Etapa 10.3)
 *
 * Como funciona a detecção: o cliente (PWA e, por consequência, o WebView do APK)
 * só consegue observar a própria tela. Enquanto a tela estiver ATIVA (documento
 * visível) e o veículo se deslocando acima do limiar, contamos tempo de "celular
 * ao volante". Quando a tela apaga ou o veículo para, o episódio é consolidado e
 * enviado ao servidor.
 *
 * Limitação honesta: se o usuário estiver mexendo em OUTRO app, o nosso não tem
 * como saber sem a permissão Android de estatísticas de uso (UsageStats), que
 * exige um build nativo dedicado. Esse caso não é contado.
 */

export const PHONE_USAGE_MIN_SPEED_KMH = 20;
export const PHONE_USAGE_MIN_DURATION_SEC = 15; // episódios curtos são ruído
export const PHONE_USAGE_MAX_DURATION_SEC = 4 * 60 * 60; // 4 horas

export type PhoneUsageSource = 'pwa_visible' | 'apk_appstate' | 'manual';

export interface PhoneUsageWindow {
  startedAt: Date | string;
  endedAt: Date | string;
  durationSeconds: number;
  maxSpeedKmH?: number | null;
  source?: string;
}

export interface RecordPhoneUsageInput {
  deviceId: string;
  startedAt: Date;
  endedAt: Date;
  durationSeconds?: number | null;
  maxSpeedKmH?: number | null;
  source?: string;
}

export interface RecordPhoneUsageResult {
  ok: boolean;
  reason?: string;
  event?: { id: string; durationSeconds: number; startedAt: string; endedAt: string };
}

const VALID_SOURCES: PhoneUsageSource[] = ['pwa_visible', 'apk_appstate', 'manual'];

/**
 * Consolida e grava um episódio de uso de celular ao volante.
 * Rejeita durações implausíveis e episódios duplicados (mais de 70% de sobreposição
 * com um evento já registrado para o mesmo aparelho), o que protege contra
 * reenvios do cliente em reconexões de rede.
 */
export async function recordPhoneUsage(input: RecordPhoneUsageInput): Promise<RecordPhoneUsageResult> {
  const startedAt = new Date(input.startedAt);
  const endedAt = new Date(input.endedAt);

  if (isNaN(startedAt.getTime()) || isNaN(endedAt.getTime())) {
    return { ok: false, reason: 'Datas inválidas' };
  }
  if (endedAt.getTime() <= startedAt.getTime()) {
    return { ok: false, reason: 'O fim do episódio deve ser posterior ao início' };
  }

  const windowSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);
  const durationSeconds = Math.round(Number(input.durationSeconds) || windowSeconds);

  if (durationSeconds < PHONE_USAGE_MIN_DURATION_SEC) {
    return { ok: false, reason: `Episódio curto demais (mínimo ${PHONE_USAGE_MIN_DURATION_SEC}s)` };
  }
  if (durationSeconds > PHONE_USAGE_MAX_DURATION_SEC) {
    return { ok: false, reason: 'Episódio longo demais (máximo 4 horas)' };
  }

  const source = VALID_SOURCES.includes(String(input.source) as PhoneUsageSource)
    ? String(input.source)
    : 'pwa_visible';

  const maxSpeed = Number(input.maxSpeedKmH);
  const maxSpeedKmH = Number.isFinite(maxSpeed) && maxSpeed > 0 ? Math.min(300, Math.round(maxSpeed)) : null;

  // Anti-duplicação: se já existe um evento praticamente igual na mesma janela, ignora
  const existing = await prisma.phoneUsageEvent.findMany({
    where: { deviceId: input.deviceId, startedAt: { gte: new Date(startedAt.getTime() - 5 * 60000) } },
    select: { id: true, startedAt: true, endedAt: true, durationSeconds: true },
  });

  for (const ev of existing) {
    const overlapStart = Math.max(startedAt.getTime(), ev.startedAt.getTime());
    const overlapEnd = Math.min(endedAt.getTime(), ev.endedAt.getTime());
    const overlapSec = Math.max(0, (overlapEnd - overlapStart) / 1000);
    if (overlapSec > 0 && overlapSec >= 0.7 * Math.min(durationSeconds, ev.durationSeconds)) {
      return { ok: false, reason: 'Episódio já registrado', event: { id: ev.id, durationSeconds: ev.durationSeconds, startedAt: ev.startedAt.toISOString(), endedAt: ev.endedAt.toISOString() } };
    }
  }

  const created = await prisma.phoneUsageEvent.create({
    data: {
      deviceId: input.deviceId,
      startedAt,
      endedAt,
      durationSeconds,
      maxSpeedKmH,
      source,
    },
  });

  return {
    ok: true,
    event: {
      id: created.id,
      durationSeconds: created.durationSeconds,
      startedAt: created.startedAt.toISOString(),
      endedAt: created.endedAt.toISOString(),
    },
  };
}

/**
 * Busca os episódios de uso de celular de um conjunto de aparelhos dentro de um intervalo.
 * O filtro considera qualquer episódio que TOCA a janela (não só os iniciados dentro dela).
 */
export async function fetchPhoneUsageWindows(
  deviceIds: string[],
  from: Date,
  to: Date
): Promise<PhoneUsageWindow[]> {
  if (!deviceIds || deviceIds.length === 0) return [];

  const rows = await prisma.phoneUsageEvent.findMany({
    where: {
      deviceId: { in: deviceIds },
      startedAt: { lte: to },
      endedAt: { gte: from },
    },
    select: { startedAt: true, endedAt: true, durationSeconds: true, maxSpeedKmH: true, source: true },
    orderBy: { startedAt: 'asc' },
  });

  return rows.map((r) => ({
    startedAt: r.startedAt,
    endedAt: r.endedAt,
    durationSeconds: r.durationSeconds,
    maxSpeedKmH: r.maxSpeedKmH,
    source: r.source,
  }));
}

/**
 * Soma, em segundos, quanto dos episódios cai dentro de uma janela [start, end].
 * A sobreposição é limitada pela duração real do evento, para não inflar o tempo
 * quando o cliente reporta uma janela maior do que o tempo efetivamente em uso.
 */
export function sumPhoneUsageSeconds(
  windows: PhoneUsageWindow[] | undefined | null,
  startTime: Date | string,
  endTime: Date | string
): number {
  if (!windows || windows.length === 0) return 0;

  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (!(end > start)) return 0;

  let total = 0;
  for (const w of windows) {
    const wStart = new Date(w.startedAt).getTime();
    const wEnd = new Date(w.endedAt).getTime();
    if (isNaN(wStart) || isNaN(wEnd)) continue;

    const overlapStart = Math.max(start, wStart);
    const overlapEnd = Math.min(end, wEnd);
    if (overlapEnd <= overlapStart) continue;

    const windowSpan = (wEnd - wStart) / 1000;
    const declared = Number(w.durationSeconds) || windowSpan;
    const overlapSec = (overlapEnd - overlapStart) / 1000;

    // Proporcional à duração declarada (o cliente pode pausar o contador dentro da janela)
    const ratio = windowSpan > 0 ? Math.min(1, declared / windowSpan) : 1;
    total += overlapSec * ratio;
  }

  return Math.round(total);
}

/** Converte segundos em minutos inteiros (arredonda para baixo). */
export function secondsToMinutes(seconds: number): number {
  return Math.floor((Number(seconds) || 0) / 60);
}

/**
 * Penalidade na nota de direção por uso de celular ao volante.
 * 2,5 pontos por minuto, com teto de 25 pontos (10 minutos já zeram o teto).
 */
export function phoneUsagePenalty(phoneUsageMinutes: number): number {
  const minutes = Number(phoneUsageMinutes) || 0;
  if (minutes <= 0) return 0;
  return Math.min(25, Math.round(minutes * 2.5));
}
