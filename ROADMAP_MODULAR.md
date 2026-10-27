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
- [/] **Status:** EM ANDAMENTO (Etapa 8.1 concluída — Próxima: Etapa 8.2)
- **Objetivo:** Fechar as lacunas de paridade real com o Life360 oficial e tornar o app seguro para produção e uso diário da família.
- **Referência obrigatória:** [`FEATURE_PARITY.md`](FEATURE_PARITY.md) — auditoria item por item (fonte de verdade).

### Sub-etapas estruturadas (executar em ordem ao retomar):

- [x] **Etapa 8.1: Autenticação e Sessão (CRÍTICO - CONCLUÍDO)**
  - Senha com bcrypt, sessões revogáveis de 30 dias em SQLite (`AuthSession`), hook Fastify global bloqueando `/api/*`, `/ws` protegido com token na query string. Tela de primeiro acesso para criar admin. Commit `60038cf`.

- [ ] **Etapa 8.2: Endereço Legível (Reverse Geocoding - PRÓXIMA)**
  - **Objetivo:** Substituir as coordenadas brutas no card pelo endereço real (*ex: "Av. Paulista, 1000 - Bela Vista"*).
  - **Arquivos:** `server/src/services/geocoding.ts` (integração Nominatim/OSM com cache em SQLite para não estourar rate limit) + endpoint `GET /api/geocoding/reverse?lat=&lon=` + atualização no `app.js` no card do membro selecionado.
  - **Critério de conclusão:** Membro parado mostra rua/bairro em vez de latitude/longitude.

- [ ] **Etapa 8.3: Edição de Lugares (Places)**
  - **Objetivo:** Permitir editar nome, raio e ícone de uma cerca existente sem precisar excluir e recriar.
  - **Arquivos:** `server/src/routes/places.ts` (`PUT /api/places/:id`) + botão de lápis no card/chip do lugar no painel + reaproveitamento do modal existente.
  - **Critério de conclusão:** Editar raio de 100m para 250m atualiza imediatamente no mapa e no banco.

- [ ] **Etapa 8.4: Relatório de Direção Segmentado por Viagem (Life360 Gold)**
  - **Objetivo:** Em vez de só um resumo do dia todo, dividir os pontos em viagens individuais (viagem = início em movimento após >10 min parado até parada >10 min).
  - **Arquivos:** `server/src/services/tripDetection.ts` + aba "Viagens" no painel de direção com horário, distância percorrida, velocidade máxima e eventos.
  - **Critério de conclusão:** Histórico do dia lista cards individuais clicáveis de cada viagem feita.

- [ ] **Etapa 8.5: Notificações Push Web (VAPID / Web Push)**
  - **Objetivo:** Tocar notificação no celular mesmo com o navegador fechado quando alguém chega/sai de um lugar ou aciona SOS.
  - **Arquivos:** `web-push` no servidor + `POST /api/push/subscribe` + `sw.js` ouvindo evento `push` e mostrando notificação nativa do sistema operacional.
  - **Critério de conclusão:** Evento de ENTER/EXIT dispara notificação no celular com o app em segundo plano.

- [ ] **Etapa 8.6: Histórico Persistido de SOS**
  - **Objetivo:** Registrar ocorrências de SOS em tabela dedicada no banco (`SosEvent`), com status (ativo/resolvido) e linha do tempo de resolução.
  - **Arquivos:** `schema.prisma` (`SosEvent`), `server/src/routes/emergency.ts` (`GET/POST/PUT /api/emergency/sos`).
  - **Critério de conclusão:** Aba de histórico de segurança lista os alertas passados com data e quem disparou.

- [ ] **Etapa 8.7: Perfil de Membro & Upload de Foto Real**
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
