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

## BLOCO 8: Paridade Total & Segurança de Produção (Próxima Fase)
- [/] **Status:** EM ANDAMENTO (Etapa 8.1 — Autenticação concluída)
- **Objetivo:** Fechar as lacunas de paridade real com o Life360 oficial e tornar o app seguro para exposição na internet.
- **Referência obrigatória:** [`FEATURE_PARITY.md`](FEATURE_PARITY.md) — auditoria item por item (fonte de verdade).
- **Entregáveis prioritários:**
  - [x] **Autenticação e sessão (CRÍTICO):** login por e-mail/senha com bcrypt, sessões revogáveis de 30 dias em banco, `onRequest` global protegendo `/api/*` e validação de token no `/ws`. Tela de configuração inicial cria o administrador no primeiro acesso. Telemetria mantida pública para o Traccar Client.
  - [ ] **Notificações push (VAPID):** alertar chegada/saída, SOS e chat com o app fechado.
  - [ ] **Reverse geocoding:** exibir endereço do local atual (Nominatim/OSM, com cache).
  - [ ] **Editar lugar:** endpoint `PUT /api/places/:id` + formulário reaproveitando o modal existente.
  - [ ] **Histórico de SOS:** persistir disparos em banco e listar no painel.
  - [ ] **Relatório por viagem:** segmentar o histórico em viagens com horário, distância e nota.
  - [ ] **Perfil de membro:** upload de avatar e edição de nome/cor.
  - [ ] **Mensagem direta 1:1** no chat do círculo.
  - [ ] **Backup automático do SQLite** (rotina diária com retenção).
  - [ ] **Detecção de acidente no app mobile:** usar acelerômetro via `expo-sensors` e disparar o evento `CRASH_DETECTED`.
- **Fora de escopo (não replicável):** despacho para serviços de emergência, monitoramento 24h e proteção contra roubo de identidade (serviços de parceiros comerciais).
- **Critério de Conclusão:** `FEATURE_PARITY.md` sem nenhum item ❌ na categoria "Conta, Segurança e Infraestrutura", e todas as lacunas visíveis ao usuário resolvidas ou explicitamente aceitas.
