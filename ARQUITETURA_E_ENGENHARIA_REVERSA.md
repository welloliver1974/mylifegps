# Projeto My Life360: Engenharia Reversa e Arquitetura de Sistema Próprio

Este documento consolida o diagnóstico da engenharia reversa do **Life360 (Android)**, os limites e funcionamento de sua API privada, e o plano de arquitetura para a criação de um **Life360 próprio e independente**, aproveitando uma VPS Linux 24/7.

---

## 1. Cenário Atual: O que temos em mãos

* **APK Base Extraído:** `com.life360.android.safetymapd.apk` (v26.40.0, 118.7 MB, multi-dex com 9 arquivos `.dex`).
* **Ambiente de Engenharia Reversa:** JADX 1.5.6 + OpenJDK JBR 21 (Android Studio) configurados e prontos para descompilação no terminal.
* **Infraestrutura Disponível:** Servidor VPS Ubuntu 24/7 (Oracle Cloud) com suporte a Node.js, Docker, WebSockets e Cloudflare Tunnel.

---

## 2. É possível criar um app próprio estilo Life360?

**Sim, é 100% possível e viável.**
Na verdade, ter uma VPS online 24 horas por dia é o **pilar central** necessário para um app de rastreamento familiar em tempo real.

Existem dois caminhos principais que podem ser seguidos:

### Caminho A: Ponte / Proxy com a API do Life360
* **Como funciona:** Sua VPS roda um serviço 24/7 que se autentica no Life360 (usando emulação TLS `curl_cffi` para contornar o Cloudflare) e busca as posições dos membros a cada 30~60 segundos.
* **Vantagens:** A família continua usando o app oficial do Life360 sem precisar instalar nada novo.
* **Desvantagens:** O Life360 bloqueia IPs, altera tokens OAuth periodicamente, impõe rate limits e exige 2FA por SMS caso o número de telefone esteja atrelado à conta.

### Caminho B: Criar o seu PRÓPRIO Life360 Privado (Recomendado a médio prazo)
* **Como funciona:** Você possui seu próprio backend na VPS e seu próprio aplicativo nos celulares da família.
* **Vantagens:**
  * **Privacidade total:** O Life360 comercial é famoso por vender dados de localização dos usuários para corretores de dados de trânsito e marketing. No seu próprio app, os dados nunca saem da sua VPS.
  * **Zero custo de assinaturas:** Sem limitações de histórico (o Life360 gratuito limita o histórico a apenas 2 dias; no seu, você pode guardar meses ou anos).
  * **Lugares ilimitados:** O Life360 limita a quantidade de lugares cadastrados na versão grátis; no seu sistema é ilimitado.
  * **Sem risco de bloqueio:** Não há dependência de APIs de terceiros ou Cloudflare.

---

## 3. O que podemos aprender com a Engenharia Reversa do Life360

O Life360 é o padrão da indústria para rastreamento móvel. Descompilar o APK nos ensina a resolver os maiores desafios de engenharia:

1. **Gestão Inteligente de Bateria (O maior desafio de apps de GPS):**
   * Manter o GPS ligado 100% do tempo descarrega o celular em 3 a 4 horas.
   * O Life360 resolve isso combinando:
     * **Geofencing por hardware (Android Location Services):** O sistema operacional só acorda o app quando o celular cruza uma cerca virtual.
     * **Activity Recognition API:** Detecta se o usuário está `STILL` (parado), `WALKING` (andando) ou `IN_VEHICLE` (dirigindo).
     * Se estiver parado, o GPS fica dormindo (reduz o envio para 15 a 30 minutos via triangulação de antenas/Wi-Fi). Se entrar em um carro, o GPS liga em alta precisão e envia telemetria frequente.
2. **Endpoints da API e Modelos de Dados:**
   * Mapeamento de Círculos (`/v3/circles`), Membros (`/v3/circles/{id}/members`), Lugares (`/v3/places`), Histórico de Condução e Alertas SOS.
