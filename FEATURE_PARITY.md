# Auditoria de Paridade — My Life360 × Life360 Oficial

> **REGRA DO PROJETO:** este arquivo é a fonte de verdade sobre o que já existe no nosso app comparado ao Life360 oficial.
> Toda vez que alguém pedir "temos tudo que o Life360 tem?", **conferir o código e testar** antes de responder — e atualizar esta tabela.
> Nunca declarar paridade total sem ter verificado item por item.

**Legenda:** ✅ implementado e funcionando · ⚠️ parcial / simplificado · ❌ ausente · 🚫 depende de terceiro (impossível auto-hospedar)

*Última auditoria: 2026-10-29 — Correção de paridade visual: anel de bateria agora só preenche com dados válidos (sem forçar 100% verde falso), suporte a escala decimal e tag de lugar posicionada na borda norte sem colidir com avatares (PWA v32). Etapa 10.3 concluída (celular ao volante). Bloco 10 em andamento.*

---

## Mapa e Localização

| Recurso do Life360 | Status | Observação |
|---|---|---|
| Mapa ao vivo com todos os membros | ✅ | Leaflet + WebSocket em tempo real |
| Estilos de mapa (claro, satélite, escuro) | ✅ | CARTO Voyager / Esri Imagery / CARTO Dark |
| Avatar do membro no mapa | ✅ | Iniciais coloridas ou foto real do membro via upload (@fastify/multipart) e preview dinâmico (Etapa 8.7) |
| Anel circular de bateria | ✅ | SVG dinâmico contínuo sem cortes; preenchimento apenas com leitura real (sem forçar 100% verde falso quando nulo), suporte a escala decimal e porcentagem integrada na etiqueta inferior (Etapa 10.1 / PWA v32) |
| **Alerta de bateria fraca (< 15%)** | ✅ | Monitoramento em telemetria com histerese (cooldown 4h, reset aos 30%), push para todo o círculo e aviso WebSocket em tempo real (Etapa 10.1) |
| Status de carregamento (⚡) | ✅ | Indicador animado no anel e ícone ⚡ no status |
| Velocidade / "em trânsito" | ✅ | Tag `🚗 km/h` acima de 5 km/h |
| Precisão do GPS | ✅ | Círculo de acurácia + stat no painel |
| **Endereço do local atual** | ✅ | Nominatim/OSM com cache SQLite (`GeocodingCache`) e detecção de cerca |
| **"Atualizar agora" (forçar posição)** | ✅ | WebSocket + Push VAPID + WebView Bridge disparando GPS de alta precisão em tempo real (Etapa 9.4) |
| Enquadrar todos na tela | ✅ | Botão flutuante |
| "Como Chegar" / navegação | ✅ | Deep link Google Maps |
| Histórico de localização | ✅ | **Ilimitado**, sem retenção |
| Seletor de data do histórico | ✅ | `?from=&to=` |
| Rastro do trajeto no mapa | ✅ | Polyline |
| Replay do trajeto | ✅ | Scrubber + 1x/2x/4x |

## Lugares e Cercas Virtuais

| Recurso do Life360 | Status | Observação |
|---|---|---|
| Criar lugares | ✅ | Com ícone e cor |
| **Lugares ilimitados** | ✅ | Recurso Platinum liberado |
| Cercas visíveis no mapa | ✅ | Círculo tracejado + pílula posicionada na borda norte para não sobrepor avatares dos membros (PWA v32) |
| Excluir lugar | ✅ | No chip e na API |
| Alertas de ENTER/EXIT | ✅ | Motor com histerese (Bloco 3) |
| Timeline de alertas de lugares | ✅ | Últimas 30 entradas/saídas |
| Toast em tempo real ao entrar/sair | ✅ | Via WebSocket |
| **Push notification com app fechado** | ✅ | Web Push VAPID ativo via Service Worker em segundo plano (Etapa 8.5) |
| **Editar lugar existente** | ✅ | `PUT /api/places/:id`, botão ✏️ no chip e clique no marcador do mapa |

