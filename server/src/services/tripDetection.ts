import { calculateDistanceMeters } from './geofence.js';
import { prisma } from '../db.js';
import { roundCoord } from './geocoding.js';

export interface TripPoint {
  latitude: number;
  longitude: number;
  speed: number | null;
  recordedAt: Date | string;
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
 */
export function calculateDrivingScore(
  maxSpeedKmH: number,
  speedEvents: number
): { scoreValue: number; scoreGrade: 'Excelente' | 'Bom' | 'Atenção' } {
  let val = 100;

  // Penalidade por eventos de excesso de velocidade (>90 km/h)
  val -= Math.min(35, speedEvents * 7);

  // Penalidade pela velocidade máxima atingida
  if (maxSpeedKmH > 130) {
    val -= 35;
  } else if (maxSpeedKmH > 110) {
    val -= 25;
  } else if (maxSpeedKmH > 90) {
    val -= 15;
  } else if (maxSpeedKmH > 80) {
    val -= 8;
  }

  val = Math.max(0, Math.min(100, Math.round(val)));

  let scoreGrade: 'Excelente' | 'Bom' | 'Atenção' = 'Excelente';
  if (val < 75 || maxSpeedKmH > 100 || speedEvents > 2) {
    scoreGrade = 'Atenção';
  } else if (val < 90 || maxSpeedKmH > 80 || speedEvents > 0) {
    scoreGrade = 'Bom';
  }

  return { scoreValue: val, scoreGrade };
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
        score: 'Excelente',
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

  let tripIdx = 1;
  for (const tPoints of rawTrips) {
    if (tPoints.length < 2) continue;

    const startPt = tPoints[0];
    const endPt = tPoints[tPoints.length - 1];
    const startTime = new Date(startPt.recordedAt);
    const endTime = new Date(endPt.recordedAt);
    const durationMin = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));

    let distKm = 0;
    let maxSpeed = 0;
    let speedSum = 0;
    let speedEvents = 0;

    for (let j = 0; j < tPoints.length; j++) {
      const p = tPoints[j];
      let calcSpd = 0;
      if (j > 0) {
        const prev = tPoints[j - 1];
        const dSec = (new Date(p.recordedAt).getTime() - new Date(prev.recordedAt).getTime()) / 1000;
        if (dSec > 0 && dSec < 3600) {
          calcSpd = (calculateDistanceMeters(prev.latitude, prev.longitude, p.latitude, p.longitude) / dSec) * 3.6;
        }
      }
      const spd = extractSpeedKmH(p.speed, calcSpd);
      if (spd > maxSpeed && spd < 200) maxSpeed = spd;
      if (spd > 90) speedEvents++;
      speedSum += spd;

      if (j > 0) {
        const prev = tPoints[j - 1];
        distKm += calculateDistanceMeters(prev.latitude, prev.longitude, p.latitude, p.longitude) / 1000;
      }
    }

    // Critério: pelo menos 150 metros
    if (distKm < 0.15) continue;

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
  }

  // Se não detectou viagens separadas mas o membro percorreu distância relevante (> 300m), cria viagem única
  if (validTrips.length === 0 && sorted.length >= 2) {
    let distTotal = 0;
    let maxSpd = 0;
    for (let k = 1; k < sorted.length; k++) {
      const prev = sorted[k - 1];
      const curr = sorted[k];
      if (!prev || !curr) continue;
      distTotal += calculateDistanceMeters(prev.latitude, prev.longitude, curr.latitude, curr.longitude) / 1000;
      const spd = extractSpeedKmH(curr.speed);
      if (spd > maxSpd && spd < 200) maxSpd = spd;
    }

    if (distTotal >= 0.3) {
      const startPt = sorted[0];
      const endPt = sorted[sorted.length - 1];
      const startTime = new Date(startPt.recordedAt);
      const endTime = new Date(endPt.recordedAt);
      const durMin = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));
      const startPlace = findMatchingPlace(startPt.latitude, startPt.longitude, places);
      const endPlace = findMatchingPlace(endPt.latitude, endPt.longitude, places);

      validTrips.push({
        id: 'trip-1',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes: durMin,
        distanceKm: Math.round(distTotal * 10) / 10,
        maxSpeedKmH: Math.round(maxSpd),
        avgSpeedKmH: Math.round(distTotal / (durMin / 60)),
        speedEvents: 0,
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
      overallMaxSpeed = maxSpd;
    }
  }

  // Calcula nota de direção numérica e classificação
  const scoreResult = calculateDrivingScore(overallMaxSpeed, totalSpeedEvents);

  return {
    trips: validTrips,
    summary: {
      totalTrips: validTrips.length,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalDurationMinutes,
      maxSpeedKmH: Math.round(overallMaxSpeed),
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
      totalSpeedEvents += daySpeedEvents;

      const dayScore = calculateDrivingScore(summary.maxSpeedKmH, daySpeedEvents);
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
      averageScore,
      overallGrade,
      trend,
    },
    days: daySummaries,
    recentTrips,
  };
}
