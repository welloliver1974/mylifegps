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
    // Tiles de mapa reais com ruas têm 15KB a 40KB; o tile de erro "API key required" tem ~2KB
    const ok = res.ok && contentType.includes('image') && bytes > 5000;

    console.log(`${ok ? '✅' : '❌'} ${label}`);
    console.log(`   Status: ${res.status} | Tipo: ${contentType} | Tamanho: ${bytes} bytes ${bytes <= 5000 ? '(⚠️ Imagem de erro "API KEY REQUIRED")' : '(Mapa real renderizado)'}`);
    return ok;
  } catch (err: any) {
    console.log(`❌ ${label} -> Erro de rede: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('=== TESTE DE AUTENTICAÇÃO DOS TILES CARTO ===\n');
  console.log(`Chave lida do .env: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)} (${apiKey.length} caracteres)\n`);

  // Centro de SP (zoom 15)
  const zoom = 15, x = 12139, y = 18590;

  const darkAllKey = await testTile(
    'CARTO dark_all COM ?key= (modo escuro nativo)',
    `https://a.basemaps.cartocdn.com/rastertiles/dark_all/${zoom}/${x}/${y}.png?key=${apiKey}`
  );

  const voyagerKey = await testTile(
    'CARTO voyager COM ?key= (modo claro)',
    `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png?key=${apiKey}`
  );

  const semChave = await testTile(
    'CARTO SEM chave (deve falhar e retornar watermark)',
    `https://a.basemaps.cartocdn.com/rastertiles/dark_all/${zoom}/${x}/${y}.png`
  );

  console.log('\n=== CONCLUSÃO ===');
  if (darkAllKey && voyagerKey && !semChave) {
    console.log('🎉 SUCESSO TOTAL: Chave autenticada e mapas reais gerados!');
  } else {
    console.log('Verifique a saída acima.');
  }
}

run();
