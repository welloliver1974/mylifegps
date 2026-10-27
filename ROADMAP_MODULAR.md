# My Life360: Roteiro de Execução em Blocos Modulares

> **Instrução para qualquer IA / Desenvolvedor:**
> Este documento é a fonte de verdade do estado do projeto. Cada bloco é autocontido. Ao retomar o trabalho, verifique o status de cada bloco (`[ ]` pendente, `[/]` em andamento, `[x]` concluído) e execute a partir do bloco atual.

---

## Estado Geral do Projeto
* **Diretório Raiz:** `E:\Apps\my life360`
* **Abordagem Escolhida:** Caminho B (Sistema próprio e independente, hospedado em VPS Oracle Cloud Ubuntu 24/7 via Cloudflare Tunnel).
* **Foco:** Baixo consumo de bateria, privacidade total, histórico ilimitado e sem dependência de APIs fechadas do Life360.

---

## BLOCO 1: Contrato de Dados & Schemas (Backend Core)
- [x] **Status:** CONCLUÍDO
- **Objetivo:** Definir modelos de dados e schemas de entrada/saída.
- **Entregáveis:**
  - `User` (id, nome, avatar, cor, telefone, criado_em)
  - `Device` (id, user_id, device_name, token_auth, ultimo_visto)
  - `Location` (id, device_id, latitude, longitude, altitude, accuracy, speed, heading, battery, is_charging, timestamp)
  - `Place` / `Geofence` (id, user_id/circle_id, nome, latitude, longitude, radius_meters)
  - `PlaceEvent` (id, device_id, place_id, tipo: ENTER | EXIT, timestamp)
- **Critério de Conclusão:** Arquivo `schema.prisma` criado em `server/prisma/schema.prisma`, banco SQLite `dev.db` gerado com WAL mode e seed de teste testado.

---

## BLOCO 2: Servidor API & WebSockets (VPS)
- [x] **Status:** CONCLUÍDO
- **Objetivo:** Criar a API leve em Node.js (Fastify ou Express + TypeScript).
- **Entregáveis:**
  - `POST /api/telemetry` (ingestão rápida de coordenadas enviadas pelos celulares).
  - `GET /api/members/live` (última posição conhecida de cada membro da família).
  - `GET /api/members/:id/history?from=&to=` (histórico de rastros).
  - Servidor WebSocket (`/ws`) para broadcast de posições em tempo real para o mapa.
  - Compatibilidade com protocolo Traccar HTTP (`GET/POST /api/telemetry/traccar`) para teste imediato.
- **Critério de Conclusão:** Servidor Fastify estruturado em `server/src`, compilado em `dist/` e 100% validado pelo script de teste automatizado `test-api.ts`.

---

## BLOCO 3: Engine de Geofencing (Detecção de Lugares)
- [x] **Status:** CONCLUÍDO
- **Objetivo:** Identificar automaticamente quando um membro entra ou sai de áreas demarcadas (Casa, Trabalho, Escola).
- **Entregáveis:**
  - Função matemática de distância (fórmula de Haversine de alta precisão).
  - Máquina de estados com histerese (evita falso positivo e duplicatas por jitter de GPS).
  - Emissão de eventos `ENTER` e `EXIT` persistidos em banco e transmitidos via WebSocket em tempo real.
  - Endpoint `GET /api/places/events` para timeline de alertas.
- **Critério de Conclusão:** Testes automatizados em `server/test-geofence.ts` validados (detecção de entrada, saída e supressão de ruídos).

---

## BLOCO 4: Painel Web / PWA em Tempo Real (Interface Estilo Life360)
- [x] **Status:** CONCLUÍDO
- **Objetivo:** Interface moderna, responsiva (mobile e desktop) com mapa interativo.
- **Entregáveis:**
  - Mapa em tela cheia (Leaflet com tiles CartoDB Voyager/Dark Matter sem chaves de API).
  - Marcadores animados com avatar, porcentagem de bateria, velocidade e status de carregamento.
  - Linha do tempo de histórico de deslocamento do dia (rastro em polyline no mapa).
  - PWA instalável no celular (`manifest.json` + `sw.js`).
  - Atualização em tempo real via WebSocket com toasts de geofencing.
  - Servido diretamente pela API Fastify via `@fastify/static` em `server/public`.
