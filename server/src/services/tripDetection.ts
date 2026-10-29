import { calculateDistanceMeters } from './geofence.js';
import { prisma } from '../db.js';
import { roundCoord } from './geocoding.js';

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
  distanceKm: number;
  maxSpeedKmH: number;
  avgSpeedKmH: number;
  speedEvents: number;
  hardBrakingEvents: number;
  rapidAccelEvents: number;
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
  averageScore: number;
  overallGrade: 'Excelente' | 'Bom' | 'Atenção';
  trend: 'improving' | 'stable' | 'declining';
}

export interface HistoricalDrivingReport {
  userId: string;
  period: 'week' | 'month';
  summary: HistoricalDrivingSummary;
  days: DrivingDaySummary[];
  recentTrips: Trip[];
}

/**
 * Normaliza a velocidade informada pelo GPS/aparelho em km/h.
 * Tanto o App Android quanto o PWA Web já enviam a velocidade convertida em km/h.
 */
export function extractSpeedKmH(speed: number | null | undefined, calculatedKmH?: number): number {
  // Se o sensor/aparelho já informou uma velocidade válida (> 0):
  if (typeof speed === 'number' && !isNaN(speed) && speed > 0) {
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

  // Se o GPS não enviou velocidade ou enviou 0, usa a calculada entre coordenadas consecutivas
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
  rapidAccelEvents: number = 0
): { scoreValue: number; scoreGrade: 'Excelente' | 'Bom' | 'Atenção' } {
  let val = 100;

  // Penalidade por eventos de excesso de velocidade (>90 km/h)
  val -= Math.min(30, speedEvents * 6);

  // Penalidade por frenagens bruscas (risco de colisão e direção distraída)
  val -= Math.min(25, hardBrakingEvents * 5);

  // Penalidade por arrancadas bruscas (direção agressiva e desgaste)
  val -= Math.min(15, rapidAccelEvents * 3);

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
  if (val < 75 || maxSpeedKmH > 105 || totalRiskyEvents > 2) {
    scoreGrade = 'Atenção';
  } else if (val < 90 || maxSpeedKmH > 85 || (totalRiskyEvents + rapidAccelEvents) > 0) {
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

export function segmentPointsIntoTrips(points: TripPoint[], places: Array<{ id: string; name: string; latitude: number; longitude: number; radiusMeters: number; icon: string }>): { trips: Trip[]; summary: TripSummary } {
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
        score: 'Excelente',
        scoreValue: 100,
      },
    };
  }

  // Ordena cronologicamente (mais antigo -> mais recente)
  const sorted = [...points].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

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
        // Se parado ou sem dados por mais de 5 minutos (300s) e já havia uma viagem em andamento, encerra a viagem anterior
        if (deltaSec > 300 && currentTrip.length > 0) {
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
    let isMoving = rawSpeedKmH > 4.5;

    if (isMoving) {
      // Se está iniciando uma nova viagem, inclui o ponto de partida anterior (onde estava parado)
      if (currentTrip.length === 0 && i > 0) {
        currentTrip.push(sorted[i - 1]);
      }
      currentTrip.push(pt);
      lastMovingTime = ptTime;
    } else {
      // Se parou agora, mas estava em viagem há menos de 3 minutos, inclui o ponto de parada final
      if (currentTrip.length > 0 && (ptTime - lastMovingTime) <= 180000) {
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

  // Filtra viagens válidas (mínimo de 150m e pelo menos 3 pontos ou >1.5 minutos)
  const validTrips: Trip[] = [];
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;
  let overallMaxSpeed = 0;
  let totalSpeedEvents = 0;
  let totalHardBrakingEvents = 0;
  let totalRapidAccelEvents = 0;

  let tripIdx = 1;
  for (const tPoints of rawTrips) {
    if (tPoints.length < 2) continue;

    const startPt = tPoints[0];
    const endPt = tPoints[tPoints.length - 1];
    const startTime = new Date(startPt.recordedAt);
    const endTime = new Date(endPt.recordedAt);
    const durationMin = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));

    let distKm = 0;
    for (let j = 1; j < tPoints.length; j++) {
      const prev = tPoints[j - 1];
      const p = tPoints[j];
      distKm += calculateDistanceMeters(prev.latitude, prev.longitude, p.latitude, p.longitude) / 1000;
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

    const avgSpeed = distKm / (durationMin / 60);

    // Identifica lugares de início e fim
    const startPlace = findMatchingPlace(startPt.latitude, startPt.longitude, places);
    const endPlace = findMatchingPlace(endPt.latitude, endPt.longitude, places);

    validTrips.push({
      id: `trip-${tripIdx++}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMinutes: durationMin,
      distanceKm: Math.round(distKm * 10) / 10,
      maxSpeedKmH: Math.round(maxSpeed),
      avgSpeedKmH: Math.round(avgSpeed),
      speedEvents,
      hardBrakingEvents,
      rapidAccelEvents,
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
  }

  // Se não detectou viagens separadas mas o membro percorreu distância relevante (> 300m), cria viagem única
  if (validTrips.length === 0 && sorted.length >= 2) {
    let distTotal = 0;
    for (let k = 1; k < sorted.length; k++) {
      const prev = sorted[k - 1];
      const curr = sorted[k];
      if (!prev || !curr) continue;
      distTotal += calculateDistanceMeters(prev.latitude, prev.longitude, curr.latitude, curr.longitude) / 1000;
    }

    if (distTotal >= 0.3) {
      const startPt = sorted[0];
      const endPt = sorted[sorted.length - 1];
      const startTime = new Date(startPt.recordedAt);
      const endTime = new Date(endPt.recordedAt);
      const durMin = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));
      const startPlace = findMatchingPlace(startPt.latitude, startPt.longitude, places);
      const endPlace = findMatchingPlace(endPt.latitude, endPt.longitude, places);
      const detection = detectDrivingEvents(sorted);

      validTrips.push({
        id: 'trip-1',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes: durMin,
        distanceKm: Math.round(distTotal * 10) / 10,
        maxSpeedKmH: detection.maxSpeed,
        avgSpeedKmH: Math.round(distTotal / (durMin / 60)),
        speedEvents: detection.speedEvents,
        hardBrakingEvents: detection.hardBrakingEvents,
        rapidAccelEvents: detection.rapidAccelEvents,
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
    }
  }

  // Calcula nota de direção numérica e classificação
  const scoreResult = calculateDrivingScore(
    overallMaxSpeed,
    totalSpeedEvents,
    totalHardBrakingEvents,
    totalRapidAccelEvents
  );

  return {
    trips: validTrips,
    summary: {
      totalTrips: validTrips.length,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalDurationMinutes,
      maxSpeedKmH: Math.round(overallMaxSpeed),
      totalSpeedEvents,
      totalHardBrakingEvents,
      totalRapidAccelEvents,
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
        averageScore: 100,
        overallGrade: 'Excelente',
        trend: 'stable',
      },
      days: emptyDays,
      recentTrips: [],
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

  const daySummaries: DrivingDaySummary[] = [];
  const allTrips: Trip[] = [];
  let totalPeriodDistance = 0;
  let totalPeriodDuration = 0;
  let totalPeriodTrips = 0;
  let overallMaxSpeed = 0;
  let totalSpeedEvents = 0;
  let totalHardBrakingEvents = 0;
  let totalRapidAccelEvents = 0;
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
        scoreValue: null,
        scoreGrade: null,
        hasTrips: false,
      });
      continue;
    }

    const { trips, summary } = segmentPointsIntoTrips(points, places);
    const hasTrips = summary.totalTrips > 0 && summary.totalDistanceKm > 0;

    if (hasTrips) {
      totalPeriodDistance += summary.totalDistanceKm;
      totalPeriodDuration += summary.totalDurationMinutes;
      totalPeriodTrips += summary.totalTrips;
      if (summary.maxSpeedKmH > overallMaxSpeed) overallMaxSpeed = summary.maxSpeedKmH;

      const daySpeedEvents = trips.reduce((acc, t) => acc + (t.speedEvents || 0), 0);
      const dayHardBrakingEvents = trips.reduce((acc, t) => acc + (t.hardBrakingEvents || 0), 0);
      const dayRapidAccelEvents = trips.reduce((acc, t) => acc + (t.rapidAccelEvents || 0), 0);

      totalSpeedEvents += daySpeedEvents;
      totalHardBrakingEvents += dayHardBrakingEvents;
      totalRapidAccelEvents += dayRapidAccelEvents;

      const dayScore = calculateDrivingScore(
        summary.maxSpeedKmH,
        daySpeedEvents,
        dayHardBrakingEvents,
        dayRapidAccelEvents
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
          ? Math.round(summary.totalDistanceKm / (summary.totalDurationMinutes / 60))
          : 0,
        speedEvents: daySpeedEvents,
        hardBrakingEvents: dayHardBrakingEvents,
        rapidAccelEvents: dayRapidAccelEvents,
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
      averageScore,
      overallGrade,
      trend,
    },
    days: daySummaries,
    recentTrips,
  };
}
