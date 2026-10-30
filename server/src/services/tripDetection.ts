import { calculateDistanceMeters } from './geofence.js';
import { prisma } from '../db.js';
import { roundCoord, reverseGeocode } from './geocoding.js';
import {
  PhoneUsageWindow,
  sumPhoneUsageSeconds,
  secondsToMinutes,
  phoneUsagePenalty,
  fetchPhoneUsageWindows,
} from './phoneUsage.js';

export interface TripPoint {
  latitude: number;
  longitude: number;
  speed: number | null;
  recordedAt: Date | string;
}

export interface DrivingEvent {
  id: string;
  type: 'hard_brake' | 'rapid_accel' | 'speeding';
  latitude: number;
  longitude: number;
  timestamp: string;
  speedKmH: number;
  deltaKmH?: number;
  deltaSec?: number;
  rateKmHPerSec?: number;
  description: string;
}

export interface Trip {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalDurationSeconds?: number;
  movingSeconds?: number;
  distanceKm: number;
  maxSpeedKmH: number;
  avgSpeedKmH: number;
  speedEvents: number;
  hardBrakingEvents: number;
  rapidAccelEvents: number;
  phoneUsageMinutes: number;
  phoneUsageEpisodes: number;
  events: DrivingEvent[];
  startLocation: {
    latitude: number;
    longitude: number;
    label: string;
    placeName?: string;
  };
  endLocation: {
    latitude: number;
    longitude: number;
    label: string;
    placeName?: string;
  };
  pointsCount: number;
  points: TripPoint[];
}

export interface TripSummary {
  totalTrips: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  maxSpeedKmH: number;
  totalSpeedEvents: number;
  totalHardBrakingEvents: number;
  totalRapidAccelEvents: number;
  totalPhoneUsageMinutes: number;
  totalPhoneUsageEpisodes: number;
  score: 'Excelente' | 'Bom' | 'Atenção';
  scoreValue?: number; // 0 a 100
}

export interface DrivingDaySummary {
  date: string; // "YYYY-MM-DD"
  dayName: string; // "Seg", "Ter", etc.
  formattedDate: string; // "24/10"
  totalDistanceKm: number;
  totalDurationMinutes: number;
  tripsCount: number;
  maxSpeedKmH: number;
  avgSpeedKmH: number;
  speedEvents: number;
  hardBrakingEvents: number;
  rapidAccelEvents: number;
  phoneUsageMinutes: number;
  scoreValue: number | null; // 0-100 (null se sem viagens)
  scoreGrade: 'Excelente' | 'Bom' | 'Atenção' | null;
  hasTrips: boolean;
}

export interface HistoricalDrivingSummary {
  period: 'week' | 'month';
  startDate: string;
  endDate: string;
  totalDays: number;
  activeDays: number;
  totalTrips: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  overallMaxSpeedKmH: number;
  totalSpeedEvents: number;
  totalHardBrakingEvents: number;
  totalRapidAccelEvents: number;
  totalPhoneUsageMinutes: number;
  averageScore: number;
  overallGrade: 'Excelente' | 'Bom' | 'Atenção';
  trend: 'improving' | 'stable' | 'declining';
}

export type TimelineItemType = 'trip' | 'stay';

export interface TimelineStayItem {
  id: string;
  type: 'stay';
  startTime: string; // ISO
  endTime: string;   // ISO
  durationMinutes: number;
  isCurrent?: boolean; // Se o membro permanece neste local no momento
  latitude: number;
  longitude: number;
  placeId?: string;
  placeName: string; // Ex: "Casa", "Trabalho" ou nome da rua/bairro
  placeIcon: string; // Emoji correspondente: "🏡", "💼", "🎓", "📍"
  placeColor?: string; // Cor hex da cerca cadastrada
  address?: string; // Endereço legível completo
  suburb?: string;
  city?: string;
  pointsCount: number;
}

export interface TimelineTripItem extends Trip {
  type: 'trip';
}

export type TimelineItem = TimelineTripItem | TimelineStayItem;

export interface HistoricalDrivingReport {
  userId: string;
  period: 'week' | 'month';
  summary: HistoricalDrivingSummary;
  days: DrivingDaySummary[];
  recentTrips: Trip[];
  recentTimeline?: TimelineItem[];
}

/**
 * Normaliza a velocidade informada pelo GPS/aparelho em km/h.
 * Tanto o App Android quanto o PWA Web já enviam a velocidade convertida em km/h.
 */
export function extractSpeedKmH(speed: number | null | undefined, calculatedKmH?: number): number {
  // Se o sensor/aparelho já informou uma velocidade válida (inclusive 0 quando parado):
  if (typeof speed === 'number' && !isNaN(speed) && speed >= 0) {
    // Leituras realistas são aceitas diretamente em km/h
    if (speed < 180) {
      return Math.round(speed);
    }
    // Ruídos extremos (> 180 km/h) caem para a velocidade calculada se viável
    if (calculatedKmH !== undefined && calculatedKmH > 0 && calculatedKmH < 160) {
      return Math.round(calculatedKmH);
    }
    return 0;
  }

  // Se o GPS não enviou velocidade (null/undefined), usa a calculada entre coordenadas consecutivas
  if (calculatedKmH !== undefined && calculatedKmH > 0 && calculatedKmH < 160) {
    return Math.round(calculatedKmH);
  }

  return 0;
}

/**
 * Calcula nota de direção numérica (0-100) e classificação de segurança (Excelente/Bom/Atenção).
 * Pondera velocidade máxima, excessos de velocidade (>90 km/h), frenagens bruscas e arrancadas rápidas.
 */