- **Critério de Conclusão:** Acessível em `http://localhost:3000/` (e na VPS via Cloudflare Tunnel), validado com status HTTP 200.

---

## BLOCO 5: Ingestão de Teste Imediato (Clientes Celular)
- [x] **Status:** CONCLUÍDO
- **Objetivo:** Colocar a família no mapa hoje sem esperar a compilação do app próprio final.
- **Entregáveis:**
  - Guia de configuração detalhado em `deploy/GUIA_CONFIGURACAO_CELULARES.md`.
  - Configuração do Traccar Client (Android/iOS) com regra inteligente de economia de bateria (disparo por distância > 50m).
  - Scripts de deploy para VPS Oracle Cloud via Docker (`deploy/Dockerfile`, `deploy/docker-compose.yml`) e via PM2 (`deploy/ecosystem.config.cjs`, `deploy/quick-deploy.sh`).
- **Critério de Conclusão:** Protocolo testado e documentação pronta para ativação imediata nos aparelhos.

---

## BLOCO 6: Aplicativo Mobile Próprio Dedicado (Fase Final)
- [x] **Status:** CONCLUÍDO
- **Objetivo:** App nativo (React Native / Expo) com a experiência completa do Life360.
- **Entregáveis:**
  - Código-fonte completo em `mobile/` com Expo, React Native e TypeScript.
  - Foreground Service persistente (`mobile/src/services/locationTask.ts`) com `expo-location` e `expo-task-manager` para envio 24/7.
  - Leitura nativa de bateria e status de carregamento (`expo-battery`).
  - Interface híbrida de alta performance unificando mapa ao vivo e menu de ajustes do aparelho (`mobile/App.tsx`).
  - Instruções de compilação de APK instalável via EAS em `mobile/README.md`.
- **Critério de Conclusão:** Projeto mobile estruturado, configurado com permissões de background no Android/iOS e pronto para geração do APK.

---

## BLOCO 7: Aprimoramento Visual & Experiência Life360 (UI/UX do Mapa e App)
- [x] **Status:** CONCLUÍDO
- **Objetivo:** Transformar a interface visual para replicar fielmente a estética premium do Life360 oficial e liberar todas as funcionalidades pagas (Platinum/Gold).
- **Entregáveis:**
  - [x] **Estilo de Mapa Estilo Life360:** Mapa Voyager limpo (pastel, verde/azul suave, ruas bem definidas) + seletor flutuante para Satélite Esri e Noturno CARTO com persistência local.
  - [x] **Avatares Idênticos ao Life360:** Marcador com anel SVG circular de bateria dinâmico (verde/laranja/vermelho), badge de recarga ⚡, tag de velocidade (🚗 km/h) e deslizamento contínuo suave.
  - [x] **Lugares e Cercas Estilizadas:** Ícones ilustrados (Casa 🏠, Trabalho 💼, Escola 🎓, etc.) com pílula flutuante e seletor visual no cadastro.
  - [x] **Gaveta Inferior Interativa (Bottom Sheet - Etapa 7.3):** Deslizar suavemente com gestos de toque (arrasto vertical), barra recolhida sincronizada com mini avatares do círculo, visual translúcido nativo.
  - [x] **Recursos Premium Desbloqueados (Gratuitos e Ilimitados):**
    - **Botão de Pânico / SOS de Emergência:** Alerta em tela cheia instantâneo via WebSocket e REST com contagem regressiva de 5s, som de emergência e botão direto para traçar rota no Google Maps.
    - **Replay 360° com Scrubber:** Player de reprodução do trajeto com controle de velocidade (1x, 2x, 4x), barra de progresso e animação do marcador ao longo do trajeto.
    - **Histórico Ilimitado com Calendário:** Seletor de qualquer data passada (`?from=&to=`) sem expiração de dados.
    - **Relatório de Direção (Driver Report - Life360 Gold):** Cálculo de velocidade máxima, distância total (Haversine), tempo em movimento, eventos de risco e pontuação de direção.
    - **Ação Rápida 'Como Chegar':** Deep link direto para navegação passo a passo no Google Maps.
    - **Lugares Ilimitados:** Sem limite artificial de locais ou cercas cadastradas (com exclusão no chip).
    - **Chat do Círculo Familiar:** Mensagens em tempo real via WebSocket com histórico persistido em banco, sem limite de retenção.
    - **Timeline de Alertas de Lugares:** Histórico visual de todas as entradas e saídas (ENTER/EXIT) dos membros nas cercas virtuais.
    - **Check-in Rápido:** Aviso instantâneo "estou seguro" para todo o círculo, pelo topo da tela ou pelo menu do círculo.
    - **Código de Convite do Círculo:** Código privado gerado e copiável para convidar novos membros da família.
    - **Menu do Círculo Familiar:** Painel com código de convite, check-in e gestão do grupo.
    - **Layout sem Sobreposição:** Painel lateral à esquerda no desktop (minimizável) e gaveta inferior no celular, liberando 100% dos botões flutuantes da direita.
