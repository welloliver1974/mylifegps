import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../db.js';
import { sendPushToUser, PushPayload } from './push.js';
import { getHistoricalDrivingReport } from './tripDetection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STATE_FILE = path.join(DATA_DIR, 'weekly-summary-state.json');

export interface WeeklySummaryState {
  lastSentWeek: string | null;
  lastRunAt: string | null;
  lastRunType: 'auto' | 'manual' | null;
  lastResults?: Array<{
    userId: string;
    userName: string;
    success: boolean;
    pushedCount: number;
    distanceKm: number;
    score: number;
    trips: number;
  }>;
}

let schedulerTimer: NodeJS.Timeout | null = null;

export function getIsoWeekKey(d: Date = new Date()): string {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function loadWeeklySummaryState(): WeeklySummaryState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[WeeklySummary] Falha ao ler estado salvo:', err);
  }
  return {
    lastSentWeek: null,
    lastRunAt: null,
    lastRunType: null,
  };
}

export function saveWeeklySummaryState(state: WeeklySummaryState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[WeeklySummary] Falha ao salvar estado:', err);
  }
}

export interface UserWeeklySummary {
  userId: string;
  userName: string;
  hasTrips: boolean;
  totalTrips: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  overallMaxSpeedKmH: number;
  averageScore: number;
  overallGrade: 'Excelente' | 'Bom' | 'Atenção';
  totalHardBrakingEvents: number;
  totalRapidAccelEvents: number;
  totalSpeedEvents: number;
  totalPhoneUsageMinutes: number;
  trend: 'improving' | 'stable' | 'declining';
  payload: PushPayload;
}

/**
 * Constrói o relatório semanal e prepara a notificação push para um membro.
 */
export async function buildWeeklySummaryForUser(
  userId: string,
  referenceDate: Date = new Date()
): Promise<UserWeeklySummary | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });
  if (!user) return null;

  const report = await getHistoricalDrivingReport(userId, 'week', referenceDate);
  const summary = report.summary;

  const hasTrips = summary.totalTrips > 0 && summary.totalDistanceKm > 0;
  const currentWeekKey = getIsoWeekKey(referenceDate);

  let title = '';
  let body = '';

  if (hasTrips) {
    const dist = summary.totalDistanceKm.toFixed(1);
    const score = summary.averageScore;

    if (score >= 90) {
      title = `🏆 Resumo da Semana: ${dist} km com nota ${score}/100!`;
    } else if (score >= 75) {
      title = `🚗 Resumo da Semana: ${dist} km (Nota ${score}/100)`;
    } else {
      title = `⚠️ Resumo da Semana: ${dist} km (Nota ${score}/100)`;
    }

    const tripsLabel = summary.totalTrips === 1 ? '1 viagem' : `${summary.totalTrips} viagens`;
    const parts: string[] = [
      tripsLabel,
      `Vel. máx: ${summary.overallMaxSpeedKmH} km/h`,
    ];

    if (summary.totalHardBrakingEvents > 0) {
      const fbLabel = summary.totalHardBrakingEvents === 1 ? '1 frenagem' : `${summary.totalHardBrakingEvents} frenagens`;
      parts.push(fbLabel);
    }
    if (summary.totalRapidAccelEvents > 0) {
      const raLabel = summary.totalRapidAccelEvents === 1 ? '1 arrancada' : `${summary.totalRapidAccelEvents} arrancadas`;
      parts.push(raLabel);
    }
    if (summary.totalPhoneUsageMinutes > 0) {
      parts.push(`${summary.totalPhoneUsageMinutes} min celular`);
    }
    if (summary.trend === 'improving') {
      parts.push('📈 Melhorando');
    }

    body = parts.join(' • ');
  } else {
    title = '🚗 Resumo da Semana: Nenhuma viagem';
    body = 'Nenhum deslocamento veicular registrado nos últimos 7 dias. Seu círculo familiar esteve seguro e tranquilo!';
  }

  const payload: PushPayload = {
    title,
    body,
    tag: `weekly-summary-${currentWeekKey}`,
    data: {
      url: `/?action=driver-report&userId=${user.id}&period=week`,
      type: 'weekly_summary',
      userId: user.id,
      week: currentWeekKey,
    },
  };

  return {
    userId: user.id,
    userName: user.name,
    hasTrips,
    totalTrips: summary.totalTrips,
    totalDistanceKm: summary.totalDistanceKm,
    totalDurationMinutes: summary.totalDurationMinutes,
    overallMaxSpeedKmH: summary.overallMaxSpeedKmH,
    averageScore: summary.averageScore,
    overallGrade: summary.overallGrade,
    totalHardBrakingEvents: summary.totalHardBrakingEvents,
    totalRapidAccelEvents: summary.totalRapidAccelEvents,
    totalSpeedEvents: summary.totalSpeedEvents,
    totalPhoneUsageMinutes: summary.totalPhoneUsageMinutes,
    trend: summary.trend,
    payload,
  };
}

/**
 * Envia o resumo semanal para um usuário específico (Web Push e Expo Push).
 */
