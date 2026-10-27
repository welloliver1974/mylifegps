// Simulador de deslocamento em tempo real para testar o mapa do My Life360
const BASE_URL = 'http://127.0.0.1:3000';

// Trajeto simulado saindo de Casa em direção à Av. Paulista
const WAYPOINTS = [
  { lat: -23.55052, lng: -46.633308, speed: 0, battery: 85, note: 'Parado em Casa' },
  { lat: -23.55120, lng: -46.634000, speed: 25, battery: 85, note: 'Saindo de Casa na rua' },
  { lat: -23.55350, lng: -46.636000, speed: 42, battery: 85, note: 'Em movimento' },
  { lat: -23.55700, lng: -46.640000, speed: 58, battery: 84, note: 'Dirigindo na avenida' },
  { lat: -23.56100, lng: -46.645000, speed: 45, battery: 84, note: 'Aproximando do destino' },
  { lat: -23.56400, lng: -46.652000, speed: 15, battery: 84, note: 'Desacelerando' },
  { lat: -23.56500, lng: -46.654000, speed: 0, battery: 83, note: 'Chegou e estacionou' },
];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startSimulation() {
  console.log('🚗 Iniciando simulação de trajeto do Wellington...');
  console.log('Abra http://localhost:3000 no seu navegador para ver o avatar se movendo!');

  for (let i = 0; i < WAYPOINTS.length; i++) {
    const pt = WAYPOINTS[i];
    console.log(`\n[Ponto ${i + 1}/${WAYPOINTS.length}] ${pt.note} (Velocidade: ${pt.speed} km/h, Bateria: ${pt.battery}%)`);

    try {
      const res = await fetch(`${BASE_URL}/api/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceIdentifier: 'wellington-phone-01',
          latitude: pt.lat,
          longitude: pt.lng,
          speed: pt.speed,
          heading: 210,
          accuracy: 8,
          battery: pt.battery,
          isCharging: false,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log('✅ Coordenada transmitida com sucesso.');
      } else {
        console.error('❌ Erro na resposta:', data);
      }
    } catch (err: any) {
      console.error('❌ Falha de conexão:', err.message);
    }

    if (i < WAYPOINTS.length - 1) {
      console.log('Aguardando 2 segundos para o próximo ponto...');
      await sleep(2000);
    }
  }

  console.log('\n🏁 Simulação concluída com sucesso!');
}

startSimulation().catch(console.error);