- **Critério de Conclusão:** Interface web/PWA e mobile visualmente idêntica à experiência do Life360 original com 100% dos recursos avançados e pagos disponíveis gratuitamente.

---

## BLOCO 8: Paridade Total & Segurança de Produção
- [/] **Status:** EM ANDAMENTO (Etapas 8.1 a 8.6 concluídas — Próxima: Etapa 8.7)
- **Objetivo:** Fechar as lacunas de paridade real com o Life360 oficial e tornar o app seguro para produção e uso diário da família.
- **Referência obrigatória:** [`FEATURE_PARITY.md`](FEATURE_PARITY.md) — auditoria item por item (fonte de verdade).

### Sub-etapas estruturadas (executar em ordem ao retomar):

- [x] **Etapa 8.1: Autenticação e Sessão (CRÍTICO - CONCLUÍDO)**
  - Senha com bcrypt, sessões revogáveis de 30 dias em SQLite (`AuthSession`), hook Fastify global bloqueando `/api/*`, `/ws` protegido com token na query string. Tela de primeiro acesso para criar admin. Commit `60038cf`.

- [x] **Etapa 8.2: Endereço Legível (Reverse Geocoding - CONCLUÍDO)**
  - Nominatim/OSM integrado com rate limiting (1 req/s) e cache persistente em SQLite (`GeocodingCache` indexado por lat/lon arredondados).
  - Detecção imediata de cerca virtual ativa (`currentPlace` no `GET /api/members/live` e no WebSocket).
  - Card de endereço Life360 no painel de detalhes (`#detailAddressCard`) e subtítulo dinâmico na lista de membros (`#memberSubtext-${id}`).
  - PWA atualizado para cache `life360-v8`. Commit `334d3cc`.

- [x] **Etapa 8.3: Edição de Lugares (Places - CONCLUÍDO)**
  - Endpoint `PUT /api/places/:id` com validação de dados no Fastify.
  - Botão de edição (✏️) nos chips de lugares do painel e abertura direta pelo clique na pílula flutuante no mapa.
  - Modal reaproveitado dinamicamente para criação ou alteração (título, campos preenchidos e botão de confirmação).
  - Recálculo imediato do status de presença dos membros no raio modificado. Cache PWA `life360-v9`. Commit `384beff`.

- [x] **Etapa 8.4: Relatório de Direção Segmentado por Viagem (Life360 Gold - CONCLUÍDO)**
  - Algoritmo de segmentação inteligente em `server/src/services/tripDetection.ts` com corte por paradas (>5 min), filtro de deslocamento mínimo (150 m) e associação de início/fim a lugares cadastrados ou endereços legíveis.
  - Endpoint `GET /api/members/:userId/trips` com filtros de data (`?from=&to=&limit=`) e sumário com tempo em movimento real, velocidade máxima e nota calibrada (Excelente, Bom, Atenção).
  - Interface no estilo Life360 Gold: cards individuais de viagens com horário inicial/final, duração, trajeto ilustrado (origem e destino com marcadores), chips de distância, velocidade média/máxima e alertas de excesso.
  - Clique no card de viagem traça rota destacada no mapa com marcadores de início/fim e carrega o Scrubber de replay. Cache PWA `life360-v10`. Commit `d7d5758`.

