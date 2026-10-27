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
    const rawSpeedKmH = pt.speed ? pt.speed * 3.6 : 0;

    let isMoving = rawSpeedKmH > 4.5;

    // Se o GPS não informou velocidade, calcula pela distância até o ponto anterior
    if (i > 0) {
      const prev = sorted[i - 1];
      const prevTime = new Date(prev.recordedAt).getTime();
      const deltaSec = (ptTime - prevTime) / 1000;

      if (deltaSec > 0 && deltaSec < 3600) {
        const distM = calculateDistanceMeters(prev.latitude, prev.longitude, pt.latitude, pt.longitude);
        const calculatedSpeedKmH = (distM / deltaSec) * 3.6;

        // Se moveu mais de 15 metros em tempo hábil e velocidade calculada razoável (<180 km/h)
        if (distM > 15 && calculatedSpeedKmH > 4.5 && calculatedSpeedKmH < 180) {
          isMoving = true;
        }

        // Se parado por mais de 5 minutos (300s) e já havia uma viagem em andamento
        if (deltaSec > 300 && currentTrip.length > 0) {
          rawTrips.push(currentTrip);
          currentTrip = [];
        }
      }
    }

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
      const spd = p.speed ? p.speed * 3.6 : 0;
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
      const spd = typeof curr.speed === 'number' ? curr.speed * 3.6 : 0;
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

  // Calcula nota de direção
  let score: 'Excelente' | 'Bom' | 'Atenção' = 'Excelente';
  if (overallMaxSpeed > 100 || totalSpeedEvents > 2) {
    score = 'Atenção';
  } else if (overallMaxSpeed > 80 || totalSpeedEvents > 0) {
    score = 'Bom';
  }

  return {
    trips: validTrips,
    summary: {
      totalTrips: validTrips.length,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalDurationMinutes,
      maxSpeedKmH: Math.round(overallMaxSpeed),
      score,
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