export async function sendWeeklySummaryToUser(
  userId: string,
  options: { force?: boolean; referenceDate?: Date; skipIfNoTrips?: boolean } = {}
): Promise<{
  success: boolean;
  pushedCount: number;
  summary: UserWeeklySummary | null;
  message?: string;
}> {
  const summary = await buildWeeklySummaryForUser(userId, options.referenceDate);
  if (!summary) {
    return { success: false, pushedCount: 0, summary: null, message: 'Usuário não encontrado' };
  }

  if (options.skipIfNoTrips && !summary.hasTrips && !options.force) {
    return {
      success: true,
      pushedCount: 0,
      summary,
      message: 'Pulado pois não houve viagens registradas na semana',
    };
  }

  const pushedCount = await sendPushToUser(userId, summary.payload);

  return {
    success: pushedCount > 0,
    pushedCount,
    summary,
    message: pushedCount > 0
      ? `Resumo enviado com sucesso para ${pushedCount} aparelho(s)`
      : 'Nenhum aparelho com Push ativo para este membro',
  };
}

/**
 * Envia o resumo semanal para todos os membros cadastrados no círculo familiar.
 */
export async function sendWeeklySummaryToAllMembers(
  options: { force?: boolean; referenceDate?: Date; skipIfNoTrips?: boolean; runType?: 'auto' | 'manual' } = {}
): Promise<{
  week: string;
  totalUsers: number;
  notifiedCount: number;
  results: Array<{
    userId: string;
    userName: string;
    success: boolean;
    pushedCount: number;
    distanceKm: number;
    score: number;
    trips: number;
  }>;
}> {
  const users = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  });

  const refDate = options.referenceDate || new Date();
  const weekKey = getIsoWeekKey(refDate);
  const results = [];
  let notifiedCount = 0;

  for (const u of users) {
    try {
      const res = await sendWeeklySummaryToUser(u.id, options);
      if (res.pushedCount > 0) notifiedCount++;

      results.push({
        userId: u.id,
        userName: u.name,
        success: res.success,
        pushedCount: res.pushedCount,
        distanceKm: res.summary?.totalDistanceKm || 0,
        score: res.summary?.averageScore || 100,
        trips: res.summary?.totalTrips || 0,
      });
    } catch (err: any) {
      console.error(`[WeeklySummary] Erro ao enviar para ${u.name} (${u.id}):`, err);
      results.push({
        userId: u.id,
        userName: u.name,
        success: false,
        pushedCount: 0,
        distanceKm: 0,
        score: 100,
        trips: 0,
      });
    }
  }

  const state: WeeklySummaryState = {
    lastSentWeek: weekKey,
    lastRunAt: new Date().toISOString(),
    lastRunType: options.runType || 'manual',
    lastResults: results,
  };
  saveWeeklySummaryState(state);

  console.log(
    `🚗 [WeeklySummary] Disparo da semana ${weekKey} concluído: ${notifiedCount}/${users.length} membros notificados.`
  );

  return {
    week: weekKey,
    totalUsers: users.length,
    notifiedCount,
    results,
  };
}

/**
 * Retorna o status atual do agendador e o histórico do último disparo.
 */
export function getWeeklySummaryStatus() {
  const state = loadWeeklySummaryState();
  const currentWeek = getIsoWeekKey();
  const now = new Date();

  // Próxima segunda-feira às 08:00
  const nextMonday = new Date(now);
  const day = nextMonday.getDay();
  const daysUntilMonday = ((1 - day + 7) % 7) || (nextMonday.getHours() >= 9 ? 7 : 0);
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(8, 0, 0, 0);

  return {
    schedulerActive: schedulerTimer !== null,
    currentWeek,
    lastSentWeek: state.lastSentWeek,
    lastRunAt: state.lastRunAt,
    lastRunType: state.lastRunType,
    lastResults: state.lastResults || [],
    nextScheduledRun: nextMonday.toISOString(),
    isAlreadySentThisWeek: state.lastSentWeek === currentWeek,
  };
}

/**
 * Inicia o agendador automático de Resumo Semanal.
 * Roda uma verificação periódica a cada 15 minutos:
 * - Se for Segunda-feira entre 08:00 e 08:59 (horário de Brasília) e a semana atual
 *   ainda não tiver sido enviada, dispara automaticamente para todos os membros.
 */
export function startWeeklySummaryScheduler(): void {
  if (process.env.WEEKLY_SUMMARY_ENABLED === 'false') {
    console.log('⏸️ Resumo Semanal automático desativado por WEEKLY_SUMMARY_ENABLED=false');
    return;
  }

  const checkAndRun = async () => {
    try {
      const now = new Date();
      // getDay: 0 = Dom, 1 = Seg, 2 = Ter...
      const isMonday = now.getDay() === 1;
      const isMorning = now.getHours() === 8;

      if (!isMonday || !isMorning) {
        return;
      }

      const state = loadWeeklySummaryState();
      const currentWeek = getIsoWeekKey(now);

      if (state.lastSentWeek === currentWeek) {
        // Já enviado nesta semana
        return;
      }

      console.log(`⏰ [WeeklySummary] Segunda-feira 08:00 detectada! Disparando semana ${currentWeek}...`);
      await sendWeeklySummaryToAllMembers({
        force: false,
        skipIfNoTrips: false,
        runType: 'auto',
      });
    } catch (err) {
      console.error('[WeeklySummary] Erro no agendador semanal:', err);
    }
  };

  // Primeira checagem após 45 segundos da subida do servidor
  setTimeout(checkAndRun, 45 * 1000);

  if (schedulerTimer) clearInterval(schedulerTimer);
  // Checagem a cada 15 minutos
  schedulerTimer = setInterval(checkAndRun, 15 * 60 * 1000);

  console.log('🚗 Agendador de Resumo Semanal ativado: Toda segunda-feira às 08:00 (Web Push + Expo Push)');
}

export function stopWeeklySummaryScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
