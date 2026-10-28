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
