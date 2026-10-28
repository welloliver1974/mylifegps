# Deploy na VPS Oracle Cloud — Etapa 9.2

> **Regra desta etapa:** nenhuma porta aberta para a internet.
> SSH pela **Tailscale**. App publicado pelo **Cloudflare Tunnel** (conexão de saída).
> Quem escanear o seu IP não encontra nada para atacar.

**VPS deste projeto:** `150.230.94.243` (Ubuntu)
**Domínio:** já está no Cloudflare (você configura o subdomínio no painel)

---

## Visão do que vai acontecer

| Passo | O que faz | Você roda |
|---|---|---|
| 1 | Auditoria da VPS (procura backdoor da invasão antiga) | `check-vps-security.sh` |
| 2 | Instala Node, PM2, Cloudflared e o app | `install-vps.sh` |
| 3 | (Opcional) Leva os dados do seu `dev.db` local | 1 comando `scp` |
| 4 | Publica com HTTPS via Cloudflare Tunnel | painel Cloudflare + 1 comando |
| 5 | Fecha tudo (SSH só via Tailscale, firewall) | `harden-vps.sh` |
| 6 | Valida de verdade | checklist |

> ⏱️ Tempo estimado: 30–40 minutos.
> 🔐 **Nunca cole chaves, tokens ou senhas aqui no chat.** Os scripts leem segredos direto no terminal da VPS.

---

## Passo 0 — Conectar na VPS pelo Tailscale

Na VPS (pelo console da Oracle, ou por SSH enquanto a porta 22 ainda está aberta):

```bash
# Instalar o Tailscale, se ainda não tiver
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Anotar o IP do Tailscale desta VPS (algo como 100.x.y.z)
tailscale ip -4
```

No seu PC, confirme que aparece a VPS na rede:

```bash
tailscale status
```

A partir daqui, **use sempre o IP do Tailscale** para entrar:

```bash
ssh ubuntu@100.x.y.z
```

> Se ainda não instalou o Tailscale no PC: https://tailscale.com/download

---

## Passo 1 — Auditar antes de instalar

Baixe e rode a auditoria (somente leitura, não altera nada):

```bash
curl -fsSL https://raw.githubusercontent.com/welloliver1974/mylifegps/main/deploy/check-vps-security.sh -o check-vps-security.sh
bash check-vps-security.sh 2>&1 | tee relatorio-seguranca.txt
```

**O que olhar no relatório:**

| Seção | Sinal de alerta |
|---|---|
| Usuários UID 0 | Qualquer conta além de `root` |
| Chaves SSH autorizadas | Qualquer chave que você não reconhece |
| Portas públicas | Qualquer coisa além de `sshd` na 22 |
| Cron / timers | Linhas com `curl`, `wget`, `base64`, IPs |
| Serviços habilitados | Nomes que você não instalou |
| Últimos logins | IPs de países/regiões que não são seus |

Se aparecer algo estranho, **pare e me mostre o relatório antes de continuar** — a VPS pode ter resquício do acesso antigo.

---

## Passo 2 — Instalar o app

```bash
curl -fsSL https://raw.githubusercontent.com/welloliver1974/mylifegps/main/deploy/install-vps.sh -o install-vps.sh
less install-vps.sh        # leia antes de executar (boa prática)
bash install-vps.sh
```

O script vai:
1. Instalar pacotes básicos, Node.js 20, PM2 e `cloudflared`
2. Clonar `https://github.com/welloliver1974/mylifegps.git` em `~/my-life360`
3. Rodar `npm ci`, `prisma generate`, `prisma db push` e `npm run build`
4. Criar o `server/.env` com permissão `600`, **gerando as chaves VAPID novas** e pedindo a `CARTO_API_KEY` digitada por você (sem eco na tela, sem histórico de shell)
5. Subir o serviço no PM2 já configurado para iniciar no boot
6. Testar `http://127.0.0.1:3000/health`

**No fim ele deve imprimir:**
```
✔ Servidor respondendo em http://127.0.0.1:3000/health
{"status":"online", ...}
```

Se falhar:
```bash
pm2 logs my-life360-server --lines 60
```

---

## Passo 3 — (Opcional) Levar seus dados atuais

Se quiser manter usuários, lugares, histórico e chat que já existem no seu PC:

**No seu PC**, na raiz do projeto (com o servidor local parado):

```bash
npx tsx server/scripts/export-local-db.ts
```

Isso gera `server/prisma/migracao.db` com um checkpoint limpo do WAL.

**Enviar para a VPS:**

```bash
scp server/prisma/migracao.db ubuntu@100.x.y.z:/tmp/prod.db
```

**Na VPS:**

```bash
pm2 stop my-life360-server
cp /tmp/prod.db ~/my-life360/server/prisma/prod.db
pm2 start my-life360-server
```

> Se **não** fizer este passo, o banco começa vazio e você cria a conta de administrador do zero na primeira abertura do painel (o que também funciona bem).

---

## Passo 4 — HTTPS com Cloudflare Tunnel

### 4.1 Criar o túnel no painel

1. Acesse **dash.cloudflare.com** → **Zero Trust** → **Networks** → **Tunnels**
2. **Create a tunnel** → tipo **Cloudflared** → nome: `mylife360` → **Save**
3. Copie o **token** que aparece (a string longa depois de `--token`)