## Círculo Familiar e Comunicação

| Recurso do Life360 | Status | Observação |
|---|---|---|
| Lista de membros com status | ✅ | |
| Chat do círculo | ✅ | Tempo real via WS, histórico em banco |
| Check-in ("estou seguro") | ✅ | Topo da tela e menu do círculo |
| Código de convite | ✅ | Modelos `Circle` e `CircleMember` no SQLite, códigos `FAM-XXXX-XXXX` sem ambiguidade, validação na API, regeneração por admin e tela de entrada por convite (Etapa 9.1) |
| **Personalizar / editar nome do círculo** | ✅ | `PUT /api/circle/name` com campo de edição no modal do círculo para admins e atualização em tempo real no topo |
| **Tema Escuro (Dark Mode)** | ✅ | Alternador no topo e menu, tokens CSS dedicados `:root[data-theme="dark"]`, overrides completos em painéis/modais, desacoplado dos tiles do mapa (mantém contraste ideal) e cache PWA `life360-v20` |
| **Adicionar/remover membros de verdade** | ✅ | Cadastro com código via `/api/auth/register-with-invite`, entrada via `/api/circle/join`, remoção de membros por admin via `DELETE /api/circle/members/:id`, listagem com badges de papel no modal e isolamento completo por círculo em `/api/members/live` (Etapa 9.1) |
| **Editar perfil / foto do membro** | ✅ | Modal com edição de nome, telefone, cor do marcador e upload de foto real (@fastify/multipart) com remoção e preview dinâmico (Etapa 8.7) |
| **Mensagem direta 1:1** | ✅ | Tabela `DirectMessage`, rotas `/api/messages/direct/:otherUserId` e `/unread`, abas de canais no chat, avisos em tempo real via WebSocket, notificações push Web e botão de acesso rápido no perfil (Etapa 8.8) |
| **Reações / curtir mensagens** | ✅ | Coluna `reactions` (JSON) em `CircleMessage` e `DirectMessage`, rotas `POST /api/messages/:id/react` e `POST /api/messages/direct/react/:id`, seletor de 8 emojis (toque longo no balão ou botão ☺+), contagem por emoji e sincronização em tempo real via WS `CHAT_REACTION` / `DM_REACTION` (Etapa 9.5) |
| **Menções e notificações de chat** | ✅ | Autocomplete `@nome` no campo de chat, destaque visual da menção no balão, resolução por nome completo com limites de palavra (`server/src/services/mentions.ts`) e Web Push dedicado aos membros mencionados, inclusive em mensagens diretas (Etapa 9.5) |

## Segurança e Emergência

| Recurso do Life360 | Status | Observação |
|---|---|---|
| Botão de pânico SOS | ✅ | Contagem de 5s + cancelamento |
| Alerta em tela cheia para o círculo | ✅ | Via WebSocket |
| Rota imediata para o membro em SOS | ✅ | Google Maps |
| **Histórico de alertas SOS** | ✅ | Tabela `SosEvent`, status ACTIVE/RESOLVED/CANCELED, resolução com timestamp e nome do membro, filtros de status, botão 'Ver no Mapa' e 'Marcar como Seguro' (Etapa 8.6) |
| **Detecção de acidente real** | ✅ | `expo-sensors` no app mobile com magnitude vetorial em Gs, 3 níveis de sensibilidade (2.5G / 3.0G / 3.8G), filtro de velocidade mínima (>20 km/h) contra falso positivo, cooldown de 45 s, contagem de segurança de 30 s com "Estou Bem" ou envio imediato, rota pública `POST /api/emergency/crash` autenticada pela chave do aparelho (o sensor dispara sem sessão carregada), alerta distinguido por `type: 'CRASH'` no WebSocket e no push, histórico com badge próprio e botão de simulação para teste (Etapa 9.3) |
| **Frenagem/aceleração brusca** | ✅ | Derivada de velocidade entre pontos GPS consecutivos: frenagem $\le -11$ km/h/s com queda $\ge 12$ km/h e arrancada $\ge +10$ km/h/s com ganho $\ge 12$ km/h (ambas acima de 20 km/h), debounce de 8 s por manobra e filtro anti-pedestre. Eventos geolocalizados plotados no mapa do replay, chips no cartão da viagem e nota de direção reponderada (Etapa 10.2) |
| **Despacho para polícia/SAMU** | 🚫 | Serviço de monitoramento pago |
| **Proteção contra roubo de identidade** | 🚫 | Serviço de parceiro comercial |