- [x] **Etapa 8.5: Notificações Push Web (VAPID / Web Push - CONCLUÍDO)**
  - Pacote `web-push` configurado no backend com chaves criptográficas VAPID e tabela `PushSubscription` no SQLite (`dev.db`).
  - Endpoints `GET /api/push/public-key`, `POST /api/push/subscribe`, `POST /api/push/unsubscribe` e `POST /api/push/test`.
  - Service Worker (`sw.js`) com escuta nativa de eventos `push` e foco na janela do app ao clicar na notificação (`notificationclick`). Notificações de SOS com `requireInteraction` (não somem até o usuário tocar).
  - Disparo automático de Web Push em eventos de cerca eletrônica (ENTER/EXIT em `geofence.ts`), Alertas de SOS (`websocket.ts`) e Check-in da família (`websocket.ts`), mesmo com o app/navegador fechados.
  - Botão de ativação e teste de push integrado no menu do círculo da UI. Cache PWA `life360-v11`.

- [x] **Etapa 8.6: Histórico Persistido de SOS (CONCLUÍDO)**
  - Modelo `SosEvent` no SQLite com relações de usuário e resolvedor (`prisma/schema.prisma`).
  - Rotas `GET /api/emergency/sos`, `GET /api/emergency/sos/active`, `POST /api/emergency/sos` e `PUT /api/emergency/sos/:id/resolve` em `server/src/routes/emergency.ts`.
  - Persistência e disparo síncrono tanto via REST quanto via WebSocket (`TRIGGER_SOS` em `index.ts`), com broadcast em tempo real (`SOS_ALERT` e `SOS_RESOLVED`) e envio de Web Push com tag e som de alta prioridade.
  - Interface de Histórico de Segurança no Bottom Sheet (`#sosHistorySection` no estilo Life360 Safety History) com filtros dinâmicos (Todos, Ativos, Resolvidos), badges animados, botão de localização rápida no mapa e botão "Marcar como Seguro" (resolução).
  - Botão de resolução rápida diretamente no alerta em tela cheia (`#btnSosResolveActive`). Cache PWA `life360-v12`.

- [ ] **Etapa 8.7: Perfil de Membro & Upload de Foto Real (PRÓXIMA)**
  - **Objetivo:** Permitir envio de foto real do membro para substituir as iniciais SVG no mapa e na lista.
  - **Arquivos:** `@fastify/multipart` + upload em `server/public/uploads/avatars` + endpoint `PUT /api/members/:id/profile`.

- [ ] **Etapa 8.8: Mensagem Direta 1:1 no Círculo**
  - **Objetivo:** Conversas privadas entre dois membros além do chat coletivo.
  - **Arquivos:** Tabela `DirectMessage` + seletor no chat do app.

- [ ] **Etapa 8.9: Segurança e Robustez de Infraestrutura**
  - **Objetivo:** Proteger ingestão de GPS (`/api/telemetry` com API key por aparelho), rotina de backup diário do SQLite (WAL checkpoint + cópia segura com retenção) e log de acessos.

- [ ] **Etapa 8.10: App Mobile Dedicado com Detecção de Acidente Real**
  - **Objetivo:** Sensor de desaceleração brusca no app Expo usando `expo-sensors` (acelerômetro) para acionar `CRASH_DETECTED` real em caso de impacto veicular.

- **Fora de escopo (não replicável):** despacho para polícia/SAMU e proteção contra roubo de identidade (serviços de parceiros comerciais pagos).
- **Critério de Conclusão do Bloco 8:** `FEATURE_PARITY.md` com 100% dos itens técnicos concluídos e app pronto para deploy definitivo na VPS Oracle Cloud.
