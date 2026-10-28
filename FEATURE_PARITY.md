# Auditoria de Paridade — My Life360 × Life360 Oficial

> **REGRA DO PROJETO:** este arquivo é a fonte de verdade sobre o que já existe no nosso app comparado ao Life360 oficial.
> Toda vez que alguém pedir "temos tudo que o Life360 tem?", **conferir o código e testar** antes de responder — e atualizar esta tabela.
> Nunca declarar paridade total sem ter verificado item por item.

**Legenda:** ✅ implementado e funcionando · ⚠️ parcial / simplificado · ❌ ausente · 🚫 depende de terceiro (impossível auto-hospedar)

*Última auditoria: 2026-10-28 — Círculo Real e Convites por Código concluídos: modelos Circle/CircleMember, cadastro por convite, remoção de membros e isolamento por círculo (Bloco 9, etapa 1)*

---

## Mapa e Localização

| Recurso do Life360 | Status | Observação |
|---|---|---|
| Mapa ao vivo com todos os membros | ✅ | Leaflet + WebSocket em tempo real |
| Estilos de mapa (claro, satélite, escuro) | ✅ | CARTO Voyager / Esri Imagery / CARTO Dark |
| Avatar do membro no mapa | ✅ | Iniciais coloridas ou foto real do membro via upload (@fastify/multipart) e preview dinâmico (Etapa 8.7) |
| Anel circular de bateria | ✅ | SVG dinâmico verde/laranja/vermelho |
| Status de carregamento (⚡) | ✅ | |
| Velocidade / "em trânsito" | ✅ | Tag `🚗 km/h` acima de 5 km/h |
| Precisão do GPS | ✅ | Círculo de acurácia + stat no painel |
| **Endereço do local atual** | ✅ | Nominatim/OSM com cache SQLite (`GeocodingCache`) e detecção de cerca |
| **"Atualizar agora" (forçar posição)** | ❌ | Depende de comando remoto ao aparelho |
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
| Cercas visíveis no mapa | ✅ | Círculo tracejado + pílula |
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
| **Adicionar/remover membros de verdade** | ✅ | Cadastro com código via `/api/auth/register-with-invite`, entrada via `/api/circle/join`, remoção de membros por admin via `DELETE /api/circle/members/:id`, listagem com badges de papel no modal e isolamento completo por círculo em `/api/members/live` (Etapa 9.1) |
| **Editar perfil / foto do membro** | ✅ | Modal com edição de nome, telefone, cor do marcador e upload de foto real (@fastify/multipart) com remoção e preview dinâmico (Etapa 8.7) |
| **Mensagem direta 1:1** | ✅ | Tabela `DirectMessage`, rotas `/api/messages/direct/:otherUserId` e `/unread`, abas de canais no chat, avisos em tempo real via WebSocket, notificações push Web e botão de acesso rápido no perfil (Etapa 8.8) |
| **Reações / curtir mensagens** | ❌ | |
| **Menções e notificações de chat** | ⚠️ | Notificações push automáticas para DMs no celular com app fechado via Web Push; menções (@nome) ainda ausentes |

## Segurança e Emergência

| Recurso do Life360 | Status | Observação |
|---|---|---|
| Botão de pânico SOS | ✅ | Contagem de 5s + cancelamento |
| Alerta em tela cheia para o círculo | ✅ | Via WebSocket |
| Rota imediata para o membro em SOS | ✅ | Google Maps |
| **Histórico de alertas SOS** | ✅ | Tabela `SosEvent`, status ACTIVE/RESOLVED/CANCELED, resolução com timestamp e nome do membro, filtros de status, botão 'Ver no Mapa' e 'Marcar como Seguro' (Etapa 8.6) |
| **Detecção de acidente real** | ⚠️ | Existe apenas o selo visual; requer acelerômetro no app mobile |
| **Frenagem/aceleração brusca** | ❌ | Requer acelerômetro |
| **Despacho para polícia/SAMU** | 🚫 | Serviço de monitoramento pago |
| **Proteção contra roubo de identidade** | 🚫 | Serviço de parceiro comercial |

## Direção (Driving Report)

