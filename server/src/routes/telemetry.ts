import { FastifyInstance } from 'fastify';
import { processTelemetry } from '../services/telemetry.js';

export async function telemetryRoutes(fastify: FastifyInstance) {
  // Ingestão via JSON padrão (App próprio / API REST)
  fastify.post('/api/telemetry', async (request, reply) => {
    const body = request.body as any;

    if (!body?.deviceIdentifier || body?.latitude === undefined || body?.longitude === undefined) {
      return reply.status(400).send({ error: 'deviceIdentifier, latitude e longitude são obrigatórios' });
    }

    const result = await processTelemetry({
      deviceIdentifier: String(body.deviceIdentifier),
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      altitude: body.altitude ? Number(body.altitude) : undefined,
      accuracy: body.accuracy ? Number(body.accuracy) : undefined,
      speed: body.speed ? Number(body.speed) : undefined,
      heading: body.heading ? Number(body.heading) : undefined,
      battery: body.battery ? Number(body.battery) : undefined,
      isCharging: Boolean(body.isCharging),
      recordedAt: body.timestamp ? new Date(body.timestamp) : undefined,
    });

    return reply.status(201).send({ success: true, data: result });
  });

  // Compatibilidade imediata com Traccar Client (Protocolo OsmAnd HTTP GET e POST)
  // Exemplo de chamada do Traccar: /api/telemetry/traccar?id=123456&lat=-23.55&lon=-46.63&timestamp=1700000000&speed=0.0&bearing=0.0&altitude=760.0&batt=85.0&charge=false
  const handleTraccar = async (query: any, reply: any) => {
    const id = query.id || query.deviceid;
    const lat = query.lat || query.latitude;
    const lon = query.lon || query.longitude;

    if (!id || lat === undefined || lon === undefined) {
      return reply.status(400).send({ error: 'Parâmetros id, lat e lon são necessários' });
    }

    const timestamp = query.timestamp ? new Date(Number(query.timestamp) * 1000) : new Date();

    await processTelemetry({
      deviceIdentifier: String(id),
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      altitude: query.altitude ? parseFloat(query.altitude) : undefined,
      accuracy: query.accuracy || query.hdop ? parseFloat(query.accuracy || query.hdop) : undefined,
      speed: query.speed ? parseFloat(query.speed) * 3.6 : undefined, // converte nós ou m/s para km/h
      heading: query.bearing || query.heading ? parseFloat(query.bearing || query.heading) : undefined,
      battery: query.batt ? parseFloat(query.batt) : undefined,
      isCharging: query.charge === 'true' || query.charge === true,
      recordedAt: timestamp,
    });

    return reply.status(200).send('OK');
  };

  fastify.get('/api/telemetry/traccar', async (request, reply) => {
    return handleTraccar(request.query, reply);
  });

  fastify.post('/api/telemetry/traccar', async (request, reply) => {
    const data = { ...(request.query as object), ...(request.body as object) };
    return handleTraccar(data, reply);
  });
}
