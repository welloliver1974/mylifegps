# Auditoria de Paridade — My Life360 × Life360 Oficial

> **REGRA DO PROJETO:** este arquivo é a fonte de verdade sobre o que já existe no nosso app comparado ao Life360 oficial.
> Toda vez que alguém pedir "temos tudo que o Life360 tem?", **conferir o código e testar** antes de responder — e atualizar esta tabela.
> Nunca declarar paridade total sem ter verificado item por item.

**Legenda:** ✅ implementado e funcionando · ⚠️ parcial / simplificado · ❌ ausente · 🚫 depende de terceiro (impossível auto-hospedar)

*Última auditoria: 2026-10-27 — notificações push web (VAPID) implementadas (Bloco 8, etapa 5)*

---

## Mapa e Localização

| Recurso do Life360 | Status | Observação |
|---|---|---|
| Mapa ao vivo com todos os membros | ✅ | Leaflet + WebSocket em tempo real |
| Estilos de mapa (claro, satélite, escuro) | ✅ | CARTO Voyager / Esri Imagery / CARTO Dark |
| Avatar do membro no mapa | ✅ | Iniciais; **foto apenas por URL**, sem upload |
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
| **Push notification com app fechado** | ❌ | Só alerta com a tela aberta |
| **Editar lugar existente** | ✅ | `PUT /api/places/:id`, botão ✏️ no chip e clique no marcador do mapa |

## Círculo Familiar e Comunicação

| Recurso do Life360 | Status | Observação |
|---|---|---|
| Lista de membros com status | ✅ | |
| Chat do círculo | ✅ | Tempo real via WS, histórico em banco |
| Check-in ("estou seguro") | ✅ | Topo da tela e menu do círculo |
| Código de convite | ⚠️ | Código gerado e copiável, mas **não há fluxo real de entrada de membro** com validação |
| **Adicionar/remover membros de verdade** | ❌ | Sem tela de entrada e sem vínculo de usuário |
| **Editar perfil / foto do membro** | ❌ | Sem upload de avatar |
| **Mensagem direta 1:1** | ❌ | Só chat coletivo |
| **Reações / curtir mensagens** | ❌ | |
| **Menções e notificações de chat** | ❌ | |

## Segurança e Emergência

| Recurso do Life360 | Status | Observação |
|---|---|---|
| Botão de pânico SOS | ✅ | Contagem de 5s + cancelamento |
| Alerta em tela cheia para o círculo | ✅ | Via WebSocket |
| Rota imediata para o membro em SOS | ✅ | Google Maps |
| **Histórico de alertas SOS** | ❌ | Não persiste os disparos |
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
| **Permissões por papel (admin/membro)** | ⚠️ | Campo `role` existe e o primeiro usuário vira admin; ainda sem regras por papel nas rotas |
| **HTTPS / túnel seguro** | ⚠️ | Depende do Cloudflare Tunnel na VPS |
| **Backup automático do banco** | ❌ | |
| **Notificações push (VAPID)** | ✅ | Web Push W3C com chaves VAPID, service worker em segundo plano, alertas de cerca (ENTER/EXIT), SOS e check-in mesmo com navegador fechado (Etapa 8.5) |
| **Auditoria / log de acessos** | ❌ | |
| **Ingestão de telemetria autenticada** | ⚠️ | `/api/telemetry` segue aberta para o Traccar Client; qualquer um que conheça a URL pode injetar coordenadas falsas |
| **Recuperação de senha** | ❌ | Sem e-mail configurado; redefinição hoje exige acesso ao banco |

---

## Resumo executivo

- **Pronto (pode usar hoje):** mapa ao vivo, cercas, alertas, histórico ilimitado, replay, relatório de direção com viagens, push notifications em segundo plano, SOS, chat, check-in, lugares ilimitados, estilos de mapa.
- **Lacunas visíveis ao usuário:** editar perfil (foto), mensagem direta (1:1), histórico de SOS gravado em tela dedicada.
- **Resolvido nas últimas etapas:** autenticação com login obrigatório em toda a API e no WebSocket, geocoding reverso com endereço e lugares, edição completa de lugares, relatório de direção segmentado por viagens individuais (Life360 Gold) e notificações push Web (VAPID) com navegador fechado.
- **Lacunas de plataforma restantes:** telemetria ainda aberta, sem backup automático, sem log de acessos, sem recuperação de senha.
- **Impossível sem parceiro comercial:** despacho de emergência, monitoramento 24h, proteção de identidade.
- **Depende de hardware (app mobile):** detecção de acidente, frenagem brusca.