| Recurso do Life360 | Status | Observação |
|---|---|---|
| Relatório de direção | ✅ | Recurso Gold liberado |
| Velocidade máxima | ✅ | |
| Distância percorrida | ✅ | Haversine |
| Tempo em movimento | ✅ | Calculado com precisão pela soma da duração das viagens individuais |
| Eventos de excesso de velocidade | ✅ | Acima de 90 km/h |
| Nota de direção (Excelente/Bom/Atenção) | ✅ | Baseada em excessos e picos de velocidade |
| **Detalhamento por viagem individual** | ✅ | Segmentação por tempo de parada (>5 min) e deslocamento; cards individuais com horário, duração, trajeto (lugares/endereços), distância, velocidade e replay de trecho (Etapa 8.4) |
| **Score semanal/mensal histórico** | ❌ | Só o período consultado |

## Conta, Segurança e Infraestrutura

| Recurso | Status | Observação |
|---|---|---|
| PWA instalável no celular | ✅ | manifest + service worker |
| Mapa funciona offline (cache de assets) | ⚠️ | Assets em cache; tiles dependem de rede |
| **Autenticação / login** | ✅ | E-mail + senha (bcrypt), sessões revogáveis de 30 dias, `/api/*` e `/ws` protegidos |
| **Permissões por papel (admin/membro)** | ✅ | `role` no `User`; rotas `/api/admin/*` (backup e auditoria) devolvem 403 para membros comuns. Ainda não há papéis intermediários além de admin/membro |
| **HTTPS / túnel seguro** | ⚠️ | Depende do Cloudflare Tunnel na VPS |
| **Backup automático do banco** | ✅ | WAL checkpoint + cópia com fallback `VACUUM INTO`, verificação de cabeçalho, retenção de 14 dias, agendador de 24 h e botão de backup manual no painel (Etapa 8.9) |
| **Notificações push (VAPID)** | ✅ | Web Push W3C com chaves VAPID, service worker em segundo plano, alertas de cerca (ENTER/EXIT), SOS e check-in mesmo com navegador fechado (Etapa 8.5) |
| **Auditoria / log de acessos** | ✅ | Modelo `AccessLog` + hook `onResponse`: usuário, método, rota, status, IP, user-agent e duração; retenção de 30 dias; visualizador com resumo de 24 h e filtro de erros (Etapa 8.9) |
| **Ingestão de telemetria autenticada** | ✅ | Chave por aparelho (`l360_...`) validada com `timingSafeEqual`, aceita por header, query ou corpo; rotação de chave revoga a anterior na hora; `TELEMETRY_REQUIRE_KEY=false` só como escape consciente (Etapa 8.9) |
| **Recuperação de senha** | ❌ | Sem e-mail configurado; redefinição hoje exige acesso ao banco |
| **Gestão de aparelhos pelo painel** | ✅ | Modal "📱 Dispositivos Conectados": cadastro, chave mascarada com revelar/copiar, status online, rotacionar chave e excluir (Etapa 8.9) |

---

## Resumo executivo

- **Pronto (pode usar hoje):** mapa ao vivo, cercas, alertas, histórico ilimitado, replay, relatório de direção com viagens, push notifications em segundo plano, SOS com histórico persistido e resolução, perfil de membro com upload de foto real, chat coletivo do círculo e mensagens diretas 1:1 privadas com notificações, check-in, lugares ilimitados, estilos de mapa.
- **Lacunas visíveis ao usuário:** fluxo formal de entrada/saída de membros por código de convite validado; reações/menções no chat; nota de direção histórica semanal/mensal.
- **Resolvido nas últimas etapas:** autenticação com login obrigatório em toda a API e no WebSocket, geocoding reverso com endereço e lugares, edição completa de lugares, relatório de direção segmentado por viagens individuais (Life360 Gold), notificações push Web (VAPID) com navegador fechado, histórico persistido de emergências SOS com resolução, edição de perfil de membro com upload de foto real, mensagens diretas 1:1 privadas com canais segregados (Etapa 8.8) e, na Etapa 8.9, ingestão de GPS autenticada por aparelho, backup automático do SQLite com retenção, auditoria de acessos com painel administrativo e gestão de aparelhos/chaves.
- **Lacunas de plataforma restantes:** sem recuperação de senha (exige e-mail configurado); HTTPS ainda depende do Cloudflare Tunnel; o deploy na VPS Oracle Cloud ainda não foi executado.
- **Impossível sem parceiro comercial:** despacho de emergência, monitoramento 24h, proteção de identidade.
- **Depende de hardware (app mobile):** detecção de acidente, frenagem brusca.
