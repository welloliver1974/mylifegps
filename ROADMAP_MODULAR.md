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
- [/] **Status:** EM ANDAMENTO (Etapas 8.1 a 8.9 concluídas — Próxima: Etapa 8.10, app mobile com sensor de acidente)
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

- [x] **Etapa 8.7: Perfil de Membro & Upload de Foto Real (CONCLUÍDO)**
  - Pacote `@fastify/multipart` registrado com limite de 5MB por arquivo.
  - Endpoints `PUT /api/members/:id/profile`, `POST /api/members/:id/avatar` e `DELETE /api/members/:id/avatar` em `server/src/routes/members.ts`.
  - Armazenamento em `server/public/uploads/avatars/` servido estaticamente com limpeza automática de arquivos substituídos/removidos.
  - Modal `#profileModal` com edição de nome, telefone, seletor de cor com 8 opções e botão `✏️ Editar` no cabeçalho do membro.
  - Upload com preview dinâmico no círculo de avatar, suporte a remoção de foto e renderização de fotos reais nos marcadores do mapa Leaflet, na lista de membros e na barra colapsada. Cache PWA `life360-v13`.

- [x] **Etapa 8.8: Mensagem Direta 1:1 no Círculo (CONCLUÍDO)**
  - Modelo `DirectMessage` no Prisma com índices para remetente, destinatário e status de leitura (`prisma/schema.prisma`).
  - Rotas `GET /api/messages/unread`, `GET /api/messages/direct/:otherUserId` e `POST /api/messages/direct/:otherUserId` em `server/src/routes/messages.ts`.
  - Eventos WebSocket sintonizados: `DIRECT_MESSAGE` com roteamento privado apenas para remetente e destinatário conectados, e `DM_READ` com atualização de recibos de leitura.
  - Disparo automático de Web Push para o destinatário da mensagem com tag e deep-link.
  - Abas dinâmicas de canais de chat no Bottom Sheet (`#chatTabChips`) com mini-avatares dos membros e badges de mensagens não lidas.
  - Botão de acesso rápido "💬 Mensagem Direta" no painel de detalhes do membro (`#btnDirectMessageMember`). Cache PWA `life360-v14`.

- [x] **Etapa 8.9: Segurança e Robustez de Infraestrutura (CONCLUÍDO)**
  - **Ingestão de GPS autenticada:** `/api/telemetry` agora exige chave por aparelho (`l360_...`) validada com `crypto.timingSafeEqual`. A chave é aceita via header `x-device-key`/`x-api-key`, query `?key=`/`?apiKey=` (compatível com Traccar) ou no corpo JSON. `TELEMETRY_MASTER_KEY` opcional para setups com URL única; `TELEMETRY_REQUIRE_KEY=false` como escape consciente para migração.
  - **Modelo `Device.apiKey`** já existente, agora com CRUD completo em `server/src/routes/devices.ts`: `GET /api/devices` (chave completa + mascarada + status online), `POST /api/devices` (gera chave), `PUT /api/devices/:id`, `POST /api/devices/:id/rotate-key` (revoga a anterior na hora) e `DELETE /api/devices/:id`.
  - **Backup automático do SQLite** em `server/src/services/backup.ts`: `PRAGMA wal_checkpoint(TRUNCATE)` + cópia, com fallback `VACUUM INTO`, verificação do cabeçalho `SQLite format 3`, retenção de 14 dias e agendador (primeira execução em 30 s, depois a cada 24 h). Desligável com `BACKUP_ENABLED=false`.
  - **Auditoria de acessos** em `server/src/services/audit.ts` com hook `onResponse` do Fastify: grava usuário, método, rota, status, IP, user-agent e duração. Telemetria bem-sucedida é excluída de propósito (evita milhares de linhas/dia); retenção de 30 dias com poda diária.
  - **Modelo `AccessLog`** no Prisma com índices por data, usuário e status.
  - **Rotas exclusivas de admin** em `server/src/routes/admin.ts`: `POST /api/admin/backup`, `GET /api/admin/backups`, `POST /api/admin/backups/prune`, `GET /api/admin/logs`, `GET /api/admin/logs/summary`, `POST /api/admin/logs/prune` — todas com guarda `role === 'admin'` (403 para membros comuns).
  - **Interface:** modal `#devicesModal` (📱 Dispositivos Conectados: cards com nome, identificador, membro, status online, chave mascarada com revelar/copiar, rotacionar e excluir, além de formulário de novo aparelho) e modal `#adminModal` (🛡️ Painel de Segurança & Backups com abas de backups e auditoria, resumo de 24 h e filtro de erros).
  - **App mobile:** `locationTask.ts` envia a chave em `x-device-key` e trata 401 com aviso explícito; `App.tsx` ganhou o campo "Chave de Telemetria" persistido em AsyncStorage.
  - Cache PWA `life360-v15`. **10/10 testes automatizados aprovados** (telemetria 401 sem chave / 401 com chave errada / 201 com chave correta, rotação revogando a anterior, 403 para não-admin, backup gerado e validado por cabeçalho, listagem, auditoria gravando e exclusão de aparelho).

- [ ] **Etapa 8.10: App Mobile Dedicado com Detecção de Acidente Real**
  - **Objetivo:** Sensor de desaceleração brusca no app Expo usando `expo-sensors` (acelerômetro) para acionar `CRASH_DETECTED` real em caso de impacto veicular.

