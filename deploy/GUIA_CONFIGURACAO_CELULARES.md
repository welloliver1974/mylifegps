# Guia de Configuração dos Celulares da Família (My Life360)

Este guia ensina a conectar qualquer celular (Android ou iPhone) ao seu servidor para transmissão de localização 24/7 com baixíssimo consumo de bateria.

---

## 1. Instalar o Rastreador Leve no Celular

Instale o aplicativo gratuito e open-source **Traccar Client**:
* **Android (Google Play):** [Traccar Client no Google Play](https://play.google.com/store/apps/details?id=org.traccar.client)
* **iPhone (App Store):** [Traccar Client na App Store](https://apps.apple.com/app/traccar-client/id843156976)

---

## 2. Configurações no Aplicativo do Celular

Abra o **Traccar Client** e configure os seguintes campos:

1. **Identificador do Dispositivo (Device Identifier):**
   * Digite um identificador amigável para cada membro da família.
   * Exemplo: `wellington-phone`, `esposa-phone`, `filho-phone`.
   *(O servidor cria o membro e o aparelho automaticamente no primeiro envio).*

2. **URL do Servidor (Server URL):**
   * Digite a URL da sua VPS (ou do seu Cloudflare Tunnel):
   * `https://SEU_DOMINIO_CLOUDFLARE/api/telemetry/traccar`
   *(Se estiver testando na rede local Wi-Fi: `http://192.168.X.X:3000/api/telemetry/traccar`)*

3. **Configuração Inteligente de Bateria (Fundamental):**
   * **Intervalo (Frequency):** `60` segundos.
   * **Distância (Distance):** `50` metros. *(O celular só liga o GPS se você se deslocar pelo menos 50 metros. Quando você estiver em casa, no trabalho ou dormindo, o GPS NÃO é acionado, economizando até 90% de bateria).*
   * **Ângulo (Angle):** `30` graus *(grava curvas em trajetos de carro)*.
   * **Provedor de Localização:** `Misto (Mixed)` ou `Alta Precisão (High Accuracy)`.
   * **Buffer Offline:** Ativado *(se o celular ficar sem sinal na rua, ele guarda as coordenadas e envia tudo assim que o sinal 4G/Wi-Fi voltar)*.

4. **Ativar o Serviço:**
   * Ative a chave **"Status do Serviço"** no topo da tela do app.
   * Aparecerá um pequeno ícone na barra de notificações indicando que o serviço está ativo.

---

## 3. Ajuste no Android para Não Matar o App em Segundo Plano

No Android de cada membro:
1. Vá em **Configurações > Aplicativos > Traccar Client**.
2. Toque em **Bateria** e selecione **"Sem Restrições" (Unrestricted)**.
3. Permita permissão de Localização: **"Permitir o tempo todo" (Allow all the time)**.

---

## 4. Como Instalar o Painel no Celular (Como App Nativo PWA)

Para que você e sua família possam abrir o mapa como um aplicativo normal com ícone na tela:

1. Abra o navegador do celular (Chrome no Android ou Safari no iPhone).
2. Acesse a URL do seu servidor: `https://SEU_DOMINIO_CLOUDFLARE/`.
3. Toque nos três pontinhos do navegador (ou botão Compartilhar no Safari) e selecione:
   * **"Adicionar à tela inicial"** ou **"Instalar Aplicativo"**.
4. Um ícone do **My Life360** será criado na tela inicial do celular e abrirá em **tela cheia**, sem barra de endereços do navegador!