### 4.2 Instalar o túnel na VPS

```bash
sudo cloudflared service install SEU_TOKEN_AQUI
sudo systemctl status cloudflared --no-pager
```

> O token fica no arquivo de serviço do systemd, fora do Git. Se preferir não colar na linha de comando, rode `sudo cloudflared service install` e cole o token quando pedir.

### 4.3 Publicar o hostname

Ainda no túnel criado, aba **Public Hostname** → **Add a public hostname**:

| Campo | Valor |
|---|---|
| Subdomain | `life360` (ou o que preferir) |
| Domain | `seudominio.com` |
| Path | *(vazio)* |
| Service — Type | `HTTP` |
| Service — URL | `localhost:3000` |

Salve. Teste de fora (no celular, no 4G):

```
https://life360.seudominio.com/health
```

Deve responder `{"status":"online",...}`.

> **Por que isso é seguro:** o `cloudflared` abre uma conexão de *saída* para a Cloudflare. A VPS não precisa de nenhuma porta de entrada aberta. Nada escuta publicamente.

---

## Passo 5 — Fechar tudo (hardening)

Com a VPS já conectada **pelo IP do Tailscale** e com uma **segunda sessão SSH aberta** de teste:

```bash
curl -fsSL https://raw.githubusercontent.com/welloliver1974/mylifegps/main/deploy/harden-vps.sh -o harden-vps.sh
bash harden-vps.sh
```

O script faz:
- **SSH:** `PasswordAuthentication no`, `PermitRootLogin no`, apenas chave
- **fail2ban:** 5 tentativas erradas → banimento de 1 h
- **ufw:** nega tudo de fora, libera só a interface `tailscale0`
- **Atualizações automáticas** de segurança

**Proteção contra se trancar fora:** ele agenda um rollback que **desativa o ufw em 10 minutos**. Se você continuar conectado, cancele:

```bash
sudo systemctl stop ufw-rollback.timer
```

Se perder o acesso, espere 10 minutos e reconecte.

---

## Passo 6 — Validação final (checklist)

- [ ] `https://life360.seudominio.com/health` responde `{"status":"online"}`
- [ ] Abre a tela de login no celular pelo 4G (fora do Wi-Fi)
- [ ] Cria a conta de administrador
- [ ] Modal do círculo mostra o **código de convite real** (`FAM-XXXX-XXXX`)
- [ ] Cadastra um **dispositivo** (📱 Dispositivos & Chaves GPS) e copia a chave `l360_...`
- [ ] Telemetria chega: aparelho aparece no mapa com posição
- [ ] **Notificação push** funciona com o navegador fechado (🔔 Ativar Notificações)
- [ ] `sudo ss -tulpn | grep -E '0\.0\.0\.0|\[::\]'` → **nenhuma porta pública**
- [ ] `sudo ufw status` → `deny (incoming)`, liberação só em `tailscale0`
- [ ] Backup gerado em `/var/backups/mylife360` (`sudo ls -lh /var/backups/mylife360`)

---

## Backup fora da VPS (recomendado)

O app já gera backup diário local com retenção de 14 dias. Para tirar uma cópia do disco da VPS, faça o *pull* do seu PC de vez em quando:

```bash
scp -r ubuntu@100.x.y.z:/var/backups/mylife360 ./backup-mylife360-$(date +%F)
```

Ou, para automatizar no PC (PowerShell, uma vez por dia):

```powershell
scp -r ubuntu@100.x.y.z:/var/backups/mylife360 "E:\Apps\my life360\backups-offsite"
```

---

## Atualizar o deploy depois (nova versão no GitHub)

De qualquer pasta na VPS, basta digitar:

```bash
atualizar life360
# ou simplesmente:
atualizar
```

Outros comandos úteis:
```bash
atualizar status    # exibe versão atual, status do PM2 e health check
atualizar logs      # visualiza os logs do servidor em tempo real
atualizar restart   # reinicia o servidor sem recompilar
```

*(Se o comando global ainda não estiver no PATH, execute uma única vez: `bash ~/my-life360/deploy/instalar-comando.sh` ou `cd ~/my-life360 && bash deploy/quick-deploy.sh`)*

---

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `502` no domínio | app não está de pé | `pm2 status` e `pm2 logs` |
| `health` local OK, domínio não | túnel apontando para porta errada | Public Hostname deve ser `localhost:3000` |
| Push não chega | site aberto por HTTP ou chaves VAPID trocadas | precisa HTTPS; regerar VAPID e reinscrever |
| "Não autenticado" em tudo | sessão expirada ou `.env` recriado | faça login novamente |
| Perdi o SSH após o hardening | ufw fechou a porta 22 | aguarde o rollback de 10 min ou use o console da Oracle |
| Telemetria 401 | chave do aparelho errada | gere nova chave em 📱 Dispositivos |

---

## O que NÃO foi feito aqui (fica para as próximas etapas)

- APK do app mobile (Etapa 9.2b — gerar depois que o domínio HTTPS estiver de pé)
- Sensor de acidente com acelerômetro (Etapa 9.3)
- "Atualizar agora" (Etapa 9.4)
- Reações/menções no chat (Etapa 9.5)
- Nota de direção semanal/mensal (Etapa 9.6)
- Recuperação de senha por e-mail (Etapa 9.7)
