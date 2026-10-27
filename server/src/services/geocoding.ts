import { prisma } from '../db.js';

interface GeocodeResult {
  address: string;
  road?: string;
  suburb?: string;
  city?: string;
}

// Cache em memória para resposta instantânea
const memoryCache = new Map<string, GeocodeResult>();

// Timestamp da última chamada ao Nominatim (para respeitar 1 req/s)
let lastNominatimRequestTime = 0;

// Arredonda coordenadas para 4 casas decimais (~11 metros de precisão)
export function roundCoord(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function buildCacheKey(latKey: number, lonKey: number): string {
  return `${latKey.toFixed(4)}:${lonKey.toFixed(4)}`;
}

export function formatOsmAddress(data: any, lat: number, lon: number): GeocodeResult {
  if (!data || !data.address) {
    const fallback = data?.name || data?.display_name?.split(',').slice(0, 2).join(',') || `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`;
    return { address: fallback };
  }

  const a = data.address;
  const road = a.road || a.pedestrian || a.street || a.footway || a.cycleway || a.path || a.suburb || '';
  const houseNumber = a.house_number ? `, ${a.house_number}` : '';
  const suburb = a.suburb || a.neighbourhood || a.city_district || a.district || '';
  const city = a.city || a.town || a.municipality || a.village || a.county || '';

  let address = '';
  if (road) {
    address = `${road}${houseNumber}`;
    if (suburb && suburb !== road) {
      address += ` - ${suburb}`;
    }
    if (city && city !== suburb) {
      address += `, ${city}`;
    }
  } else if (data.display_name) {
    // Pega as primeiras 2-3 partes do display_name
    address = data.display_name.split(',').slice(0, 3).map((s: string) => s.trim()).join(' - ');
  } else {
    address = `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`;
  }

  return {
    address,
    road: road || undefined,
    suburb: suburb || undefined,
    city: city || undefined,
  };
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
  const latKey = roundCoord(latitude);
  const lonKey = roundCoord(longitude);
  const cacheKey = buildCacheKey(latKey, lonKey);

  // 1. Verifica cache em memória
  const inMemory = memoryCache.get(cacheKey);
  if (inMemory) {
    return inMemory;
  }

  // 2. Verifica cache em banco (SQLite)
  try {
    const inDb = await prisma.geocodingCache.findUnique({
      where: {
        latKey_lonKey: { latKey, lonKey },
      },
    });

    if (inDb) {
      const result: GeocodeResult = {
        address: inDb.address,
        road: inDb.road || undefined,
        suburb: inDb.suburb || undefined,
        city: inDb.city || undefined,
      };
      memoryCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.error('Erro ao consultar cache de geocoding no banco:', err);
  }

  // 3. Consulta Nominatim OSM com controle de taxa (1 req/s)
  const now = Date.now();
  const elapsed = now - lastNominatimRequestTime;
  if (elapsed < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastNominatimRequestTime = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latKey}&lon=${lonKey}&format=jsonv2&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'MyLife360/1.0 (https://github.com/welloliver1974/mylifegps)',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      throw new Error(`Nominatim HTTP ${res.status}`);
    }

    const data = await res.json();
    const result = formatOsmAddress(data, latitude, longitude);

    // Salva no banco e na memória
    try {
      await prisma.geocodingCache.upsert({
        where: {
          latKey_lonKey: { latKey, lonKey },
        },
        create: {
          latKey,
          lonKey,
          address: result.address,
          road: result.road || null,
          suburb: result.suburb || null,
          city: result.city || null,
          fullJson: JSON.stringify(data),
        },
        update: {
          address: result.address,
          road: result.road || null,
          suburb: result.suburb || null,
          city: result.city || null,
        },
      });
    } catch (saveErr) {
      console.error('Erro ao salvar geocoding no banco:', saveErr);
    }

    memoryCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('Falha ao consultar Nominatim OSM, usando coordenadas brutas:', err);
    const fallback: GeocodeResult = {
      address: `Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}`,
    };
    return fallback;
  }
}