## Direção (Driving Report)

| Recurso do Life360 | Status | Observação |
|---|---|---|
| Relatório de direção | ✅ | Recurso Gold liberado |
| Velocidade máxima | ✅ | |
| Distância percorrida | ✅ | Haversine |
| Tempo em movimento | ✅ | Calculado com precisão pela soma da duração das viagens individuais |
| Eventos de excesso de velocidade | ✅ | Acima de 90 km/h, com debounce de 25 s para contar episódios e não pontos (Etapa 10.2) |
| **Frenagem brusca no trajeto** | ✅ | Detectada por desaceleração (≤ -11 km/h/s), com marcador vermelho no mapa do replay, contador no KPI e chip no cartão da viagem (Etapa 10.2) |
| **Aceleração brusca no trajeto** | ✅ | Detectada por aceleração (≥ +10 km/h/s), com marcador âmbar no mapa, contador no KPI e chip no cartão (Etapa 10.2) |
| **Uso de celular ao volante** | ⚠️ parcial | Tela ativa com velocidade > 20 km/h registrada no PWA/WebView com `keepalive`, chip no cartão da viagem, card de KPI e penalidade na nota. Uso de outros apps em segundo plano exigiria permissão nativa `PACKAGE_USAGE_STATS` (Etapa 10.3) |
| Nota de direção (Excelente/Bom/Atenção) | ✅ | Ponderada por excesso de velocidade, frenagens, arrancadas bruscas, uso de celular ao volante e pico de velocidade (Etapa 10.3) |
| **Detalhamento por viagem individual** | ✅ | Segmentação por tempo de parada (>5 min) e deslocamento; cards individuais com horário, duração, trajeto (lugares/endereços), distância, velocidade e replay de trecho (Etapa 8.4) |
| **Score semanal/mensal histórico** | ✅ | Agregação semanal (7 dias) e mensal (30 dias) via `GET /api/members/:id/driving-history`, gráfico SVG responsivo com alternador pontuação/km, colunas interativas de toque e tooltip, indicador de tendência (Melhorando/Estável/Em queda), tabela acessível e isolamento por círculo (Etapa 9.6) |

## Conta, Segurança e Infraestrutura

| Recurso | Status | Observação |
|---|---|---|
| PWA instalável no celular | ✅ | manifest + service worker |
| **App nativo Android (.APK) instalável** | ✅ | React Native/Expo SDK 51, visual oficial roxo `#762EEB`, rastreamento contínuo em 2º plano (Foreground Service), Doze protection, telemetria segura e build via EAS (`eas.json`) |
| Mapa funciona offline (cache de assets) | ⚠️ | Assets em cache; tiles dependem de rede |
| **Autenticação / login** | ✅ | E-mail + senha (bcrypt), sessões revogáveis de 30 dias, `/api/*` e `/ws` protegidos |
| **Permissões por papel (admin/membro)** | ✅ | `role` no `User`; rotas `/api/admin/*` (backup e auditoria) devolvem 403 para membros comuns. Ainda não há papéis intermediários além de admin/membro |
| **HTTPS / túnel seguro** | ✅ | Cloudflare Tunnel em produção (`life360.housecloud.tec.br`) sem portas públicas abertas |
| **Backup automático do banco** | ✅ | WAL checkpoint + cópia com fallback `VACUUM INTO`, verificação de cabeçalho, retenção de 14 dias, agendador de 24 h e botão de backup manual no painel (Etapa 8.9) |
| **Notificações push (Híbrido)** | ✅ | Web Push W3C (VAPID) no navegador/PWA + Expo Push Service nativo com canais Android de alta prioridade no APK móvel (Etapa 10.1) |
| **Auditoria / log de acessos** | ✅ | Modelo `AccessLog` + hook `onResponse`: usuário, método, rota, status, IP, user-agent e duração; retenção de 30 dias; visualizador com resumo de 24 h e filtro de erros (Etapa 8.9) |
| **Ingestão de telemetria autenticada** | ✅ | Chave por aparelho (`l360_...`) validada com `timingSafeEqual`, aceita por header, query ou corpo; rotação de chave revoga a anterior na hora; `TELEMETRY_REQUIRE_KEY=false` só como escape consciente (Etapa 8.9) |
| **Recuperação de senha** | ✅ | Código temporário de uso único (`REC-XXXX-XXXX`, 30 min) gerado por admin no modal do círculo com cópia para WhatsApp, tela "Esqueci minha senha" no PWA, revogação de sessões antigas e CLI de emergência na VPS sem depender de SMTP (Etapa 9.7) |
| **Gestão de aparelhos pelo painel** | ✅ | Modal "📱 Dispositivos Conectados": cadastro, chave mascarada com revelar/copiar, status online, rotacionar chave e excluir (Etapa 8.9) |

