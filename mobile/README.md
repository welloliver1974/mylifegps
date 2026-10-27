# My Life360 - Aplicativo Móvel (React Native / Expo)

Aplicativo móvel próprio para Android e iOS, unificando a visualização do círculo familiar no mapa com o rastreador de segundo plano de alta eficiência energética.

---

## 1. Como Rodar em Modo de Desenvolvimento (Expo Go)

1. Entre na pasta mobile:
   ```bash
   cd mobile
   npm install
   ```
2. Inicie o servidor do Expo:
   ```bash
   npx expo start
   ```
3. Abra o app **Expo Go** no celular e escaneie o QR Code.

---

## 2. Como Gerar o APK Instalável para Android

Para gerar o arquivo `.apk` final e instalar diretamente no celular da família:

1. Instale a CLI do EAS (Expo Application Services):
   ```bash
   npm install -g eas-cli
   ```
2. Faça login na sua conta Expo:
   ```bash
   eas login
   ```
3. Configure o build:
   ```bash
   eas build:configure
   ```
4. Gere o APK:
   ```bash
   eas build -p android --profile preview
   ```
   *O Expo irá compilar o instalador `.apk` na nuvem e fornecer um link direto para download no celular.*

---

## 3. Arquitetura do App
* **Visualização:** Carrega a interface PWA da VPS via WebView de alta performance (mesmo visual moderno, sem precisar redesenhar o mapa).
* **Rastreamento em 2º Plano:** `expo-location` + `expo-task-manager` com `ForegroundService` no Android, transmitindo telemetria mesmo com o app fechado e a tela bloqueada.
* **Economia de Bateria:** Disparo baseado em deslocamento (`distanceInterval: 50m`), evitando consumo de GPS quando o usuário estiver parado.