- **Fora de escopo (não replicável):** despacho para polícia/SAMU e proteção contra roubo de identidade (serviços de parceiros comerciais pagos).
- **Critério de Conclusão do Bloco 8:** `FEATURE_PARITY.md` com 100% dos itens técnicos concluídos e app pronto para deploy definitivo na VPS Oracle Cloud.

---

## BLOCO 9: Círculo Real (Convites & Membros) + Deploy na VPS
- [x] **Status:** CONCLUÍDO (todas as etapas de 9.1 a 9.7 fechadas)
- **Origem:** lacunas levantadas na auditoria pós-Etapa 8.9 (ver `FEATURE_PARITY.md`). Ordem definida por impacto real para a família.
- **Referência obrigatória:** [`FEATURE_PARITY.md`](FEATURE_PARITY.md) — linhas `Código de convite`, `Adicionar/remover membros de verdade`, `Atualizar agora`, `Score semanal/mensal histórico`, `Recuperação de senha`, `Detecção de acidente`, `HTTPS / túnel seguro`.

### Sub-etapas (executar em ordem; cada uma é um bloco fechável e commitável):

- [x] **Etapa 9.1: Convite real por código e Gestão de Membros (CONCLUÍDO)**
  - Modelos `Circle` e `CircleMember` criados no Prisma com códigos seguros `FAM-XXXX-XXXX` sem caracteres ambíguos (`0/O/1/I/L`).
  - Migração de compatibilidade automática em `services/circle.ts`: criação do círculo "Família" com auto-vinculação de usuários e lugares legados.
  - Rotas em `routes/circle.ts`: `GET /api/circle`, `POST /api/circle/invite/regenerate` (admin), `POST /api/circle/join` (entrar com código), `DELETE /api/circle/members/:id` (remover membro) e `PUT /api/circle/name`.
  - Autenticação com convite em `routes/auth.ts`: `POST /api/auth/register-with-invite` para criação direta de conta e entrada imediata no círculo familiar.
  - Isolamento de dados: `GET /api/members/live`, histórico de rotas e lugares agora filtram estritamente pelo círculo do usuário autenticado.
  - Interface Web / PWA: tela de autenticação com alternador "Tenho um código de convite da família", modal do círculo com código real sincronizado, botão de cópia, regeneração de código para admins, listagem completa de membros com badges e remoção interativa. Cache PWA `life360-v16`.
  - **22/22 testes automatizados aprovados** (validação de código inválido 404, cadastro com convite 201, acesso a membros, bloqueio 403 para não-admin, exibição em live, remoção com sumiço síncrono e reentrada com código).

