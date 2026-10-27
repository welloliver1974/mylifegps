// Verifica se a chave CARTO do .env autentica corretamente nos tiles do mapa
import { readFileSync } from 'fs';

const envContent = readFileSync(new URL('./.env', import.meta.url), 'utf-8');
const match = envContent.match(/^CARTO_API_KEY\s*=\s*"?([^"\r\n]+)"?/m);

if (!match) {
  console.error('❌ CARTO_API_KEY não encontrada no arquivo .env');
  process.exit(1);
}

const apiKey = match[1].trim();

async function testTile(label: string, url: string) {
  try {
    const res = await fetch(url, { method: 'GET' });
    const contentType = res.headers.get('content-type') || 'desconhecido';
    const bytes = (await res.arrayBuffer()).byteLength;
    const ok = res.ok && contentType.includes('image');

    console.log(`${ok ? '✅' : '❌'} ${label}`);
    console.log(`   Status: ${res.status} | Tipo: ${contentType} | Tamanho: ${bytes} bytes`);
    return ok;
  } catch (err: any) {
    console.log(`❌ ${label} -> Erro de rede: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('=== TESTE DE AUTENTICAÇÃO DOS TILES CARTO ===\n');
  console.log(`Chave lida do .env: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)} (${apiKey.length} caracteres)\n`);

  const zoom = 14, x = 6000, y = 9000;

  const withKey = await testTile(
    'basemaps.cartocdn.com COM chave de API',
    `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png?api_key=${apiKey}`
  );

  const withoutKey = await testTile(
    'basemaps.cartocdn.com SEM chave (CDN público)',
    `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png`
  );

  console.log('\n=== CONCLUSÃO ===');
  if (withKey && withoutKey) {
    console.log('A chave é aceita, mas o CDN público também funciona sem ela.');
  } else if (withKey && !withoutKey) {
    console.log('A chave é obrigatória e está funcionando corretamente.');
  } else if (!withKey && withoutKey) {
    console.log('A chave NÃO é aceita pelo CDN de basemaps — o mapa funciona sem chave.');
  } else {
    console.log('Falha em ambos os casos. Verifique sua conexão com a internet.');
  }
}

run();
