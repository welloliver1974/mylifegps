# My Life360 (mylifegps) 🌐📍

> **Sistema próprio, independente e auto-hospedado de rastreamento familiar em tempo real**, projetado para rodar 24/7 em VPS Oracle Cloud com custo zero, privacidade absoluta e **todos os recursos avançados e pagos do Life360 (Platinum e Gold) liberados**.

[![Status](https://img.shields.io/badge/Status-100%25%20Funcional-success)](#)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-blue)](#)
[![Fastify](https://img.shields.io/badge/Fastify-4.28-black)](#)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite%20WAL-indigo)](#)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green)](#)
[![PWA](https://img.shields.io/badge/PWA-Ready-orange)](#)

---

## 🚀 Destaques e Recursos Principais

### 1. Visual Idêntico ao App Mobile Life360 Oficial
- **Tema Claro Oficial:** Estética nativa refinada com cartões translúcidos, tipografia *Plus Jakarta Sans* e layout otimizado para celulares e desktop.
- **Camadas de Mapa Flexíveis:** *Life360 Clean* (CARTO Voyager pastel suave), *Satélite em Alta Resolução* (Esri World Imagery) e *Noturno* (CARTO Dark).
- **Avatares Oficiais com Anel SVG:** Anel circular dinâmico que exibe o percentual de bateria em tempo real (verde/laranja/vermelho), indicador pulsante de carregamento ⚡ e tag inteligente de trânsito em `km/h`.
- **Bottom Sheet Gestual:** Gaveta inferior interativa com suporte a gestos verticais, barra recolhida com avatares sobrepostos do círculo e rolagem suave.

### 2. Recursos Premium Desbloqueados (Gratuitos e Ilimitados)
- 🚨 **Alerta de Pânico SOS de Emergência:** Acionamento rápido com contagem regressiva de 5 segundos, alerta sonoro e visual em tela cheia via WebSocket para todos os membros e botão direto para **traçar rota no Google Maps**.
- 🚗 **Replay 360° com Scrubber:** Reprodução animada de percursos com barra de progresso interativa, indicador de velocidade em tempo real e controle de reprodução (`1x`, `2x`, `4x`).
- 📅 **Histórico Ilimitado:** Seletor de datas anteriores por calendário sem limites artificiais de retenção.
- 🛡️ **Relatório de Condução e Segurança (Driver Report):** Cálculo automático de velocidade máxima, distância total (Haversine), tempo em movimento, eventos de risco e classificação de direção (*Excelente*, *Bom*, *Atenção*).
- 🧭 **Ação Rápida "Como Chegar":** Navegação passo a passo ponto a ponto via deep link do Google Maps.
- 🏠 **Lugares Ilimitados:** Criação de cercas virtuais com detecção automática de entrada e saída (`ENTER`/`EXIT`).

---

## 📁 Estrutura do Projeto

```text
mylifegps/
├── server/                     # Servidor Backend Fastify + WebSockets
│   ├── prisma/                 # Schema e Migrações SQLite (Modo WAL)
│   ├── public/                 # Painel Web PWA (HTML, CSS v4, App.js v4, SW v4)
│   │   ├── index.html          # Shell da aplicação estilo Life360
│   │   ├── style.css           # Estilos mobile com Bottom Sheet e modais
│   │   ├── app.js              # Lógica do mapa, WebSockets, SOS e Replay
│   │   └── sw.js               # Service Worker PWA para offline e cache
│   └── src/                    # Código-fonte TypeScript
│       ├── routes/             # Endpoints de Telemetria, Membros e Lugares
│       ├── services/           # Engine de Geofencing e WebSockets
│       └── db.ts               # Conexão de alta concorrência SQLite
├── mobile/                     # App Nativo Próprio (React Native / Expo)
│   ├── src/services/           # Background Service de localização 24/7
│   └── App.tsx                 # Interface mobile com WebView e controles
├── deploy/                     # Guias de Deploy VPS (Docker e PM2)
├── ROADMAP_MODULAR.md          # Roteiro mestre de execução dos 7 Blocos
└── README.md                   # Esta documentação
```

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
- Node.js 20+ instalado
- Chave de basemaps CARTO (opcional/gratuita em [carto.com/basemaps/apikey](https://carto.com/basemaps/apikey))

### Instalação e Execução

```bash
# 1. Acesse o diretório do servidor
cd server

# 2. Instale as dependências
npm install

# 3. Configure o arquivo de ambiente
cp .env.example .env
# Adicione sua CARTO_API_KEY no arquivo server/.env

# 4. Gere o banco de dados SQLite
npx prisma generate
npx prisma db push

# 5. Inicie em modo desenvolvimento ou produção
npm run dev
# ou compile e execute:
npm run build
npm start
```

Acesse **`http://localhost:3000`** no seu navegador ou celular.

---

## 📡 Rastreamento de Celulares

Consulte o guia passo a passo em:
👉 **[`deploy/GUIA_CONFIGURACAO_CELULARES.md`](deploy/GUIA_CONFIGURACAO_CELULARES.md)**

Para utilizar imediatamente em qualquer aparelho (Android/iOS) com consumo mínimo de bateria via **Traccar Client**, configurando a URL do seu servidor:
`http://SEU_IP_OU_DOMINIO:3000/api/telemetry/traccar`

---

## 📜 Licença e Propósito

Projeto desenvolvido para fins educacionais, segurança pessoal e uso familiar privado e independente.
Totalmente livre de rastreadores comerciais ou venda de dados.