3. **Sensores de Direção e Telemetria:**
   * Uso de acelerômetro e giroscópio para detecção de frenagem brusca e velocidade.

---

## 4. Arquitetura do Nosso Life360 Próprio (Self-Hosted)

```
       [ Celulares da Família ]
         (Android / iOS)
                │
                │ HTTPS / WSS / MQTT
                ▼
   ┌────────────────────────────────────────┐
   │          VPS 24/7 (Oracle Cloud)       │
   │                                        │
   │  ┌──────────────────────────────────┐  │
   │  │ Nginx / Cloudflare Tunnel        │  │
   │  └──────────────────┬───────────────┘  │
   │                     │                  │
   │  ┌──────────────────▼───────────────┐  │
   │  │ API Backend (Node.js / Fastify)  │  │
   │  │ - Recebimento de Coordenadas     │  │
   │  │ - Engine de Geofence (Cercas)    │  │
   │  │ - Notificações Push (FCM)        │  │
   │  │ - WebSocket p/ Mapa ao Vivo      │  │
   │  └──────────────────┬───────────────┘  │
   │                     │                  │
   │  ┌──────────────────▼───────────────┐  │
   │  │ Banco de Dados (SQLite / PostGIS)│  │
   │  │ - Histórico de Localizações      │  │
   │  │ - Usuários, Círculos e Lugares   │  │
   │  └──────────────────────────────────┘  │
   └────────────────────────────────────────┘
```

### Componentes Técnicos

1. **Backend na VPS (Node.js / TypeScript com Fastify ou Express):**
   * Endpoint de ingestão rápida de telemetria: `POST /api/location` (lat, lng, precisão, velocidade, bateria, status de carregamento, timestamp).
   * Engine de cálculo geográfico: Cálculo da distância euclidiana/Haversine ou PostGIS para saber se entrou/saiu de "Casa", "Escola", "Trabalho".
   * Disparo de Notificações: Envio de Push via Firebase Cloud Messaging (FCM) quando uma regra de geofence é ativada.
   * Servidor WebSocket: Transmite a posição ao vivo quando alguém da família abre o app/mapa.

2. **Aplicativo Mobile (React Native / Expo ou Flutter):**
   * Interface estilo Life360: Mapa em tela cheia com avatar de cada membro, nível de bateria e endereço atual.
   * Rastreamento em background com serviço persistente (*Foreground Service* com notificação discreta no Android).

3. **Alternativa Open-Source Imediata na VPS:**
   * Caso queira testar a infraestrutura de rastreamento hoje mesmo na VPS sem escrever o app do zero, existem plataformas robustas que podem rodar via Docker:
     * **Traccar:** O mais consagrado servidor de rastreamento open-source do mundo, com app cliente nativo para Android e iOS.
     * **OwnTracks:** Focado estritamente em privacidade familiar e geofences com baixo uso de bateria.

---

## 5. Roteiro de Trabalho Proposto

* [x] **Fase 1:** Diagnóstico dos APKs e validação das ferramentas de descompilação (JADX + Java JBR).
* [x] **Fase 2:** Descompilação pontual das classes do Life360:
  * Controladores de background extraídos (`EventController.java`, `LocationReceiver`).
  * Endpoints REST mapeados (`MembersEngineNetworkApi.java`, `UserApi.java`): `/v4/circles`, `/v4/circles/{id}/members`, `/v5/circles/devices/locations`.
  * Interceptores de autenticação analisados (`MakeBasicAuthorizationHeader.java`, `RequestAuthorizationInterceptor.java`).
* [ ] **Fase 3:** Script de teste (PoC) para verificar se conseguimos consultar a API do Life360 com suas credenciais atuais.
* [ ] **Fase 4:** Modelagem da arquitetura do servidor na VPS (banco de dados, geofencing e endpoints de telemetria).
* [ ] **Fase 5:** Desenvolvimento do app mobile e painel web de monitoramento.