export function calculateDrivingScore(
  maxSpeedKmH: number,
  speedEvents: number,
  hardBrakingEvents: number = 0,
  rapidAccelEvents: number = 0,
  phoneUsageMinutes: number = 0
): { scoreValue: number; scoreGrade: 'Excelente' | 'Bom' | 'Atenção' } {
  let val = 100;

  // Penalidade por eventos de excesso de velocidade (>90 km/h)
  val -= Math.min(30, speedEvents * 6);

  // Penalidade por frenagens bruscas (risco de colisão e direção distraída)
  val -= Math.min(25, hardBrakingEvents * 5);

  // Penalidade por arrancadas bruscas (direção agressiva e desgaste)
  val -= Math.min(15, rapidAccelEvents * 3);

  // Penalidade por uso de celular ao volante (distração — a mais grave das quatro)
  val -= phoneUsagePenalty(phoneUsageMinutes);

  // Penalidade pela velocidade máxima atingida
  if (maxSpeedKmH > 130) {
    val -= 30;
  } else if (maxSpeedKmH > 110) {
    val -= 20;
  } else if (maxSpeedKmH > 90) {
    val -= 12;
  } else if (maxSpeedKmH > 80) {
    val -= 5;
  }

  val = Math.max(0, Math.min(100, Math.round(val)));

  let scoreGrade: 'Excelente' | 'Bom' | 'Atenção' = 'Excelente';
  const totalRiskyEvents = speedEvents + hardBrakingEvents;
  // Qualquer minuto de celular ao volante já impede a classificação "Excelente"
  if (val < 75 || maxSpeedKmH > 105 || totalRiskyEvents > 2 || phoneUsageMinutes >= 3) {
    scoreGrade = 'Atenção';
  } else if (val < 90 || maxSpeedKmH > 85 || (totalRiskyEvents + rapidAccelEvents) > 0 || phoneUsageMinutes > 0) {
    scoreGrade = 'Bom';
  }

  return { scoreValue: val, scoreGrade };
}

/**
 * Detecta eventos de condução (frenagem brusca, arrancada rápida e excesso de velocidade)
 * ao longo de uma sequência cronológica de pontos de GPS (Etapa 10.2).
 *
 * Critérios físicos de telemática veicular (padrão Life360 / Zendrive):
 * - Frenagem brusca: desaceleração <= -11 km/h/s, queda total >= 12 km/h, vel. anterior >= 20 km/h.
 * - Arrancada rápida: aceleração >= +10 km/h/s, ganho total >= 12 km/h, vel. atingida >= 20 km/h.
 * - Excesso de velocidade: leitura > 90 km/h (com debounce para registrar episódios distintos).
 * - Debounce anti-duplicação: 8 s para manobras contínuas, 25 s para excessos na mesma rodovia.
 */
export function detectDrivingEvents(points: TripPoint[]): {
  speedEvents: number;
  hardBrakingEvents: number;
  rapidAccelEvents: number;
  events: DrivingEvent[];
  maxSpeed: number;
} {
  if (!points || points.length < 2) {
    return {
      speedEvents: 0,
      hardBrakingEvents: 0,
      rapidAccelEvents: 0,
      events: [],
      maxSpeed: 0,
    };
  }

  const events: DrivingEvent[] = [];
  let maxSpeed = 0;
  let speedEvents = 0;
  let hardBrakingEvents = 0;
  let rapidAccelEvents = 0;

  let lastBrakeTime = 0;
  let lastAccelTime = 0;
  let lastSpeedingTime = 0;

  const speeds: number[] = [];
  const times: number[] = [];

  // Passo 1: normaliza e calcula a velocidade em cada ponto
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const ptTime = new Date(pt.recordedAt).getTime();
    times.push(ptTime);

    let calcSpd = 0;
    if (i > 0) {
      const prev = points[i - 1];
      const prevTime = times[i - 1];
      const dSec = (ptTime - prevTime) / 1000;
      if (dSec > 0 && dSec < 3600) {
        calcSpd = (calculateDistanceMeters(prev.latitude, prev.longitude, pt.latitude, pt.longitude) / dSec) * 3.6;
      }
    }

    const spd = extractSpeedKmH(pt.speed, calcSpd);
    speeds.push(spd);
    if (spd > maxSpeed && spd < 220) {
      maxSpeed = spd;
    }
  }

  // Passo 2: analisa derivadas de velocidade (aceleração/desaceleração) e velocidade absoluta
  let eventIdx = 1;
  for (let i = 0; i < points.length; i++) {
    const spd = speeds[i];
    const ptTime = times[i];
    const pt = points[i];

    // Excesso de velocidade (> 90 km/h) com debounce de 25 segundos
    if (spd > 90) {
      if (ptTime - lastSpeedingTime >= 25000) {
        speedEvents++;
        lastSpeedingTime = ptTime;
        events.push({
          id: `evt-spd-${eventIdx++}`,
          type: 'speeding',
          latitude: pt.latitude,
          longitude: pt.longitude,
          timestamp: new Date(pt.recordedAt).toISOString(),
          speedKmH: spd,
          description: `Excesso de velocidade: ${spd} km/h`,
        });
      }
    }

    if (i > 0) {
      const prevSpd = speeds[i - 1];
      const prevTime = times[i - 1];
      const deltaSec = (ptTime - prevTime) / 1000;

      // Janela temporal viável para análise de derivada por GPS (0.8s a 12s)
      if (deltaSec >= 0.8 && deltaSec <= 12.0) {
        const deltaV = spd - prevSpd;
        const rate = deltaV / deltaSec;

        // FRENAGEM BRUSCA
        if (rate <= -11.0 && deltaV <= -12 && prevSpd >= 20) {
          if (ptTime - lastBrakeTime >= 8000) {
            hardBrakingEvents++;
            lastBrakeTime = ptTime;
            events.push({
              id: `evt-brk-${eventIdx++}`,
              type: 'hard_brake',
              latitude: pt.latitude,
              longitude: pt.longitude,
              timestamp: new Date(pt.recordedAt).toISOString(),
              speedKmH: spd,
              deltaKmH: Math.round(deltaV),
              deltaSec: Math.round(deltaSec * 10) / 10,
              rateKmHPerSec: Math.round(rate * 10) / 10,
              description: `Frenagem brusca: ${prevSpd} → ${spd} km/h em ${deltaSec.toFixed(1)}s (${rate.toFixed(1)} km/h/s)`,
            });
          }
        }

        // ARRANCADA RÁPIDA / ACELERAÇÃO BRUSCA
        if (rate >= 10.0 && deltaV >= 12 && spd >= 20) {
          if (ptTime - lastAccelTime >= 8000) {
            rapidAccelEvents++;
            lastAccelTime = ptTime;
            events.push({
              id: `evt-acc-${eventIdx++}`,
              type: 'rapid_accel',
              latitude: pt.latitude,
              longitude: pt.longitude,
              timestamp: new Date(pt.recordedAt).toISOString(),
              speedKmH: spd,
              deltaKmH: Math.round(deltaV),
              deltaSec: Math.round(deltaSec * 10) / 10,
              rateKmHPerSec: Math.round(rate * 10) / 10,
              description: `Arrancada rápida: ${prevSpd} → ${spd} km/h em ${deltaSec.toFixed(1)}s (+${rate.toFixed(1)} km/h/s)`,
            });
          }
        }
      }
    }
  }

  return {
    speedEvents,
    hardBrakingEvents,
    rapidAccelEvents,
    events,
    maxSpeed: Math.round(maxSpeed),
  };
}

