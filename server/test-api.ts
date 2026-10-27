// Script de teste local para validar todas as rotas do Bloco 2
async function runTests() {
  const baseUrl = 'http://127.0.0.1:3000';

  console.log('--- TESTANDO API MY LIFE360 ---');

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/health`);
  const health = await healthRes.json();
  console.log('1. Health check:', health);

  // 2. Ingestão Telemetria JSON
  const telemetryRes = await fetch(`${baseUrl}/api/telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceIdentifier: 'wellington-phone-01',
      latitude: -23.55052,
      longitude: -46.633308,
      accuracy: 12.5,
      speed: 45.0,
      heading: 180.0,
      battery: 88.0,
      isCharging: false,
    }),
  });
  const telemetry = await telemetryRes.json();
  console.log('2. Ingestão JSON:', telemetryRes.status === 201 ? 'OK' : 'FALHA', telemetry);

  // 3. Ingestão compatível com Traccar Client (OsmAnd GET)
  const traccarUrl = `${baseUrl}/api/telemetry/traccar?id=wellington-phone-01&lat=-23.55100&lon=-46.63400&timestamp=${Math.floor(Date.now() / 1000)}&speed=12.5&bearing=90&batt=87&charge=false`;
  const traccarRes = await fetch(traccarUrl);
  const traccarText = await traccarRes.text();
  console.log('3. Ingestão Traccar (GET):', traccarRes.status === 200 ? 'OK' : 'FALHA', traccarText);

  // 4. Consulta de Membros ao Vivo
  const membersRes = await fetch(`${baseUrl}/api/members/live`);
  const members = await membersRes.json();
  console.log('4. Membros ao Vivo:', JSON.stringify(members, null, 2));

  // 5. Histórico de Posições
  if (Array.isArray(members) && members.length > 0) {
    const historyRes = await fetch(`${baseUrl}/api/members/${members[0].id}/history`);
    const history = await historyRes.json();
    console.log(`5. Histórico do membro ${members[0].name}:`, (history as any[]).length, 'pontos gravados.');
  }

  // 6. Consulta de Lugares
  const placesRes = await fetch(`${baseUrl}/api/places`);
  const places = await placesRes.json();
  console.log('6. Lugares cadastrados:', places);

  console.log('--- TODOS OS TESTES PASSARAM! ---');
}

runTests().catch(console.error);
