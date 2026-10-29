# My Life360 - Aplicativo Móvel Android (.APK)

Aplicativo móvel próprio estilo **Life360** (paleta oficial roxa `#762EEB`), unificando a visualização do mapa em tempo real via WebView de alta performance com o serviço de rastreamento de segundo plano contínuo e economia de bateria.

---

## 1. Como Gerar o Arquivo `.APK` Instalável

A compilação do APK nativo é feita usando o **EAS Build** (serviço em nuvem oficial e gratuito do Expo). Não é necessário ter Android Studio, SDK do Android ou Gradle instalados no computador.

### Passo 1: Instalar as dependências do projeto
Abra o terminal no seu computador e execute:
```bash
cd mobile
npm install
```

### Passo 2: Fazer login na conta Expo
Se ainda não tem conta no Expo, crie gratuitamente em [https://expo.dev/signup](https://expo.dev/signup). Em seguida, faça login pelo terminal:
```bash
npx eas login
```
*(Digite seu usuário e senha do Expo).*

### Passo 3: Disparar a geração do APK
Execute o script pré-configurado:
```bash
npm run build:apk
```
*(ou diretamente: `npx eas build -p android --profile preview`)*

O EAS irá perguntar se deseja configurar o projeto na sua conta Expo (basta dar **Enter / Yes**).

### Passo 4: Baixar e Instalar no Celular
- O EAS compila o app na nuvem (leva cerca de 5 a 10 minutos).
- Ao final, o terminal exibirá um **link direto de download** e um **QR Code**.
- Basta apontar a câmera do seu celular Android para o QR Code para baixar o arquivo `.apk` e instalar.
- Se o Android exibir o aviso *"Instalar aplicativo de fonte desconhecida"*, toque em **Permitir** (padrão de apps próprios instalados fora da Play Store).

---

## 2. Como Conectar o Celular ao Servidor da Família

Após abrir o app no celular:

1. Acesse o painel web no computador: `https://life360.housecloud.tec.br`
2. No menu superior ou rodapé, clique no botão **📱 Dispositivos & Chaves GPS**.
3. Adicione um novo dispositivo:
   - **Identificador:** Exemplo: `celular-wellington`
   - **Membro:** Selecione o seu usuário familiar.
   - Copie a **Chave de Telemetria** gerada (exemplo: `l360_...`).
4. No aplicativo móvel instalado no celular:
   - O app abrirá automaticamente a tela de configuração (ícone ⚙️).
   - **URL:** Já vem preenchida com `https://life360.housecloud.tec.br`.
   - **Identificador:** Digite o mesmo nome cadastrado (ex: `celular-wellington`).
   - **Chave de Telemetria:** Cole a chave `l360_...`.
   - Toque em **📡 Testar Envio de Coordenada Agora** para confirmar a comunicação com a VPS.
   - Ative o switch **Rastreamento em 2º Plano** e conceda a permissão *"Permitir o tempo todo"* quando o Android solicitar.
   - Toque em **Salvar**.

Pronto! Seu celular agora reporta telemetria 24/7 com extrema eficiência de bateria (só transmite se houver deslocamento > 50 metros).

---

## 3. Especificações e Paridade com o Life360 Oficial

| Recurso | Status no My Life360 | Observação |
|---|---|---|
| **Identidade Visual** | Roxo oficial `#762EEB` | Ícone de anéis concêntricos + Splash Screen nativa |
| **Visualização do Círculo** | Mapa Leaflet + PWA | WebView otimizada com suporte a geolocalização e cache |
| **Segundo Plano** | Android Foreground Service | Notificação discreta com ícone e cor oficial |
| **Economia de Bateria** | `distanceInterval: 50m` | Não drena bateria quando parado ou em repouso |
| **Proteção contra Doze Mode** | `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | Mantém rastreamento ativo em celulares Samsung, Xiaomi e Motorola |
| **Ingestão Segura** | Chave por aparelho (`x-device-key`) | Impede envio não autorizado de coordenadas para a VPS |
| **Detecção de Acidente (9.3)** | `expo-sensors` (acelerômetro) | Magnitude em Gs com 3 sensibilidades (2.5G / 3.0G / 3.8G), filtro de velocidade > 20 km/h, cooldown de 45 s, contagem de segurança de 30 s e envio automático do SOS à família |

---

## 4. Detecção de Acidente Veicular (Etapa 9.3)

O app lê o acelerômetro do celular 10 vezes por segundo e calcula a magnitude vetorial
`sqrt(x² + y² + z²)` em Gs (em repouso, o valor fica em torno de 1.0G).

**Como o alarme falso é evitado:** o alerta só nasce quando **duas** condições são verdadeiras ao mesmo tempo:
1. O impacto passa do limiar da sensibilidade escolhida; **e**
2. O veículo está a **pelo menos 20 km/h** (a velocidade vem do rastreamento GPS em segundo plano).

Assim, o celular cair da mão ou da mesa com o usuário parado **não** dispara nada.

**O que acontece quando um impacto é confirmado:**
1. O celular **vibra forte** na hora e abre uma tela cheia com a força G, a velocidade e a origem (sensor real ou simulação).
2. Começa uma **contagem regressiva de 30 segundos**, com vibração de reforço a cada 5 s.
3. O condutor escolhe:
   - **✅ ESTOU BEM** → cancela na hora, nada é enviado à família; ou
   - **🚨 ENVIAR SOS AGORA** → antecipa o alerta sem esperar o tempo acabar.
4. Se ninguém responder, o app **transmite o alerta automaticamente** com a localização exata. Todos os aparelhos do círculo recebem push e o painel abre o alerta em tela cheia, com botão de rota direta no Google Maps.
5. Depois de enviado, o botão **"Estou Seguro Agora"** encerra o alerta no servidor.

### Sensibilidades disponíveis (⚙️ Ajustes → 🛡️ Detecção de Acidente)

| Nível | Limiar | Indicado para |
|---|---|---|
| **Alta** | 2.5G | Veículos com suspensão macia; quem quer pegar impactos mais leves |
| **Média** (padrão) | 3.0G | Equilíbrio recomendado para colisões veiculares reais |
| **Baixa** | 3.8G | Evita alarme falso em estradas esburacadas ou suspensão dura |

### Como testar sem bater o carro

Nos ajustes do app, toque em **🧪 Simular Alerta de Acidente (Teste)**. Todo o fluxo roda
com uma contagem mais curta (15 s) e o evento é gravado com a marca `(Teste de simulação)`,
para você confirmar que o push chega em todos os celulares da família.

> ⚠️ **Importante:** o acelerômetro é escutado com o app vivo ou em segundo plano (Foreground
> Service). Se o usuário **encerrar o app deliberadamente** pela tela de tarefas, o Android
> também encerra a escuta do sensor — nesse caso só o rastreamento de localização continua
> pelo serviço de segundo plano. Detecção com o app totalmente fechado exigiria um serviço
> nativo dedicado, que está no backlog do Bloco 10.