export function segmentPointsIntoTrips(
  points: TripPoint[],
  places: Array<{ id: string; name: string; latitude: number; longitude: number; radiusMeters: number; icon: string }>,
  phoneUsageWindows: PhoneUsageWindow[] = []
): { trips: Trip[]; summary: TripSummary } {
  if (!points || points.length < 2) {
    return {
      trips: [],
      summary: {
        totalTrips: 0,
        totalDistanceKm: 0,
        totalDurationMinutes: 0,
        maxSpeedKmH: 0,
        totalSpeedEvents: 0,
        totalHardBrakingEvents: 0,
        totalRapidAccelEvents: 0,
        totalPhoneUsageMinutes: 0,
        totalPhoneUsageEpisodes: 0,
        score: 'Excelente',
        scoreValue: 100,
      },
    };
  }

  // Filtra pontos com timestamp válido (posterior a 2000, eliminando epoch 1970 ou nulos)
  const validPoints = points.filter((p) => {
    const t = new Date(p.recordedAt).getTime();
    return !isNaN(t) && t > 946684800000;
  });

  if (validPoints.length < 2) {
    return {
      trips: [],
      summary: {
        totalTrips: 0,
        totalDistanceKm: 0,
        totalDurationMinutes: 0,
        maxSpeedKmH: 0,
        totalSpeedEvents: 0,
        totalHardBrakingEvents: 0,
        totalRapidAccelEvents: 0,
        totalPhoneUsageMinutes: 0,
        totalPhoneUsageEpisodes: 0,
        score: 'Excelente',
        scoreValue: 100,
      },
    };
  }

  // Ordena cronologicamente (mais antigo -> mais recente)
  const sorted = [...validPoints].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  const rawTrips: TripPoint[][] = [];
  let currentTrip: TripPoint[] = [];
  let lastMovingTime = 0;

  for (let i = 0; i < sorted.length; i++) {
    const pt = sorted[i];
    const ptTime = new Date(pt.recordedAt).getTime();
    let calculatedSpeedKmH = 0;
    if (i > 0) {
      const prev = sorted[i - 1];
      const prevTime = new Date(prev.recordedAt).getTime();
      const deltaSec = (ptTime - prevTime) / 1000;

      if (deltaSec > 0) {
        // Se sem dados ou desconectado por mais de 2 minutos (120s) e já havia uma viagem, encerra a viagem anterior
        if (deltaSec > 120 && currentTrip.length > 0) {
          rawTrips.push(currentTrip);
          currentTrip = [];
        }

        if (deltaSec < 3600) {
          const distM = calculateDistanceMeters(prev.latitude, prev.longitude, pt.latitude, pt.longitude);
          calculatedSpeedKmH = (distM / deltaSec) * 3.6;
        }
      }
    }

    const rawSpeedKmH = extractSpeedKmH(pt.speed, calculatedSpeedKmH);
    const isMoving = rawSpeedKmH > 4.5;

    if (isMoving) {
      // Se está iniciando uma nova viagem, inclui o ponto de partida anterior APENAS se for recente (<= 60s)
      if (currentTrip.length === 0 && i > 0) {
        const prevPt = sorted[i - 1];
        const prevPtTime = new Date(prevPt.recordedAt).getTime();
        if ((ptTime - prevPtTime) <= 60000) {
          currentTrip.push(prevPt);
        }
      }
      currentTrip.push(pt);
      lastMovingTime = ptTime;
    } else {
      // Se parou agora, mas estava em viagem há menos de 1 minuto (60s), inclui o ponto de parada final
      // Se parou por mais de 1 minuto (60s), encerra a viagem anterior
      if (currentTrip.length > 0 && (ptTime - lastMovingTime) <= 60000) {
        currentTrip.push(pt);
      } else if (currentTrip.length > 0) {
        rawTrips.push(currentTrip);
        currentTrip = [];
      }
    }
  }

  if (currentTrip.length > 0) {
    rawTrips.push(currentTrip);
  }

  // Filtra viagens válidas (mínimo de 150m e pelo menos 2 pontos)
  const validTrips: Trip[] = [];
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;
  let overallMaxSpeed = 0;
  let totalSpeedEvents = 0;
  let totalHardBrakingEvents = 0;
  let totalRapidAccelEvents = 0;
  let totalPhoneUsageMinutes = 0;
  let totalPhoneUsageEpisodes = 0;

  let tripIdx = 1;
  for (const tPoints of rawTrips) {
    if (tPoints.length < 2) continue;

    const startPt = tPoints[0];
    const endPt = tPoints[tPoints.length - 1];
    const startTime = new Date(startPt.recordedAt);
    const endTime = new Date(endPt.recordedAt);
    const totalDurationSec = Math.max(1, (endTime.getTime() - startTime.getTime()) / 1000);

    let distKm = 0;
    let movingSeconds = 0;
    for (let j = 1; j < tPoints.length; j++) {
      const prev = tPoints[j - 1];
      const p = tPoints[j];
      const dMeters = calculateDistanceMeters(prev.latitude, prev.longitude, p.latitude, p.longitude);
      distKm += dMeters / 1000;

      const dt = (new Date(p.recordedAt).getTime() - new Date(prev.recordedAt).getTime()) / 1000;
      if (dt > 0 && dt <= 180) {
        const segSpeed = (dMeters / dt) * 3.6;
        const ptSpeed = extractSpeedKmH(p.speed, segSpeed);
        if (ptSpeed > 4.5 || (dMeters > 5 && segSpeed > 4.5)) {
          movingSeconds += dt;
        }
      }
    }

    // Critério: pelo menos 150 metros
    if (distKm < 0.15) continue;

    // Detecta velocidade máxima e eventos de condução (frenagens, acelerações e excessos)
    const detection = detectDrivingEvents(tPoints);
    const maxSpeed = detection.maxSpeed;
    const speedEvents = detection.speedEvents;
    const hardBrakingEvents = detection.hardBrakingEvents;
    const rapidAccelEvents = detection.rapidAccelEvents;
    const events = detection.events;

    // Tempo efetivo em movimento (se movingSeconds for 0, usa totalDurationSec como fallback)
    const effectiveSec = movingSeconds > 0 ? movingSeconds : totalDurationSec;
    // Duração líquida em minutos com precisão decimal (ex: 0.2 min para 12s, sem piso artificial de 1 min)
    const durationMin = Math.max(0.1, Math.round((effectiveSec / 60) * 10) / 10);

    // Velocidade média calculada com o tempo real em segundos (não o minuto arredondado)
    const effectiveHours = (effectiveSec > 0 ? effectiveSec : totalDurationSec) / 3600;
    let avgSpeed = effectiveHours > 0 ? distKm / effectiveHours : 0;
    // Salvaguarda física: velocidade média nunca pode superar a velocidade máxima
    if (maxSpeed > 0 && avgSpeed > maxSpeed) {
      avgSpeed = maxSpeed;
    }

    // Tempo de celular ao volante dentro da janela desta viagem (Etapa 10.3)
    const phoneSeconds = sumPhoneUsageSeconds(phoneUsageWindows, startTime, endTime);
    const phoneUsageMinutes = secondsToMinutes(phoneSeconds);
    const phoneUsageEpisodes = phoneSeconds > 0
      ? phoneUsageWindows.filter((w) => {
          const wStart = new Date(w.startedAt).getTime();
          const wEnd = new Date(w.endedAt).getTime();
          return wEnd > startTime.getTime() && wStart < endTime.getTime();
        }).length
      : 0;

    // Identifica lugares de início e fim
    const startPlace = findMatchingPlace(startPt.latitude, startPt.longitude, places);
    const endPlace = findMatchingPlace(endPt.latitude, endPt.longitude, places);

    validTrips.push({
      id: `trip-${tripIdx++}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMinutes: durationMin,
      totalDurationSeconds: Math.round(totalDurationSec),
      movingSeconds: Math.round(effectiveSec),
      distanceKm: Math.round(distKm * 10) / 10,
      maxSpeedKmH: Math.round(maxSpeed),
      avgSpeedKmH: Math.round(avgSpeed),
      speedEvents,
      hardBrakingEvents,
      rapidAccelEvents,
      phoneUsageMinutes,
      phoneUsageEpisodes,
      events,
      startLocation: {
        latitude: startPt.latitude,
        longitude: startPt.longitude,
        label: startPlace ? startPlace.name : `Lat ${startPt.latitude.toFixed(4)}, Lon ${startPt.longitude.toFixed(4)}`,
        placeName: startPlace?.name,
      },
      endLocation: {
        latitude: endPt.latitude,
        longitude: endPt.longitude,
        label: endPlace ? endPlace.name : `Lat ${endPt.latitude.toFixed(4)}, Lon ${endPt.longitude.toFixed(4)}`,
        placeName: endPlace?.name,
      },
      pointsCount: tPoints.length,
      points: tPoints,
    });

    totalDistanceKm += distKm;
    totalDurationMinutes += durationMin;
    if (maxSpeed > overallMaxSpeed) overallMaxSpeed = maxSpeed;
    totalSpeedEvents += speedEvents;
    totalHardBrakingEvents += hardBrakingEvents;
    totalRapidAccelEvents += rapidAccelEvents;
    totalPhoneUsageMinutes += phoneUsageMinutes;
    totalPhoneUsageEpisodes += phoneUsageEpisodes;
  }

  // Se não detectou viagens separadas mas o membro percorreu distância relevante (> 300m), cria viagem única
  if (validTrips.length === 0 && sorted.length >= 2) {
    let distTotal = 0;
    let movingSecTotal = 0;
    for (let k = 1; k < sorted.length; k++) {
      const prev = sorted[k - 1];
      const curr = sorted[k];
      if (!prev || !curr) continue;
      const dM = calculateDistanceMeters(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
      distTotal += dM / 1000;
      const dt = (new Date(curr.recordedAt).getTime() - new Date(prev.recordedAt).getTime()) / 1000;
      if (dt > 0 && dt <= 180) {
        const segSpd = (dM / dt) * 3.6;
        const ptSpd = extractSpeedKmH(curr.speed, segSpd);
        if (ptSpd > 4.5 || (dM > 5 && segSpd > 4.5)) {
          movingSecTotal += dt;
        }
      }
    }

    if (distTotal >= 0.3) {
      const startPt = sorted[0];
      const endPt = sorted[sorted.length - 1];
      const startTime = new Date(startPt.recordedAt);
      const endTime = new Date(endPt.recordedAt);
      const totalSec = Math.max(1, (endTime.getTime() - startTime.getTime()) / 1000);
      const effSec = movingSecTotal > 0 ? movingSecTotal : totalSec;
      const durMin = Math.max(0.1, Math.round((effSec / 60) * 10) / 10);
      const startPlace = findMatchingPlace(startPt.latitude, startPt.longitude, places);
      const endPlace = findMatchingPlace(endPt.latitude, endPt.longitude, places);
      const detection = detectDrivingEvents(sorted);

      const hours = (effSec > 0 ? effSec : totalSec) / 3600;
      let avgSpeed = hours > 0 ? distTotal / hours : 0;
      if (detection.maxSpeed > 0 && avgSpeed > detection.maxSpeed) {
        avgSpeed = detection.maxSpeed;
      }

      const phoneSeconds = sumPhoneUsageSeconds(phoneUsageWindows, startTime, endTime);
      const phoneUsageMinutes = secondsToMinutes(phoneSeconds);
      const phoneUsageEpisodes = phoneSeconds > 0
        ? phoneUsageWindows.filter((w) => {
            const wStart = new Date(w.startedAt).getTime();
            const wEnd = new Date(w.endedAt).getTime();
            return wEnd > startTime.getTime() && wStart < endTime.getTime();
          }).length
        : 0;

      validTrips.push({
        id: 'trip-1',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes: durMin,
        totalDurationSeconds: Math.round(totalSec),
        movingSeconds: Math.round(effSec),
        distanceKm: Math.round(distTotal * 10) / 10,
        maxSpeedKmH: detection.maxSpeed,
        avgSpeedKmH: Math.round(avgSpeed),
        speedEvents: detection.speedEvents,
        hardBrakingEvents: detection.hardBrakingEvents,
        rapidAccelEvents: detection.rapidAccelEvents,
        phoneUsageMinutes,
        phoneUsageEpisodes,
        events: detection.events,
        startLocation: {
          latitude: startPt.latitude,
          longitude: startPt.longitude,
          label: startPlace ? startPlace.name : `Lat ${startPt.latitude.toFixed(4)}, Lon ${startPt.longitude.toFixed(4)}`,
          placeName: startPlace?.name,
        },
        endLocation: {
          latitude: endPt.latitude,
          longitude: endPt.longitude,
          label: endPlace ? endPlace.name : `Lat ${endPt.latitude.toFixed(4)}, Lon ${endPt.longitude.toFixed(4)}`,
          placeName: endPlace?.name,
        },
        pointsCount: sorted.length,
        points: sorted,
      });

      totalDistanceKm = distTotal;
      totalDurationMinutes = durMin;
      overallMaxSpeed = detection.maxSpeed;
      totalSpeedEvents = detection.speedEvents;
      totalHardBrakingEvents = detection.hardBrakingEvents;
      totalRapidAccelEvents = detection.rapidAccelEvents;
      totalPhoneUsageMinutes = phoneUsageMinutes;
      totalPhoneUsageEpisodes = phoneUsageEpisodes;
    }
  }

  // Calcula nota de direção numérica e classificação
  const scoreResult = calculateDrivingScore(
    overallMaxSpeed,
    totalSpeedEvents,
    totalHardBrakingEvents,
    totalRapidAccelEvents,
    totalPhoneUsageMinutes
  );

  return {
    trips: validTrips,
    summary: {
      totalTrips: validTrips.length,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalDurationMinutes: Math.round(totalDurationMinutes * 10) / 10,
      maxSpeedKmH: Math.round(overallMaxSpeed),
      totalSpeedEvents,
      totalHardBrakingEvents,
      totalRapidAccelEvents,
      totalPhoneUsageMinutes,
      totalPhoneUsageEpisodes,
      score: scoreResult.scoreGrade,
      scoreValue: scoreResult.scoreValue,
    },
  };
}

function findMatchingPlace(lat: number, lon: number, places: Array<{ id: string; name: string; latitude: number; longitude: number; radiusMeters: number; icon: string }>) {
  for (const p of places) {
    const dist = calculateDistanceMeters(lat, lon, p.latitude, p.longitude);
    if (dist <= p.radiusMeters) {
      return p;
    }
  }
  return null;
}

export function mapPlaceIconToEmoji(icon?: string): string {
  if (!icon) return '📍';
  const lower = icon.toLowerCase();
  if (lower.includes('home') || lower.includes('casa')) return '🏡';
  if (lower.includes('work') || lower.includes('trabalho') || lower.includes('office') || lower.includes('briefcase')) return '💼';
  if (lower.includes('school') || lower.includes('escola') || lower.includes('faculdade') || lower.includes('college')) return '🎓';
  if (lower.includes('gym') || lower.includes('academia') || lower.includes('fitness')) return '🏋️';
  if (lower.includes('hospital') || lower.includes('saude') || lower.includes('health') || lower.includes('doctor')) return '🏥';
  if (lower.includes('market') || lower.includes('mercado') || lower.includes('cart') || lower.includes('shop')) return '🛒';
  if (lower.includes('food') || lower.includes('restaurante') || lower.includes('cafe')) return '🍽️';
  if (lower.includes('star') || lower.includes('fav')) return '⭐';
  if (lower.includes('heart') || lower.includes('love')) return '❤️';
  return '📍';
}

async function resolveLocationInfo(
  lat: number,
  lon: number,
  places: Array<{ id: string; name: string; latitude: number; longitude: number; radiusMeters: number; icon: string; color?: string }>
): Promise<{ name: string; icon: string; color?: string; address: string; suburb?: string; city?: string; placeId?: string }> {
  const matchedPlace = findMatchingPlace(lat, lon, places as any);
  if (matchedPlace) {
    return {
      placeId: matchedPlace.id,
      name: matchedPlace.name,
      icon: mapPlaceIconToEmoji(matchedPlace.icon),
      color: (matchedPlace as any).color || '#10B981',
      address: matchedPlace.name,
    };
  }

  try {
    const geo = await reverseGeocode(lat, lon);
    const friendlyName = geo.road || geo.suburb || geo.city || `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`;
    return {
      name: friendlyName,
      icon: '📍',
      color: '#64748B',
      address: geo.address,
      suburb: geo.suburb,
      city: geo.city,
    };
  } catch {
    return {
      name: `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`,
      icon: '📍',
      color: '#64748B',
      address: `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`,
    };
  }
}

/**
 * Constrói a Linha do Tempo Contínua (Recurso Life360 Platinum - Etapa 10.6),
 * intercalando as viagens realizadas com os períodos em que o usuário permaneceu parado em cada local.
 */
export async function buildTimeline(
  trips: Trip[],
  points: TripPoint[],
  places: Array<{ id: string; name: string; latitude: number; longitude: number; radiusMeters: number; icon: string; color?: string }>,
  referenceDate: Date = new Date()
): Promise<TimelineItem[]> {
  const sortedTrips: TimelineTripItem[] = [...trips]
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .map((t) => ({ ...t, type: 'trip' as const }));

  // Melhora legibilidade de labels de início/fim das viagens caso sejam coordenadas cruas
  for (const t of sortedTrips) {
    if (!t.startLocation.placeName && t.startLocation.label.startsWith('Lat ')) {
      try {
        const geo = await reverseGeocode(t.startLocation.latitude, t.startLocation.longitude);
        if (geo.road || geo.suburb) {
          t.startLocation.label = geo.road
            ? (geo.suburb ? `${geo.road} - ${geo.suburb}` : geo.road)
            : (geo.suburb || t.startLocation.label);
        }
      } catch {}
    }
    if (!t.endLocation.placeName && t.endLocation.label.startsWith('Lat ')) {
      try {
        const geo = await reverseGeocode(t.endLocation.latitude, t.endLocation.longitude);
        if (geo.road || geo.suburb) {
          t.endLocation.label = geo.road
            ? (geo.suburb ? `${geo.road} - ${geo.suburb}` : geo.road)
            : (geo.suburb || t.endLocation.label);
        }
      } catch {}
    }
  }

  // Filtra pontos com timestamp válido
  const validPoints = (points || []).filter((p) => {
    const t = new Date(p.recordedAt).getTime();
    return !isNaN(t) && t > 946684800000;
  });

  const sortedPoints = [...validPoints].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const stays: TimelineStayItem[] = [];
  let stayIdx = 1;

  // CASO 1: Nenhuma viagem no período (membro permaneceu em um local o dia todo)
  if (sortedTrips.length === 0) {
    if (sortedPoints.length >= 2) {
      const firstPt = sortedPoints[0];
      const lastPt = sortedPoints[sortedPoints.length - 1];
      const tFirst = new Date(firstPt.recordedAt).getTime();
      const tLast = new Date(lastPt.recordedAt).getTime();
      const durationSec = Math.max(0, (tLast - tFirst) / 1000);

      // Permanência relevante (pelo menos 3 minutos)
      if (durationSec >= 180) {
        const avgLat = sortedPoints.reduce((acc, p) => acc + p.latitude, 0) / sortedPoints.length;
        const avgLon = sortedPoints.reduce((acc, p) => acc + p.longitude, 0) / sortedPoints.length;
        const info = await resolveLocationInfo(avgLat, avgLon, places);
        const isCurrent = (referenceDate.getTime() - tLast) < 45 * 60 * 1000;

        stays.push({
          id: `stay-${stayIdx++}`,
          type: 'stay',
          startTime: new Date(tFirst).toISOString(),
          endTime: new Date(tLast).toISOString(),
          durationMinutes: Math.max(1, Math.round(durationSec / 60)),
          isCurrent,
          latitude: avgLat,
          longitude: avgLon,
          placeId: info.placeId,
          placeName: info.name,
          placeIcon: info.icon,
          placeColor: info.color,
          address: info.address,
          suburb: info.suburb,
          city: info.city,
          pointsCount: sortedPoints.length,
        });
      }
    }
    return stays;
  }

  // CASO 2: Há viagens detectadas -> intercala viagens com as permanências intermediárias

  // 1. Checa antes da primeira viagem
  const firstTrip = sortedTrips[0];
  const firstTripStartTime = new Date(firstTrip.startTime).getTime();
  const pointsBefore = sortedPoints.filter((p) => new Date(p.recordedAt).getTime() < firstTripStartTime);

  if (pointsBefore.length > 0) {
    const tFirst = new Date(pointsBefore[0].recordedAt).getTime();
    const gapSec = (firstTripStartTime - tFirst) / 1000;
    if (gapSec >= 180) {
      const lat = firstTrip.startLocation.latitude;
      const lon = firstTrip.startLocation.longitude;
      const info = await resolveLocationInfo(lat, lon, places);

      stays.push({
        id: `stay-${stayIdx++}`,
        type: 'stay',
        startTime: new Date(tFirst).toISOString(),
        endTime: firstTrip.startTime,
        durationMinutes: Math.max(1, Math.round(gapSec / 60)),
        isCurrent: false,
        latitude: lat,
        longitude: lon,
        placeId: info.placeId,
        placeName: info.name,
        placeIcon: info.icon,
        placeColor: info.color,
        address: info.address,
        suburb: info.suburb,
        city: info.city,
        pointsCount: pointsBefore.length,
      });
    }
  }

  // 2. Checa entre viagens consecutivas
  for (let i = 0; i < sortedTrips.length - 1; i++) {
    const currentTrip = sortedTrips[i];
    const nextTrip = sortedTrips[i + 1];
    const curEndTime = new Date(currentTrip.endTime).getTime();
    const nextStartTime = new Date(nextTrip.startTime).getTime();
    const gapSec = (nextStartTime - curEndTime) / 1000;

    if (gapSec >= 180) {
      const lat = currentTrip.endLocation.latitude;
      const lon = currentTrip.endLocation.longitude;
      const ptsBetween = sortedPoints.filter((p) => {
        const t = new Date(p.recordedAt).getTime();
        return t >= curEndTime && t <= nextStartTime;
      });

      const info = await resolveLocationInfo(lat, lon, places);

      stays.push({
        id: `stay-${stayIdx++}`,
        type: 'stay',
        startTime: currentTrip.endTime,
        endTime: nextTrip.startTime,
        durationMinutes: Math.max(1, Math.round(gapSec / 60)),
        isCurrent: false,
        latitude: lat,
        longitude: lon,
        placeId: info.placeId,
        placeName: info.name,
        placeIcon: info.icon,
        placeColor: info.color,
        address: info.address,
        suburb: info.suburb,
        city: info.city,
        pointsCount: ptsBetween.length,
      });
    }
  }

  // 3. Checa após a última viagem
  const lastTrip = sortedTrips[sortedTrips.length - 1];
  const lastTripEndTime = new Date(lastTrip.endTime).getTime();
  const pointsAfter = sortedPoints.filter((p) => new Date(p.recordedAt).getTime() > lastTripEndTime);

  if (pointsAfter.length > 0) {
    const tLast = new Date(pointsAfter[pointsAfter.length - 1].recordedAt).getTime();
    const gapSec = (tLast - lastTripEndTime) / 1000;
    if (gapSec >= 180) {
      const lat = lastTrip.endLocation.latitude;
      const lon = lastTrip.endLocation.longitude;
      const isCurrent = (referenceDate.getTime() - tLast) < 45 * 60 * 1000;
      const info = await resolveLocationInfo(lat, lon, places);

      stays.push({
        id: `stay-${stayIdx++}`,
        type: 'stay',
        startTime: lastTrip.endTime,
        endTime: new Date(tLast).toISOString(),
        durationMinutes: Math.max(1, Math.round(gapSec / 60)),
        isCurrent,
        latitude: lat,
        longitude: lon,
        placeId: info.placeId,
        placeName: info.name,
        placeIcon: info.icon,
        placeColor: info.color,
        address: info.address,
        suburb: info.suburb,
        city: info.city,
        pointsCount: pointsAfter.length,
      });
    }
  } else {
    // Viagem terminou há mais de 3 minutos hoje e o aparelho está em repouso
    const gapSec = (referenceDate.getTime() - lastTripEndTime) / 1000;
    if (gapSec >= 180 && gapSec < 24 * 3600) {
      const lat = lastTrip.endLocation.latitude;
      const lon = lastTrip.endLocation.longitude;
      const info = await resolveLocationInfo(lat, lon, places);

      stays.push({
        id: `stay-${stayIdx++}`,
        type: 'stay',
        startTime: lastTrip.endTime,
        endTime: referenceDate.toISOString(),
        durationMinutes: Math.max(1, Math.round(gapSec / 60)),
        isCurrent: true,
        latitude: lat,
        longitude: lon,
        placeId: info.placeId,
        placeName: info.name,
        placeIcon: info.icon,
        placeColor: info.color,
        address: info.address,
        suburb: info.suburb,
        city: info.city,
        pointsCount: 1,
      });
    }
  }

  // Combina viagens e permanências em uma linha do tempo única ordenada cronologicamente
  const combined: TimelineItem[] = [...sortedTrips, ...stays];
  combined.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  return combined;
}

/**
 * Agrega e calcula a nota de direção histórica de um membro (Semanal ou Mensal).
 * Etapa 9.6: Nota de direção histórica com agregação diária e evolução.
 */
export async function getHistoricalDrivingReport(
  userId: string,
  period: 'week' | 'month' = 'week',
  referenceDate: Date = new Date()
): Promise<HistoricalDrivingReport> {
  const numDays = period === 'month' ? 30 : 7;
  const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Gera dias em ordem cronológica (mais antigo -> mais recente)
  const daysMap = new Map<string, { date: Date; points: TripPoint[] }>();
  const dayKeys: string[] = [];

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    daysMap.set(key, { date: d, points: [] });
    dayKeys.push(key);
  }

  const [devices, places] = await Promise.all([
    prisma.device.findMany({
      where: { userId },
      select: { id: true },
    }),
    prisma.place.findMany(),
  ]);

  const deviceIds = devices.map((d) => d.id);

  const startDay = daysMap.get(dayKeys[0])!.date;
  const startDate = new Date(startDay);
  startDate.setHours(0, 0, 0, 0);

  const endDay = daysMap.get(dayKeys[dayKeys.length - 1])!.date;
  const endDate = new Date(endDay);
  endDate.setHours(23, 59, 59, 999);

  if (deviceIds.length === 0) {
    const emptyDays: DrivingDaySummary[] = dayKeys.map((key) => {
      const { date } = daysMap.get(key)!;
      return {
        date: key,
        dayName: DAY_NAMES[date.getDay()],
        formattedDate: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        totalDistanceKm: 0,
        totalDurationMinutes: 0,
        tripsCount: 0,
        maxSpeedKmH: 0,
        avgSpeedKmH: 0,
        speedEvents: 0,
        hardBrakingEvents: 0,
        rapidAccelEvents: 0,
        phoneUsageMinutes: 0,
        scoreValue: null,
        scoreGrade: null,
        hasTrips: false,
      };
    });

    return {
      userId,
      period,
      summary: {
        period,
        startDate: dayKeys[0],
        endDate: dayKeys[dayKeys.length - 1],
        totalDays: numDays,
        activeDays: 0,
        totalTrips: 0,
        totalDistanceKm: 0,
        totalDurationMinutes: 0,
        overallMaxSpeedKmH: 0,
        totalSpeedEvents: 0,
        totalHardBrakingEvents: 0,
        totalRapidAccelEvents: 0,
        totalPhoneUsageMinutes: 0,
        averageScore: 100,
        overallGrade: 'Excelente',
        trend: 'stable',
      },
      days: emptyDays,
      recentTrips: [],
      recentTimeline: [],
    };
  }

  const records = await prisma.locationRecord.findMany({
    where: {
      deviceId: { in: deviceIds },
      recordedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      latitude: true,
      longitude: true,
      speed: true,
      recordedAt: true,
    },
    orderBy: { recordedAt: 'asc' },
  });

  for (const rec of records) {
    const recDate = new Date(rec.recordedAt);
    const y = recDate.getFullYear();
    const m = String(recDate.getMonth() + 1).padStart(2, '0');
    const day = String(recDate.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    const dayEntry = daysMap.get(key);
    if (dayEntry) {
      dayEntry.points.push(rec);
    }
  }

  // Episódios de uso de celular ao volante no período (Etapa 10.3)
  const phoneUsageWindows = await fetchPhoneUsageWindows(deviceIds, startDate, endDate);

  const daySummaries: DrivingDaySummary[] = [];
  const allTrips: Trip[] = [];
  let totalPeriodDistance = 0;
  let totalPeriodDuration = 0;
  let totalPeriodTrips = 0;
  let overallMaxSpeed = 0;
  let totalSpeedEvents = 0;
  let totalHardBrakingEvents = 0;
  let totalRapidAccelEvents = 0;
  let totalPhoneUsageMinutes = 0;
  const activeScores: number[] = [];

  for (const key of dayKeys) {
    const { date, points } = daysMap.get(key)!;
    const dayName = DAY_NAMES[date.getDay()];
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (points.length < 2) {
      daySummaries.push({
        date: key,
        dayName,
        formattedDate,
        totalDistanceKm: 0,
        totalDurationMinutes: 0,
        tripsCount: 0,
        maxSpeedKmH: 0,
        avgSpeedKmH: 0,
        speedEvents: 0,
        hardBrakingEvents: 0,
        rapidAccelEvents: 0,
        phoneUsageMinutes: 0,
        scoreValue: null,
        scoreGrade: null,
        hasTrips: false,
      });
      continue;
    }

    const { trips, summary } = segmentPointsIntoTrips(points, places, phoneUsageWindows);
    const hasTrips = summary.totalTrips > 0 && summary.totalDistanceKm > 0;

    if (hasTrips) {
      totalPeriodDistance += summary.totalDistanceKm;
      totalPeriodDuration += summary.totalDurationMinutes;
      totalPeriodTrips += summary.totalTrips;
      if (summary.maxSpeedKmH > overallMaxSpeed) overallMaxSpeed = summary.maxSpeedKmH;

      const daySpeedEvents = trips.reduce((acc, t) => acc + (t.speedEvents || 0), 0);
      const dayHardBrakingEvents = trips.reduce((acc, t) => acc + (t.hardBrakingEvents || 0), 0);
      const dayRapidAccelEvents = trips.reduce((acc, t) => acc + (t.rapidAccelEvents || 0), 0);
      const dayPhoneUsageMinutes = trips.reduce((acc, t) => acc + (t.phoneUsageMinutes || 0), 0);

      totalSpeedEvents += daySpeedEvents;
      totalHardBrakingEvents += dayHardBrakingEvents;
      totalRapidAccelEvents += dayRapidAccelEvents;
      totalPhoneUsageMinutes += dayPhoneUsageMinutes;

      const dayScore = calculateDrivingScore(
        summary.maxSpeedKmH,
        daySpeedEvents,
        dayHardBrakingEvents,
        dayRapidAccelEvents,
        dayPhoneUsageMinutes
      );
      activeScores.push(dayScore.scoreValue);

      daySummaries.push({
        date: key,
        dayName,
        formattedDate,
        totalDistanceKm: summary.totalDistanceKm,
        totalDurationMinutes: summary.totalDurationMinutes,
        tripsCount: summary.totalTrips,
        maxSpeedKmH: summary.maxSpeedKmH,
        avgSpeedKmH: summary.totalDurationMinutes > 0
          ? Math.min(
              Math.round(summary.totalDistanceKm / (summary.totalDurationMinutes / 60)),
              summary.maxSpeedKmH
            )
          : 0,
        speedEvents: daySpeedEvents,
        hardBrakingEvents: dayHardBrakingEvents,
        rapidAccelEvents: dayRapidAccelEvents,
        phoneUsageMinutes: dayPhoneUsageMinutes,
        scoreValue: dayScore.scoreValue,
        scoreGrade: dayScore.scoreGrade,
        hasTrips: true,
      });

      allTrips.push(...trips);
    } else {
      daySummaries.push({
        date: key,
        dayName,
        formattedDate,
        totalDistanceKm: 0,
        totalDurationMinutes: 0,
        tripsCount: 0,
        maxSpeedKmH: 0,
        avgSpeedKmH: 0,
        speedEvents: 0,
        hardBrakingEvents: 0,
        rapidAccelEvents: 0,
        phoneUsageMinutes: 0,
        scoreValue: null,
        scoreGrade: null,
        hasTrips: false,
      });
    }
  }

  const activeDays = activeScores.length;
  let averageScore = 100;
  if (activeDays > 0) {
    averageScore = Math.round(activeScores.reduce((a, b) => a + b, 0) / activeDays);
  }

  const overallGrade = averageScore >= 90 ? 'Excelente' : averageScore >= 75 ? 'Bom' : 'Atenção';

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (activeDays >= 2) {
    const mid = Math.floor(activeScores.length / 2);
    const firstHalf = activeScores.slice(0, mid);
    const secondHalf = activeScores.slice(mid);
    const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (avg2 - avg1 >= 3) {
      trend = 'improving';
    } else if (avg1 - avg2 >= 3) {
      trend = 'declining';
    }
  }

  const recentTrips = allTrips
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 30);

  const recentTimeline = await buildTimeline(
    recentTrips,
    records.slice(-400),
    places,
    referenceDate
  );

  return {
    userId,
    period,
    summary: {
      period,
      startDate: dayKeys[0],
      endDate: dayKeys[dayKeys.length - 1],
      totalDays: numDays,
      activeDays,
      totalTrips: totalPeriodTrips,
      totalDistanceKm: Math.round(totalPeriodDistance * 10) / 10,
      totalDurationMinutes: totalPeriodDuration,
      overallMaxSpeedKmH: overallMaxSpeed,
      totalSpeedEvents,
      totalHardBrakingEvents,
      totalRapidAccelEvents,
      totalPhoneUsageMinutes,
      averageScore,
      overallGrade,
      trend,
    },
    days: daySummaries,
    recentTrips,
    recentTimeline,
  };
}
