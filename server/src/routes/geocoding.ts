import { FastifyInstance } from 'fastify';
import { reverseGeocode } from '../services/geocoding.js';

export async function geocodingRoutes(fastify: FastifyInstance) {
  fastify.get('/api/geocoding/reverse', async (request, reply) => {
    const query = request.query as { lat?: string; lon?: string; latitude?: string; longitude?: string };
    const latStr = query.lat || query.latitude;
    const lonStr = query.lon || query.longitude;

    if (!latStr || !lonStr) {
      return reply.status(400).send({ error: 'Parâmetros lat e lon são obrigatórios' });
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      return reply.status(400).send({ error: 'Coordenadas inválidas' });
    }

    const result = await reverseGeocode(lat, lon);
    return reply.send({ success: true, ...result });
  });
}