- [x] **Etapa 9.2: Deploy na VPS Oracle Cloud e Geração do App Mobile (.APK)** (CONCLUÍDO)
  - **VPS em Produção:** Node.js/Fastify + SQLite executando no PM2 na VPS Oracle (`150.230.94.243`), publicado com segurança via Cloudflare Tunnel em `https://life360.housecloud.tec.br` sem nenhuma porta pública aberta.
  - **Correções aplicadas:** sanitização de chaves de API do CARTO no backend e frontend, desativação de interceptação agressiva no SW (`life360-v18`), correção do enquadramento de membros (`fitAllMembers`) e inicialização do Leaflet.
  - **App Mobile Dedicado (.APK):**
    - React Native / Expo SDK 51 com visual oficial do Life360 (roxo `#762EEB`, anéis concêntricos, splash nativa e status bar).
    - Rastreamento contínuo em 2º plano via `expo-location` + `expo-task-manager` com Android `ForegroundService` e proteção contra Doze Mode (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`).
    - Economia máxima de bateria (`distanceInterval: 50m`), disparando coordenadas apenas quando o usuário se desloca.
    - Tela de ajustes com botão de teste imediato de telemetria ("📡 Testar Envio de Coordenada") e chave por aparelho (`x-device-key`).
    - Build pré-configurado no `eas.json` com perfil `preview` (`buildType: "apk"`) para geração direta do arquivo `.apk` instalável no celular via `npm run build:apk`.
    - Documentação completa em `mobile/README.md`.
  - **Refinamentos de UI/UX e Usabilidade (App Mobile + Web/Notebook):**
    - **Aba Círculo no celular sem corte:** safe-area-inset no Android (`StatusBar.currentHeight`), responsividade e elipse de texto no cabeçalho.
    - **Respiro no controle do mapa:** espaçamento vertical aumentado para 96px, descolando os botões flutuantes da barra superior do círculo.
    - **Botão flutuante de engrenagem ⚙️ livre:** reposicionado acima da gaveta inferior (`bottom: 110px`) e tornado arrastável com `PanResponder`, liberando a barra inferior.
    - **Minimização no desktop/notebook elegante:** gaveta recolhe 100% da tela sem sobras e exibe pílula flutuante estilizada `[ 👥 Círculo ▸ ]` para reabertura suave.
    - **Tema Dark (Modo Escuro):** botão de alternância no topo e no menu, tokens escuros completos e desacoplamento do mapa (mantém o estilo Voyager claro por padrão para máxima legibilidade de trajetos e marcadores, com opção Noturno manual no seletor de camadas). Cache PWA `life360-v20`.
    - **Edição do nome do círculo:** campo de edição com validação para administradores via `PUT /api/circle/name`, atualizando instantaneamente no topo.

- [x] **Etapa 9.3: Detecção de acidente real por acelerômetro (CONCLUÍDO)**
  - **Matemática pura e auditável (`mobile/src/services/crashMath.ts`):** magnitude vetorial `sqrt(x²+y²+z²)` em Gs (repouso = 1.0G, leituras `NaN`/`Infinity` caem para 1.0 em vez de propagar lixo), classificação de gravidade (`minor` < 3G ≤ `moderate` < 4G ≤ `severe`), limiares por sensibilidade (**Alta 2.5G**, **Média 3.0G**, **Baixa 3.8G**), filtro de velocidade mínima (padrão **20 km/h**), mensagem padronizada e normalização defensiva da configuração salva. Módulo sem nenhum import nativo — testável fora do app.
  - **Sensor nativo (`mobile/src/services/crashDetection.ts`):** `expo-sensors` com amostragem de **100 ms** (`HIGH_SAMPLING_RATE_SENSORS` declarado no `app.json` para o limite de 200 ms do Android 12+), **cooldown de 45 s** entre disparos para não gerar loop de alertas, vibração forte imediata no momento do impacto e sincronização contínua de velocidade/posição recebida do rastreamento em segundo plano.
  - **Filtro anti-falso-positivo:** o evento só sai com **impacto ≥ limiar E velocidade ≥ 20 km/h**, eliminando o caso clássico de o celular cair da mão/mesa com o usuário parado.
  - **Tela de contagem de segurança (30 s):** modal nativo em tela cheia com força G, velocidade e origem (sensor real vs. simulação), contagem regressiva de **30 segundos**, vibração de reforço a cada 5 s e dois caminhos — **"✅ ESTOU BEM"** (cancela na hora) ou **"🚨 ENVIAR SOS AGORA"** (antecipa o disparo). Ao esgotar o tempo sem resposta, o alerta é transmitido automaticamente e a tela muda para o estado "SOS ENVIADO", com botão **"Estou Seguro Agora"** que encerra o alerta no servidor.
  - **Servidor — rota pública autenticada por chave de aparelho:** `POST /api/emergency/crash` e `POST /api/emergency/crash/:id/cancel`. O sensor nativo dispara com o app em segundo plano e sem sessão carregada, então a autorização usa a chave `l360_...` (`x-device-key` + `authorizeDevice`, extraído de `routes/telemetry.ts` e agora exportado). Sem chave ou com chave errada → **401**; aparelho de outro usuário tentando cancelar → **403**; alerta inexistente → **404**; cancelamento repetido é idempotente.
  - **Modelo `SosEvent.type`** (`"SOS"` | `"CRASH"`, default `"SOS"`), aplicado com `prisma db push` — aditivo e retrocompatível. A criação do evento foi extraída para um helper compartilhado (`createEmergencyEvent`) entre o SOS manual e o acidente, preservando o fallback de "última posição conhecida" e a última bateria válida quando o corpo não traz coordenadas.
  - **Alerta diferenciado:** o WebSocket `SOS_ALERT` e o Web Push levam `type: 'CRASH'`, com título e corpo próprios ("🚗💥 DETECÇÃO DE ACIDENTE VEICULAR") em vez de reusar o texto de pânico manual. A mensagem final é composta **no servidor com o nome real do membro** do círculo — o app deliberadamente não envia `message`, para não vazar o identificador técnico do aparelho no alerta da família.
  - **Painel Web / PWA:** overlay de emergência em tela cheia passa a alternar entre os dois modos (sirene 🚨 / colisão 🚗💥, títulos e cores distintos), novo card de estatísticas com o campo **Tipo**, e o histórico de segurança marca os eventos de colisão com avatar vermelho, badge **"💥 Colisão Ativa"** e borda lateral de destaque. Bridge de entrada adicionada para o app sinalizar `NATIVE_CRASH_DETECTED` e `NATIVE_CRASH_SOS_SENT`. Cache PWA `life360-v28`.
  - **Teste no aparelho:** botão **"🧪 Simular Alerta de Acidente (Teste)"** nos ajustes do app dispara todo o fluxo (contagem de 15 s) sem precisar bater o carro, marcando o evento como `(Teste de simulação)` — útil para a família validar que o push chega em todos os celulares.
  - **Testes automatizados:** **52/52 asserções unitárias** na matemática de detecção (força G, gravidade, limiares por sensibilidade, filtro de velocidade, decisão combinada, mensagem e normalização de config, incluindo entradas inválidas) + **31/31 testes E2E HTTP** contra servidor real na porta 3099 (401 sem chave e com chave errada, 201 com chave correta, tipo `CRASH`, mensagem com G e km/h, fallback de coordenadas e bateria, 403 de aparelho alheio, 404, cancelamento idempotente pelo condutor, SOS manual preservado e histórico exigindo sessão).

- [x] **Etapa 9.4: "Atualizar agora" (forçar posição do aparelho em tempo real)**
  - **Servidor:** endpoints `POST /api/members/:id/request-update` e `POST /api/devices/:id/request-update`, broadcast via WebSocket `LOCATION_UPDATE_REQUEST` e disparo de Web Push VAPID direcionado.
  - **Interface Web:** novo botão de ação rápida "Atualizar Agora" com ícone animado e botão compacto no topo do perfil, estado de loading "Solicitando GPS...", timeout defensivo de 20s e resolução automática com feedback de sucesso (`🟢 Atualizado com precisão ±Xm`) no recebimento do WebSocket `LOCATION_UPDATE`.
  - **App Mobile / WebView Bridge:** canal bidirecional `ReactNativeWebView.postMessage({ type: 'FORCE_LOCATION_UPDATE' })` que aciona `forceImmediateLocationUpdate()` via `expo-location` em `Accuracy.Highest`, transmitindo telemetria imediata com bateria e coordenadas para a VPS.
  - **Estabilidade & Mobile UX (PWA `life360-v23`):** correção do botão de voltar para a lista (`btnBackToList` resiliente com limpeza de replay/markers), endurecimento contra expiração falsa de sessão (`apiFetch` não desloga em falhas pontuais e revalida via `/api/auth/me`), e contenção de layout dos botões e cards de estatísticas (`minmax(0, 1fr)`, ellipsis e grade 2x2 estável sem estouro).

- [x] **Etapa 9.5: Refinamentos de chat (reações e menções)**
  - **Modelo:** coluna `reactions` (JSON `{emoji: [userId]}`) em `CircleMessage` e `DirectMessage`, aplicada com `prisma db push` (aditiva e opcional, não quebra bancos existentes).
  - **Servidor:** `POST /api/messages/:id/react` e `POST /api/messages/direct/react/:id` com alternância (adiciona/remove), lista fechada de 8 emojis, verificação de participação na DM (403 para terceiros) e broadcast em tempo real `CHAT_REACTION` / `DM_REACTION`. Reações são devolvidas já desserializadas nos GETs.
  - **Menções:** `server/src/services/mentions.ts` resolve `@nome` por nome completo (mais longo primeiro, com limite de palavra e acento), ignora o próprio autor e dispara Web Push dedicado ao mencionado, tanto no círculo quanto nas DMs.
  - **Interface Web:** seletor flutuante de 8 emojis (botão ☺+ no balão ou toque longo no celular), pílulas de reação com contador e destaque das suas próprias reações, autocomplete `@nome` acima do campo de chat com avatar e inserção por clique, menções destacadas no texto e overrides completos de modo escuro. Cache PWA `life360-v24`.
  - **Correção de bateria:** o servidor agora preserva a última leitura conhecida quando um ponto de telemetria chega sem `battery` (ping web/GPS puro), `/api/members/live` busca até 10 registros por aparelho para resgatar a última bateria válida e o painel/lista exibem `--` em vez de `NaN%`. O envio via WebView também passou a incluir nível de bateria nativo (`navigator.getBattery`) e a ignorar leituras inválidas no app Expo.

- [x] **Etapa 9.6: Nota de direção histórica (CONCLUÍDO)**
  - **Servidor (`tripDetection.ts` e `routes/members.ts`):**
    - Novo endpoint `GET /api/members/:userId/driving-history?period=week|month&endDate=YYYY-MM-DD` com isolamento estrito de círculo (403 para terceiros, 401 para não-autenticados, 200 para membros do mesmo círculo).
    - Agregação por fuso horário local dos pontos de telemetria em baldes diários (`DrivingDaySummary`), com cálculo diário de distância, duração, velocidade máxima, velocidade média, excessos (>90 km/h), nota numérica (0-100) e classificação (Excelente/Bom/Atenção).
    - Métricas agregadas do período (`HistoricalDrivingSummary`): nota média real dos dias ativos, velocidade máxima absoluta, total de eventos de velocidade, total de km, horas dirigidas, dias ativos vs. dias totais e cálculo de tendência (`improving` 📈 / `stable` ➡️ / `declining` 📉).
    - Normalização robusta de unidades de velocidade (`extractSpeedKmH`) que valida leituras do GPS contra distâncias/tempos reais e evita a multiplicação duplicada de km/h por 3.6.
    - Correção na segmentação de viagens (`segmentPointsIntoTrips`): intervalos sem dados ou parados > 5 minutos agora fecham viagens confiavelmente, mesmo em gaps superiores a 1 hora ou entre dias diferentes.
  - **Interface Web / PWA:**
    - Abas de período no cabeçalho do relatório de direção: "Hoje", "Semana" (7 dias) e "Mês" (30 dias).
    - Painel Hero com anel circular de pontuação numérica (`XX/100`), classificação textual, pílula de tendência com ícone e rótulo do período.
    - Gráfico vetorial SVG responsivo de evolução (`viewBox="0 0 340 180"`) seguindo as diretrizes do skill `dataviz`: eixos com grade suave, barras com cantos arredondados coloridas por faixa de status (verde `#10B981`, âmbar `#F59E0B`, vermelho `#EF4444` e cinza fantasma para dias sem viagem), alternador de métrica entre "Pontuação" e "Quilômetros (km)", colunas invisíveis de toque/hover para dispositivos móveis e tooltip interativo flutuante.
    - Legenda com rótulos explicativos ("≥90 Excelente", "75-89 Bom", "<75 Atenção") e tabela de dados acessível alternativa ativada pelo botão "📋 Ver Tabela".
    - Overrides visuais completos em Modo Escuro (`[data-theme="dark"]`). Cache PWA atualizado para `life360-v25` (`sw.js` e `index.html`).
  - **Testes automatizados:** 54/54 asserções aprovadas cobrindo período semanal de 7 dias cronológicos, mensal de 30 dias, exclusão de dias fora da janela, cálculo de médias, notas diárias coerentes, isolamento de permissões 403/401/200, comportamento neutro para membros sem aparelho e compatibilidade com o relatório diário legado.
  - **Refinamentos pós-9.6 (PWA `life360-v26`, Velocidade, UI Mobile e Fuso Horário):**
    - **Barra superior no celular:** botão de enquadramento redundante (`#btnFitAll`) ocultado no mobile em favor do FAB do mapa (`#btnRecenterFab`), preservando o layout em uma linha única e blindando o nome do círculo com `text-overflow: ellipsis` sem sobreposição dos botões de ação ou SOS.
    - **Correção da velocidade (156 km/h):** reescrita da função `extractSpeedKmH` em `tripDetection.ts` e remoção da multiplicação duplicada no replay do `app.js`. Leituras reais do sensor em km/h agora são aceitas diretamente, impedindo que velocidades de 43-50 km/h fossem erroneamente multiplicadas por 3.6.
    - **Ícones reais do PWA e Web Push:** criação dos arquivos `icon-192.png` e `icon-512.png` em `server/public/`, correção do `manifest.json` para PNGs válidos e inclusão nos assets em cache do Service Worker, corrigindo o bloqueio silencioso de notificações push no Android Chrome.
    - **Fuso horário do servidor travado em Brasília:** injeção de `process.env.TZ = 'America/Sao_Paulo'` na inicialização de `server/src/index.ts` e no `deploy/ecosystem.config.cjs` (PM2), garantindo que agregações diárias e cortes de meia-noite batam exatamente com o horário de São Paulo mesmo em VPS com hora padrão UTC.

- [x] **Etapa 9.7: Recuperação de senha (CONCLUÍDO)**
  - **Modelo:** tabela `PasswordResetToken` (código único `REC-XXXX-XXXX` sem caracteres ambíguos, `expiresAt`, `usedAt` e `createdBy`), aplicada com `prisma db push` (aditiva e opcional, não quebra bancos existentes).
  - **Serviço (`server/src/services/passwordReset.ts`):** geração de código com `crypto.randomBytes` e alfabeto seguro, normalização tolerante a digitação (`rec-k7w2-9m4p`, `reck7w29m4p` e `REC K7W2 9M4P` viram `REC-K7W2-9M4P`), validade padrão de 30 minutos, uso único e invalidação automática do código pendente anterior ao gerar um novo.
  - **Permissões (`canUserManageReset`):** admin do sistema pode gerar para qualquer membro; admin de círculo apenas para membros do próprio círculo; membro comum recebe 403; ninguém sem sessão passa (401).
  - **Rotas (`routes/auth.ts`):** `POST /api/auth/generate-reset-code` (admin autenticado, isolamento por papel), `POST /api/auth/reset-password` (pública, valida código + expiração + uso único, aplica bcrypt, **revoga todas as sessões antigas** e já devolve sessão nova) e `POST /api/auth/forgot-password-request` (pública, resposta neutra para não enumerar e-mails, registra o código no log do servidor).
  - **Interface Web / PWA:** link "Esqueci minha senha" na tela de login com modo `reset` completo (e-mail + código + nova senha + confirmação), botão `🔑` em cada membro do modal do círculo (visível apenas para admins) e modal de código gerado com **Copiar Código** e **Copiar Mensagem para o WhatsApp** já formatada com validade e link do app. Cache PWA `life360-v27`.
  - **Ferramenta de emergência (CLI):** `npm run reset-password` (`server/scripts/reset-admin-password.ts`) lista as contas com acesso, permite redefinir direto (`npm run reset-password email NovaSenha123`) ou gerar código de uso único (`npm run reset-password email --code`) para quando o próprio admin estiver deslogado — sem SQL manual e sem SMTP.
  - **Testes automatizados:** 26/26 asserções de serviço aprovadas (formato e normalização do código, matriz de permissões admin/membro/terceiro, senha curta, código inválido, expirado e já consumido, invalidação do código anterior, revogação de sessão antiga e hash bcrypt) + 13/13 testes E2E HTTP contra servidor real na porta 3099 (login admin/membro, 403 para membro comum, 401 sem token, geração de código, rejeições 400, reset 200, login com senha antiga 401, login com senha nova 200, sessão antiga revogada e rota pública de esqueci a senha).

- [/] **BLOCO 10: O Toque Final de Paridade (Experiência 1:1 Life360)** — 10.1, 10.2 e 10.3 concluídas
  - [x] **Etapa 10.1: Alerta Automático de Bateria Fraca (< 15%) e Correção Visual do Marcador (CONCLUÍDO)**
    - **Correção da sobreposição do anel de bateria no mapa:** remoção da antiga pílula colada no canto inferior do avatar (`.avatar-battery-pill`) que cortava o traço circular do SVG e cobria o nome do membro. A porcentagem agora é exibida de forma limpa e integrada dentro da etiqueta de status inferior (`[ Wellington • 94% ]` ou `[ 🚗 45 km/h • 94% ]`), com cores adaptativas por faixa (verde $\ge 50\%$, amarelo $20\text{--}49\%$, vermelho $<20\%$) e suporte a modo escuro. O anel contorna o avatar com visibilidade 100% contínua e sem colisões. Cache PWA atualizado para `life360-v29`.
    - **Serviço de Alerta de Bateria (`server/src/services/batteryAlert.ts`):** monitoramento automático da telemetria recebida em `telemetry.ts`. Quando qualquer aparelho cai para $\le 15\%$ sem estar no carregador, o servidor dispara:
      - Notificação Web Push para todos os membros do círculo (excluindo o próprio usuário autor para não duplicar).
      - Evento WebSocket `BATTERY_LOW_ALERT` para clientes com o painel aberto (`"🪫 A bateria de Wellington está em 12%!"`).
    - **Mecanismo de Histerese e Anti-Spam:** cooldown de 4 horas entre alertas ordinários ($\le 15\%$), liberação antecipada para bateria crítica ($\le 5\%$) se já decorreram 30 minutos, e reset automático do cooldown quando a bateria é recarregada para $\ge 30\%$.
    - **Notificações Push Nativas no APK Android (`expo-notifications`):**
      - Integração nativa no app mobile Expo com canais Android dedicados (`default` e `emergency` com prioridade máxima e vibração).
      - Rota pública autenticada por chave de aparelho: `POST /api/push/register-device` permitindo ao APK registrar tokens `ExponentPushToken[...]` diretamente na VPS.
      - Suporte híbrido no servidor (`services/push.ts`): entrega automática tanto para Web Push VAPID (Chrome/PWA) quanto para Expo Push Service (`https://exp.host/--/api/v2/push/send`) para o APK nativo.
    - **Testes automatizados:** 7/7 asserções unitárias do motor de histerese de bateria aprovadas + 6/6 testes E2E aprovados contra servidor real na porta 3099 validando registro de push por chave de aparelho, 400/401 de segurança, persistência e upsert no SQLite.

  - [x] **Etapa 10.2: Frenagem e Aceleração Brusca no Cartão da Viagem (CONCLUÍDO)**
    - **Motor de detecção (`detectDrivingEvents` em `server/src/services/tripDetection.ts`):** analisa a derivada da velocidade entre pontos GPS consecutivos (janela válida de 0,8 s a 12 s).
      - **Frenagem brusca:** desaceleração $\le -11$ km/h/s, queda total $\ge 12$ km/h e velocidade anterior $\ge 20$ km/h.
      - **Arrancada rápida:** aceleração $\ge +10$ km/h/s, ganho total $\ge 12$ km/h e velocidade atingida $\ge 20$ km/h.
      - **Excesso de velocidade:** leitura $> 90$ km/h, agora com debounce de 25 s (antes contava cada ponto e inflava o total).
      - **Anti-duplicação:** debounce de 8 s por manobra, para que uma frenagem contínua de 3 s não vire 3 eventos.
      - **Filtro de pedestre:** manobras abaixo de 20 km/h são descartadas, evitando falso positivo de caminhada/corrida.
    - **Novo tipo `DrivingEvent`:** cada evento carrega `id`, `type` (`hard_brake` / `rapid_accel` / `speeding`), coordenadas, timestamp, velocidade, `deltaKmH`, `deltaSec`, `rateKmHPerSec` e uma descrição legível (`"Frenagem brusca: 65 → 25 km/h em 2.0s (-20.0 km/h/s)"`).
    - **Contadores por viagem e agregados:** `Trip` ganhou `hardBrakingEvents`, `rapidAccelEvents` e `events`; `TripSummary`, `DrivingDaySummary` e `HistoricalDrivingSummary` ganharam `totalHardBrakingEvents` / `totalRapidAccelEvents` e os equivalentes diários.
    - **Nota de direção reponderada (`calculateDrivingScore`):** $100 - \min(30, \text{excessos} \times 6) - \min(25, \text{frenagens} \times 5) - \min(15, \text{arrancadas} \times 3)$ menos a penalidade de velocidade máxima (30/20/12/5). O piso da classificação "Atenção" passou a considerar excessos + frenagens > 2.
    - **Interface Web / PWA:** painel de KPIs do relatório agora tem 6 cartões (Velocidade Máxima, Distância, Tempo em Movimento, Excesso de Velocidade, Frenagens Bruscas e Arrancadas Bruscas), com cor de alerta quando o valor é maior que zero.
    - **Cartão de viagem:** chips `🛑 N frenagens`, `🚀 N arrancadas`, `⚠️ N excessos` e, quando não há nenhum evento, o selo verde `🛡️ Suave`.
    - **Mapa do replay:** ao tocar numa viagem, cada evento vira um marcador circular colorido no trajeto (vermelho = frenagem, âmbar = arrancada, roxo = excesso) com tooltip mostrando a descrição e o horário; os marcadores são limpos ao fechar o replay/histórico.
    - **Tooltip do gráfico histórico:** passou a listar excessos, frenagens e arrancadas do dia.
    - **Cache PWA:** `life360-v30` (`style.css?v=30` / `app.js?v=30`).
    - **Testes automatizados:** 7/7 asserções unitárias (condução suave sem falso positivo, frenagem correta, arrancada correta, debounce, filtro de pedestre, nota ponderada e integração com a segmentação) + 16/16 asserções E2E contra servidor real na porta 3099 validando `/trips` e `/driving-history`.
    - **Não exige novo APK:** roda 100% no servidor e no PWA.

  - [x] **Etapa 10.3: Uso de celular ao volante (CONCLUÍDO)**
    - **Modelo:** tabela `PhoneUsageEvent` (`id`, `deviceId`, `startedAt`, `endedAt`, `durationSeconds`, `maxSpeedKmH`, `source`, `createdAt`), índices por `[deviceId, startedAt]` e `[startedAt]`, aplicada com `prisma db push`.
    - **Serviço (`server/src/services/phoneUsage.ts`):** validação de limites (duração mínima de 15 s, máxima de 4 h), velocidade mínima de trânsito $\ge 20$ km/h, deduplicação com tolerância a reenvio/overlap $\ge 70\%$ (409 idempotente sem alarme), busca por janela com cálculo de sobreposição proporcional (`sumPhoneUsageSeconds`), penalidade ponderada na nota de direção ($2,5$ pts/minuto com teto de 25 pts; qualquer minuto de celular já impede nota "Excelente" e $\ge 3$ min rebaixa diretamente para "Atenção").
    - **Rotas (`server/src/routes/phoneUsage.ts`):**
      - `POST /api/phone-usage/ingest`: pública por prefixo allowlist, autenticação híbrida por chave de aparelho (`l360_...`) ou Bearer token de sessão do usuário (PWA), validação defensiva de velocidade contra o relato e a última telemetria (422 se $< 20$ km/h).
      - `GET /api/phone-usage/:userId`: protegida por sessão com escopo de círculo, listagem de episódios para auditoria e transparência familiar.
    - **Integração com Viagens e Histórico (`tripDetection.ts` e `members.ts`):**
      - `/api/members/:userId/trips` e `/driving-history` cruzam a janela temporal de cada viagem com os episódios de celular registrados para os aparelhos do membro.
      - `Trip` ganhou `phoneUsageMinutes` e `phoneUsageEpisodes`.
      - `TripSummary`, `DrivingDaySummary` e `HistoricalDrivingSummary` ganharam `totalPhoneUsageMinutes` e `totalPhoneUsageEpisodes`.
    - **Interface Web / PWA (PWA `life360-v31`):**
      - Rastreador inteligente no cliente (`app.js`): detecta visibilidade da tela (`document.visibilityState === 'visible'`) e movimento acima de 20 km/h em aparelhos móveis (coarse pointer / UA mobile).
      - Batimentos a cada 60 s em viagens longas e descarga imediata no fechamento/troca de aba com `fetch(..., { keepalive: true })` em `visibilitychange` (ao apagar tela ou trocar de app) e `pagehide`.
      - Botão / toggle de controle do usuário no rodapé do perfil do membro: "📱 Celular ao volante: Medindo" / "📱 Celular ao volante: Pausado" com persistência em `localStorage` (`life360_phone_usage_enabled`).
      - KPI card no painel de direção: `📱 Celular ao Volante: N min` (destaque vermelho quando $> 0$).
      - Chip no cartão de viagem: `📱 N min celular` e linha informativa no tooltip do gráfico de evolução histórica.
      - Limitação honesta documentada: PWA/WebView só consegue medir a tela ativa de sua própria aplicação; detectar outros apps em segundo plano exigiria permissão nativa Android `PACKAGE_USAGE_STATS` (registrada como parcial no relatório de paridade).
    - **Cache PWA:** atualizado para `life360-v31` (`sw.js`, `style.css?v=31` e `app.js?v=31`).
    - **Testes automatizados:** 14/14 testes unitários de motor de cálculo e overlap + 17/17 testes E2E aprovados contra servidor real na porta 3099 validando autenticação por chave/Bearer, bloqueio 422 em baixa velocidade, deduplicação 409, agregação no `/trips` e no `/driving-history`.
    - **Não exige novo APK:** roda 100% no servidor e no PWA/WebView.

  - [x] **Refinamento Crítico: Correção do Anel de Bateria (sempre 100%) e Separação da Tag de Lugar no Mapa (CONCLUÍDO)**
    - **Diagnóstico e Correção da Bateria:**
      - O marcador no mapa utilizava `batt = rawBatt !== undefined && rawBatt !== null ? Math.round(rawBatt) : 100;`, forçando o anel circular SVG a renderizar 100% verde preenchido para qualquer membro sem leitura de bateria ou antes do envio de telemetria.
      - A lógica agora diferencia formalmente dados ausentes (`hasBattery = false`): o anel SVG de preenchimento (`.battery-fill`) não é desenhado, mantendo apenas o contorno neutro (`.battery-track`), eliminando a falsa indicação de 100%.
      - Suporte e normalização automática para leituras em escala decimal 0..1 (ex: `0.85` vira `85%`) no servidor (`routes/telemetry.ts` e `services/telemetry.ts`), no app mobile (`locationTask.ts` e `crashDetection.ts`) e no frontend (`app.js`), além de suportar os parâmetros `batt` e `battery` do Traccar Client.
      - Remoção do fallback falso `battery: 95` em `getCurrentUser()`.
    - **Separação da Tag de Lugar e Marcador do Membro:**
      - A pílula de lugar (`.place-floating-pill`, ex: "🏡 Casa") era renderizada exatamente no centro da cerca virtual `[place.latitude, place.longitude]`, colidindo pixel a pixel com a etiqueta de status do membro que está no local.
      - A pílula de lugar foi reposicionada na borda norte da cerca virtual (`place.latitude + radiusMeters / 111320`), com âncora inferior e `zIndexOffset: -100`.
      - Agora a pílula do lugar coroa a parte superior da cerca tracejada, deixando todo o interior livre e legível para os avatares dos membros, sem sobreposição nem conflito de cliques.
    - **Cache PWA:** atualizado para `life360-v32` (`sw.js`, `style.css?v=32` e `app.js?v=32`).
    - **Testes automatizados:** normalização e ingestão validadas via script de teste no banco real.

  - [x] **Refinamento Crítico: Precisão do Cálculo de Viagens Individuais e Tempo em Movimento (CONCLUÍDO)**
    - **Diagnóstico e Correção de Segmentação:**
      - A quebra de viagem exigia 5 minutos (300 s) de inatividade e absorvia paradas de até 3 minutos (180 s), fundindo saídas distintas separadas por 1 ou 2 minutos em um único cartão de viagem com tempo artificialmente comprimido.
      - Ponto de partida falso corrigido: o algoritmo puxava cegamente o ponto anterior `sorted[i - 1]` mesmo se registrado horas ou anos atrás (ex: timestamp 1970 do Epoch), o que gerava durações absurdas de 29 milhões de minutos. Agora só anexa o ponto parado anterior se registrado há menos de 60 s.
      - Limiar de encerramento por parada estacionária ajustado para 60 s (1 min) e gap de desconexão para 120 s, permitindo absorver semáforos comuns (≤ 60 s) sem misturar deslocamentos diferentes.
    - **Duração Líquida em Movimento e Salvaguarda Física da Velocidade Média:**
      - Desconto do tempo parado: a duração da viagem agora calcula o tempo líquido efetivo em movimento (`movingSeconds`), eliminando o tempo ocioso estacionado no semáforo ou no embarque.
      - Fim do piso artificial de 1 minuto: viagens curtas e deslocamentos rápidos registram durações subminuto em segundos (ex: `12 s`, `45 s`), formatadas dinamicamente no PWA (`formatTripDuration`).
      - A velocidade média agora divide os quilômetros pelas horas reais (com base em segundos) e possui trava física: `avgSpeed = Math.min(avgSpeed, maxSpeed)`, impedindo velocidades médias matematicamente impossíveis superiores à velocidade máxima.
      - Rótulo e indicador "Tempo em Movimento" no topo do relatório agora exibem a formatação dinâmica adequada (`formatTripDuration`), suportando segundos, minutos e formato hora/minuto (`1h 15min`).
    - **Cache PWA:** atualizado para `life360-v33` (`sw.js`, `style.css?v=33` e `app.js?v=33`).
    - **Testes automatizados:** bateria de testes unitários e com dados reais aprovada (`test_trip_precision_e2e.ts`).

  - [ ] **Etapa 10.4: Notificação Push de Resumo Semanal de Direção (Life360 oficial)**
    - Agendador semanal (`server/src/services/weeklySummaryScheduler.ts`) para envio automático todo domingo à noite (ex: 20h) para os membros do círculo.
    - Resumo consolidado de cada membro: km rodados, tempo de volante, nota de direção média, frenagens, arrancadas e uso de celular.
    - Rota manual `POST /api/driving/send-weekly-summary` para teste e disparo imediato sem esperar domingo. Entrega híbrida (Web Push VAPID + Expo Push APK).

  - [ ] **Etapa 10.5: Detecção de Curvas Bruscas por GPS (Hard Cornering)**
    - Terceira manobra veicular do Life360 Gold (junto a frenagem e aceleração).
    - Análise da variação angular do GPS (`heading` / $\Delta\theta$) entre pontos consecutivos com velocidade $\ge 25\text{ km/h}$ e taxa $\ge 20^\circ/\text{s}$ ou giro $\ge 35^\circ$.
    - Evento `hard_cornering` em `DrivingEvent`, marcadores no mapa do replay (cor amarelo/âmbar), chip no cartão da viagem e reponderação na nota de direção.

  - [ ] **Etapa 10.6: Linha do Tempo Contínua: Viagens + Paradas (Stay Timeline)**
    - Replicar a linha do tempo completa do Life360 oficial, intercalando deslocamentos e períodos estáticos onde o membro permaneceu parado:
      - *"🏡 Ficou em Casa por 4h 15min (08:30 às 12:45)"*
      - *"🚗 Viagem de 18 min até Trabalho (12:45 às 13:03 • 8,4 km • Nota 98)"*
      - *"💼 Permaneceu no Trabalho por 5h 20min (13:03 às 18:23)"*
    - Associação automática com cercas cadastradas (`Place`) ou geocoding reverso (`GeocodingCache`) e interface integrada no PWA.

  - Descartados / Fora de escopo pelo usuário:
    - **Inicialização automática no Boot do Android (`RECEIVE_BOOT_COMPLETED`)**: descartado pelo usuário em 29/10/2026.
    - **Seletor de múltiplos círculos no topo**: descartado pelo usuário (foco em círculo único familiar exclusivo).

---

### Como retomar (checklist para qualquer IA)

1. Ler `ROADMAP_MODULAR.md` (este arquivo) e `FEATURE_PARITY.md`.
2. `cd server && npm run build` para confirmar que o último commit compila.
3. Para testar: subir `$env:PORT='3099'; node dist/index.js` em background e rodar um script `tsx` descartável contra `http://127.0.0.1:3099` (**não** tentar spawnar o servidor de dentro do `tsx` — não funciona nesta máquina). Apagar o script depois.
4. Bump do cache PWA (`sw.js` `CACHE_NAME` + `?v=N` em `index.html`) a cada etapa com mudança de frontend.
5. Fechar a etapa: atualizar `ROADMAP_MODULAR.md` + `FEATURE_PARITY.md` + memória, commit e push.