---

## Resumo executivo

- **Pronto (pode usar hoje):** mapa ao vivo, cercas, alertas, histórico ilimitado, replay, relatório de direção com viagens, frenagem brusca e arrancada rápida geolocalizadas e nota histórica semanal/mensal com gráfico de evolução, push notifications em segundo plano, SOS com histórico persistido e resolução, **detecção de acidente veicular por acelerômetro com contagem de segurança de 30 s e disparo automático do SOS**, perfil de membro com upload de foto real, chat coletivo do círculo com reações/menções e mensagens diretas 1:1 privadas com notificações, check-in, lugares ilimitados, estilos de mapa, modo escuro, entrada e gestão de membros por código de convite, recuperação de senha por código único gerado por admin ou CLI, VPS Oracle em produção via Cloudflare Tunnel e app nativo Android (.APK) compilado.
- **Lacunas visíveis ao usuário:** nenhuma bloqueante para o uso diário da família (redefinição de senha plenamente suportada via admin/WhatsApp ou CLI; detecção de acidente ativa com o app em execução).
- **Resolvido nas últimas etapas:** Etapa 10.1 (alerta de bateria fraca com histerese, anel de bateria limpo e push nativo no APK), Etapa 10.2 (frenagem brusca e arrancada rápida com eventos geolocalizados no mapa do replay e nota de direção reponderada) e Etapa 10.3 (uso de celular ao volante medido em trânsito com keepalive, KPI dedicado, chip na viagem e penalidade ponderada no score; PWA v31); Bloco 9 avançado com convite real por código e isolamento por círculo (9.1), deploy na VPS Oracle com Cloudflare Tunnel e app mobile Expo (.APK) com foreground service (9.2), recurso "Atualizar agora" com bridge WebView nativa e tolerância a falhas na sessão (9.4), reações emoji e menções `@nome` com push dedicado (9.5), nota de direção histórica semanal e mensal com gráfico SVG de evolução diária (9.6), recuperação de senha sem SMTP com código temporário e CLI de emergência (9.7) e detecção de acidente real por acelerômetro com rota pública autenticada por chave de aparelho (9.3) — **Bloco 9 concluído**.
- **Lacunas de plataforma restantes:** envio automático de e-mail opcional (hoje suprido com total independência por código único e WhatsApp); sensor de colisão com o app totalmente encerrado pelo usuário exigiria um serviço nativo dedicado (hoje a escuta vale com o app vivo ou em segundo plano).
- **Impossível sem parceiro comercial:** despacho de emergência, monitoramento 24h, proteção de identidade.
- **Depende de hardware (app mobile):** classificação fina de manobras por giroscópio (curvas acentuadas, derrapagem) — a frenagem/arrancada brusca por GPS e a detecção de colisão por acelerômetro já estão implementadas (Etapas 10.2 e 9.3).
