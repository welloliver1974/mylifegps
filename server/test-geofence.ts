// Teste automatizado de Geofencing (Entrada e Saída)
import { checkGeofencesForDevice, calculateDistanceMeters } from './src/services/geofence.js';
import { prisma, initDb } from './src/db.js';

async function runGeofenceTests() {
  console.log('--- TESTE DA ENGINE DE GEOFENCING ---');
  await initDb();

  // Garante que o lugar "Casa" existe para o teste
  const placeCasa = await prisma.place.upsert({
    where: { id: 'test-place-casa' },
    update: {},
    create: {
      id: 'test-place-casa',
      name: 'Casa de Testes',
      latitude: -23.55052,
      longitude: -46.633308,
      radiusMeters: 100.0,
      color: '#10B981',
      icon: 'home',
    },
  });

  const device = await prisma.device.findFirst();
  if (!device) throw new Error('Nenhum dispositivo encontrado no banco para o teste.');

  // Limpa eventos anteriores do teste para estado limpo
  await prisma.placeEvent.deleteMany({
    where: { deviceId: device.id, placeId: placeCasa.id },
  });

  // 1. Simula ponto fora (distante 2 km)
  console.log('\nPasso 1: Enviando coordenada fora da cerca (2 km distante)...');
  const outsideEvents = await checkGeofencesForDevice(
    device.id,
    -23.57000,
    -46.633308,
    10,
    new Date()
  );
  console.log('Eventos disparados (esperado vazio):', outsideEvents);

  // 2. Simula ponto dentro de Casa
  console.log('\nPasso 2: Enviando coordenada exatamente dentro de Casa...');
  const enterEvents = await checkGeofencesForDevice(
    device.id,
    -23.55052,
    -46.633308,
    10,
    new Date()
  );
  console.log('Eventos disparados (esperado ENTER):', enterEvents);
  if (enterEvents.length === 0 || enterEvents[0].eventType !== 'ENTER') {
    throw new Error('Falha: Deveria ter disparado ENTER');
  }

  // 3. Simula ponto novamente dentro (jitter de GPS)
  console.log('\nPasso 3: Enviando coordenada ainda dentro (jitter/ruído)...');
  const duplicateEvents = await checkGeofencesForDevice(
    device.id,
    -23.55055,
    -46.633315,
    10,
    new Date()
  );
  console.log('Eventos disparados (esperado vazio, evitando duplicatas):', duplicateEvents);
  if (duplicateEvents.length > 0) {
    throw new Error('Falha: Não deveria disparar duplicatas enquanto estiver dentro');
  }

  // 4. Simula ponto saindo de Casa
  console.log('\nPasso 4: Enviando coordenada saindo de Casa (distante 500 metros)...');
  const exitEvents = await checkGeofencesForDevice(
    device.id,
    -23.55500,
    -46.633308,
    10,
    new Date()
  );
  console.log('Eventos disparados (esperado EXIT):', exitEvents);
  if (exitEvents.length === 0 || exitEvents[0].eventType !== 'EXIT') {
    throw new Error('Falha: Deveria ter disparado EXIT');
  }

  console.log('\n--- TODOS OS TESTES DE GEOFENCING PASSARAM COM SUCESSO! ---');
  await prisma.place.deleteMany({ where: { id: 'test-place-casa' } });
  await prisma.$disconnect();
}

runGeofenceTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
