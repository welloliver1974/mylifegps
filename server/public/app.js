// My Life360 Web / PWA App Core (Estilo Life360 Oficial + Todos os Recursos Premium Desbloqueados)
document.addEventListener('DOMContentLoaded', () => {
  let map;
  let currentTileLayer = null;
  let cartoKey = '';
  let currentLayerType = localStorage.getItem('life360_map_layer') || 'voyager';

  let memberMarkers = new Map(); // userId -> { marker, accuracyCircle }
  let placeLayers = new Map();   // placeId -> { circle, labelMarker }
  let historyPolyline = null;
  let replayMarker = null;
  let replayTimer = null;
  let replayIndex = 0;
  let replayPoints = [];
  let replayPlaying = false;
  let replaySpeedMultiplier = 1;

  let membersData = [];
  let placesData = [];
  let selectedMemberId = null;
  let ws = null;

  let sosCountdownInterval = null;
  let currentSosCountdown = 5;

  // ---------- Autenticação ----------
  const AUTH_TOKEN_KEY = 'life360_auth_token';
  let authToken = localStorage.getItem(AUTH_TOKEN_KEY) || '';
  let authMode = 'login'; // 'login' | 'setup'
  let appStarted = false;

  // Wrapper de fetch que injeta o token e trata sessão expirada
  function apiFetch(url, options = {}) {
    const opts = { ...options, headers: { ...(options.headers || {}) } };
    if (authToken) opts.headers['Authorization'] = `Bearer ${authToken}`;

    return fetch(url, opts).then((res) => {
      if (res.status === 401 && !url.startsWith('/api/auth/')) {
        handleUnauthorized();
      }
      return res;
    });
  }

  function handleUnauthorized() {
    authToken = '';
    localStorage.removeItem(AUTH_TOKEN_KEY);
    showAuthScreen('login', 'Sua sessão expirou. Entre novamente.');
  }

  function showAuthScreen(mode, message) {
    authMode = mode;
    const screen = document.getElementById('authScreen');
    const subtitle = document.getElementById('authSubtitle');
    const nameGroup = document.getElementById('authNameGroup');
    const submitBtn = document.getElementById('authSubmitBtn');
    const footnote = document.getElementById('authFootnote');
    const errorEl = document.getElementById('authError');

    screen.classList.remove('hidden');

    if (mode === 'setup') {
      subtitle.textContent = 'Primeira configuração: crie sua conta de administrador';
      nameGroup.style.display = 'block';
      submitBtn.textContent = 'Criar conta e entrar';
      footnote.textContent = 'Esta conta protegerá o acesso a todas as localizações da família.';
      document.getElementById('authPassword').setAttribute('autocomplete', 'new-password');
    } else {
      subtitle.textContent = 'Entre para acessar o círculo da família';
      nameGroup.style.display = 'none';
      submitBtn.textContent = 'Entrar';
      footnote.textContent = 'Seus dados ficam apenas no seu próprio servidor.';
      document.getElementById('authPassword').setAttribute('autocomplete', 'current-password');
    }

    if (message) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    } else {
      errorEl.style.display = 'none';
    }
  }

  function hideAuthScreen() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('authError').style.display = 'none';
  }

  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/auth/status');
      const status = await res.json();
      if (status.needsSetup) {
        showAuthScreen('setup');
        return false;
      }
    } catch (err) {
      console.error('Erro ao consultar status de autenticação:', err);
    }

    if (!authToken) {
      showAuthScreen('login');
      return false;
    }

    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        hideAuthScreen();
        return true;
      }
    } catch (err) {
      console.error('Erro ao validar sessão:', err);
    }

    showAuthScreen('login');
    return false;
  }

  function setupAuthForm() {
    document.getElementById('authForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('authSubmitBtn');
      const errorEl = document.getElementById('authError');
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const name = document.getElementById('authName').value.trim();

      errorEl.style.display = 'none';
      submitBtn.disabled = true;

      const endpoint = authMode === 'setup' ? '/api/auth/setup' : '/api/auth/login';
      const payload = authMode === 'setup' ? { name, email, password } : { email, password };

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok) {
          errorEl.textContent = data.error || 'Não foi possível entrar.';
          errorEl.style.display = 'block';
          return;
        }

        authToken = data.token;
        localStorage.setItem(AUTH_TOKEN_KEY, authToken);
        document.getElementById('authPassword').value = '';
        hideAuthScreen();
        startApp();
      } catch (err) {
        console.error(err);
        errorEl.textContent = 'Falha de conexão com o servidor.';
        errorEl.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  async function logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Erro ao sair:', err);
    }

    authToken = '';
    localStorage.removeItem(AUTH_TOKEN_KEY);
    document.getElementById('circleModal').style.display = 'none';

    if (ws) {
      ws.onclose = null;
      ws.close();
      ws = null;
    }

    location.reload();
  }

  // Dicionário de emojis e cores para tipos de lugares
  const PLACE_ICONS = {
    home: '🏠',
    briefcase: '💼',
    school: '🎓',
    gym: '🏋️',
    market: '🛒',
    star: '⭐',
  };

  // 1. Configurações dos Provedores de Mapa
  function getTileConfig(type) {
    if (type === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        subdomains: 'abc',
        maxZoom: 19,
      };
    }
    if (type === 'dark') {
      return {
        url: cartoKey
          ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      };
    }
    // Padrão: Voyager (Life360 Clean)
    return {
      url: cartoKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey}`
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    };
  }

  function switchBaseLayer(type) {
    currentLayerType = type;
    localStorage.setItem('life360_map_layer', type);
    const cfg = getTileConfig(type);

    if (currentTileLayer) {
      map.removeLayer(currentTileLayer);
    }

    currentTileLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      subdomains: cfg.subdomains,
      attribution: cfg.attribution,
    }).addTo(map);

    let fallbackTriggered = false;
    currentTileLayer.on('tileerror', () => {
      if (!fallbackTriggered && cfg.url.includes('cartocdn.com')) {
        fallbackTriggered = true;
        console.warn('Tiles CARTO indisponíveis, alternando para OpenStreetMap...');
        currentTileLayer.setUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
      }
    });

    document.querySelectorAll('.layer-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.layer === type);
    });
  }

  // 2. Inicializa o Mapa Leaflet
  async function initMap() {
    map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
    }).setView([-23.55052, -46.633308], 14);

    try {
      const cfgRes = await apiFetch('/api/config');
      const cfg = await cfgRes.json();
      if (cfg?.cartoApiKey) {
        cartoKey = cfg.cartoApiKey;
      }
    } catch (err) {
      console.warn('Não foi possível obter config do servidor:', err);
    }

    switchBaseLayer(currentLayerType);

    map.on('click', (e) => {
      document.getElementById('placeLat').value = e.latlng.lat.toFixed(6);
      document.getElementById('placeLng').value = e.latlng.lng.toFixed(6);
      document.getElementById('placeModal').style.display = 'flex';
    });

    setupFloatingControls();
    setupBottomsheetGestures();
    setupCircleMenu();
    setupChat();
    setupAlerts();
    setupSosFlow();
    setupReplayPlayer();
    setupDriverReportAndHistory();
  }

  // 3. Controles Flutuantes do Mapa
  function setupFloatingControls() {
    const popover = document.getElementById('layerPopover');
    const btnLayers = document.getElementById('btnToggleLayers');

    btnLayers.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = popover.style.display === 'block';
      popover.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!popover.contains(e.target) && e.target !== btnLayers) {
        popover.style.display = 'none';
      }
    });

    document.querySelectorAll('.layer-card').forEach((card) => {
      card.addEventListener('click', () => {
        const type = card.dataset.layer;
        switchBaseLayer(type);
        popover.style.display = 'none';
      });
    });

    document.getElementById('btnRecenterFab').addEventListener('click', fitAllMembers);
    document.getElementById('btnZoomIn').addEventListener('click', () => map.zoomIn());
    document.getElementById('btnZoomOut').addEventListener('click', () => map.zoomOut());
  }

  // 4. Gestos e Interação do Bottom Sheet (Arrasto Touch / Mouse + Minimizar)
  function setupBottomsheetGestures() {
    const sheet = document.getElementById('bottomSheet');
    const handle = document.getElementById('sheetDragHandle');
    const toggleBtn = document.getElementById('btnSheetToggle');
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;

    const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;

    const onStart = (clientX, clientY) => {
      isDragging = true;
      startX = clientX;
      startY = clientY;
      currentX = 0;
      currentY = 0;
      sheet.classList.add('dragging');
    };

    const onMove = (clientX, clientY) => {
      if (!isDragging) return;
      currentX = clientX - startX;
      currentY = clientY - startY;
      // No desktop (painel na esquerda) o arrasto horizontal recolhe o card
      if (isDesktop() && currentX < 0) {
        sheet.style.transform = `translateX(${currentX}px)`;
      } else if (!isDesktop() && currentY > 0) {
        sheet.style.transform = `translateY(${currentY}px)`;
      }
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      sheet.classList.remove('dragging');
      sheet.style.transform = '';

      if (isDesktop() && currentX < -110) {
        sheet.classList.add('collapsed-desktop');
        toggleBtn.textContent = '▸';
        toggleBtn.title = 'Exibir painel';
      } else if (!isDesktop() && currentY > 110) {
        sheet.classList.add('peek-mobile');
        toggleBtn.textContent = '▴';
        toggleBtn.title = 'Expandir painel';
      }
      currentX = 0;
      currentY = 0;
    };

    handle.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    window.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    window.addEventListener('touchend', onEnd);

    handle.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => {
      if (isDragging) onMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', onEnd);

    // Botão de minimizar/expandir explícito (sempre visível no puxador)
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isDesktop()) {
        const collapsed = sheet.classList.toggle('collapsed-desktop');
        toggleBtn.textContent = collapsed ? '▸' : '▾';
        toggleBtn.title = collapsed ? 'Exibir painel' : 'Ocultar painel';
      } else {
        const peeked = sheet.classList.toggle('peek-mobile');
        toggleBtn.textContent = peeked ? '▴' : '▾';
        toggleBtn.title = peeked ? 'Expandir painel' : 'Minimizar painel';
      }
    });

    // Permite reabrir o painel clicando em qualquer parte da borda quando recolhido
    sheet.addEventListener('click', (e) => {
      if (isDesktop() && sheet.classList.contains('collapsed-desktop') && e.clientX < sheet.getBoundingClientRect().left + 46) {
        sheet.classList.remove('collapsed-desktop');
        toggleBtn.textContent = '▾';
        toggleBtn.title = 'Ocultar painel';
      }
    });
  }

  // 4b. Menu do Círculo Familiar, Código de Convite e Check-in
  function setupCircleMenu() {
    const circleModal = document.getElementById('circleModal');
    const btnCircleMenu = document.getElementById('btnCircleMenu');
    const btnCloseCircleModal = document.getElementById('btnCloseCircleModal');
    const inviteCodeEl = document.getElementById('circleInviteCode');

    // Código de convite persistente e privado por círculo
    let inviteCode = localStorage.getItem('life360_circle_invite_code');
    if (!inviteCode) {
      inviteCode = 'FAM-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      localStorage.setItem('life360_circle_invite_code', inviteCode);
    }
    inviteCodeEl.textContent = inviteCode;

    btnCircleMenu.addEventListener('click', () => {
      circleModal.style.display = 'flex';
    });

    btnCloseCircleModal.addEventListener('click', () => {
      circleModal.style.display = 'none';
    });

    circleModal.addEventListener('click', (e) => {
      if (e.target === circleModal) circleModal.style.display = 'none';
    });

    document.getElementById('btnCopyInviteCode').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(inviteCode);
        showToast('Código de convite copiado!');
      } catch {
        showToast(`Código: ${inviteCode}`);
      }
    });

    const doCheckin = () => {
      const user = getCurrentUser();
      const payload = {
        userId: user.id,
        userName: user.name,
        placeName: user.placeName || 'Local Atual',
      };

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'TRIGGER_CHECKIN', data: payload }));
      } else {
        apiFetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((err) => console.error('Erro ao enviar check-in:', err));
      }

      showToast('Check-in enviado! Sua família sabe que você está bem. ✅');
      circleModal.style.display = 'none';
    };

    document.getElementById('btnTopCheckin').addEventListener('click', doCheckin);
    document.getElementById('btnCircleCheckin').addEventListener('click', doCheckin);
  }

  // 4c. Chat do Círculo Familiar (tempo real via WebSocket)
  const renderedChatIds = new Set();

  function setupChat() {
    document.getElementById('chatForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text) return;

      const user = getCurrentUser();
      input.value = '';

      try {
        await apiFetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            userName: user.name,
            userColor: '#3B82F6',
            text,
          }),
        });
      } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        showToast('Erro ao enviar mensagem.');
      }
    });
  }

  async function loadChat() {
    try {
      const res = await apiFetch('/api/messages?limit=80');
      const messages = await res.json();
      const container = document.getElementById('chatMessages');

      if (!messages || messages.length === 0) {
        container.innerHTML = '<div class="loading-state">Nenhuma mensagem ainda.</div>';
        document.getElementById('chatCount').textContent = '0';
        return;
      }

      container.innerHTML = '';
      renderedChatIds.clear();
      messages.forEach((m) => appendChatMessage(m, true));
    } catch (err) {
      console.error('Erro ao carregar chat:', err);
    }
  }

  function appendChatMessage(message, isBulkLoad = false) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const placeholder = container.querySelector('.loading-state');
    if (placeholder) placeholder.remove();

    const key = message.id || `${message.userName}-${message.createdAt}-${message.text}`;
    if (renderedChatIds.has(key)) return;
    renderedChatIds.add(key);

    const me = getCurrentUser();
    const isMine = message.userId && message.userId === me.id;
    const time = message.createdAt
      ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble${isMine ? ' mine' : ''}`;
    bubble.innerHTML = `
      <span class="chat-bubble-author" style="color: ${message.userColor || '#3B82F6'};">${message.userName}</span>
      <span class="chat-bubble-text"></span>
      <span class="chat-bubble-time">${time}</span>
    `;
    // Texto inserido via textContent para evitar injeção de HTML
    bubble.querySelector('.chat-bubble-text').textContent = message.text;

    container.appendChild(bubble);
    if (!isBulkLoad) container.scrollTop = container.scrollHeight;

    const countEl = document.getElementById('chatCount');
    if (countEl) countEl.textContent = renderedChatIds.size;
  }

  // 4d. Timeline de Alertas de Lugares (entradas e saídas de cercas)
  function setupAlerts() {
    document.getElementById('btnRefreshAlerts').addEventListener('click', loadAlerts);
  }

  async function loadAlerts() {
    const container = document.getElementById('alertsTimeline');
    try {
      const res = await apiFetch('/api/places/events?limit=30');
      const events = await res.json();

      if (!events || events.length === 0) {
        container.innerHTML = '<div class="loading-state">Nenhum alerta de lugar ainda.</div>';
        return;
      }

      container.innerHTML = events.map((ev) => {
        const isEnter = ev.eventType === 'ENTER';
        const icon = PLACE_ICONS[ev.placeIcon] || '📍';
        return `
          <div class="alert-item">
            <div class="alert-item-icon ${isEnter ? 'enter' : 'exit'}">${icon}</div>
            <div class="alert-item-body">
              <div class="alert-item-title">${isEnter ? 'Chegou em' : 'Saiu de'} ${ev.placeName}</div>
              <div class="alert-item-sub">${ev.userName} • ${formatRelativeTime(ev.recordedAt)}</div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Erro ao carregar alertas:', err);
      container.innerHTML = '<div class="loading-state">Erro ao carregar alertas.</div>';
    }
  }

  // Retorna o membro atual (primeiro do círculo) para ações disparadas pelo próprio usuário
  function getCurrentUser() {
    const user = membersData[0] || {};
    return {
      id: user.id || 'usr_me',
      name: user.name || 'Você',
      avatarUrl: user.avatarUrl || '',
      location: user.location || { latitude: -23.55052, longitude: -46.633308, battery: 95 },
    };
  }

  // 5. Conexão WebSocket com Reconexão e Alerta de SOS
  function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(authToken)}`;

    const wsStatus = document.getElementById('wsStatus');
    const statusLabel = wsStatus.querySelector('.status-label');

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      wsStatus.classList.add('online');
      statusLabel.textContent = 'Ao Vivo';
      console.log('WebSocket conectado.');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'LOCATION_UPDATE') {
          handleLiveLocation(msg.data);
        } else if (msg.type === 'GEOFENCE_ALERT') {
          showToast(msg.alert.message);
        } else if (msg.type === 'SOS_ALERT') {
          triggerSosEmergencyOverlay(msg.alert);
        } else if (msg.type === 'CHECKIN_ALERT') {
          showToast(msg.alert?.message || '📍 Um membro fez check-in.');
        } else if (msg.type === 'CHAT_MESSAGE') {
          appendChatMessage(msg.message);
        }
      } catch (err) {
        console.error('Erro ao processar mensagem WS:', err);
      }
    };

    ws.onclose = () => {
      wsStatus.classList.remove('online');
      statusLabel.textContent = 'Reconectando...';
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  // Geocoding reverso e detecção de cercas no frontend
  const clientAddressCache = new Map();

  function formatAddressKey(lat, lon) {
    return `${(Math.round(lat * 10000) / 10000).toFixed(4)}:${(Math.round(lon * 10000) / 10000).toFixed(4)}`;
  }

  function findPlaceForCoords(lat, lon) {
    if (!placesData || placesData.length === 0) return null;
    for (const p of placesData) {
      const distKm = calcHaversineDist(lat, lon, p.latitude, p.longitude);
      if (distKm * 1000 <= p.radiusMeters) {
        return p;
      }
    }
    return null;
  }

  async function fetchAddressForCoords(lat, lon) {
    const key = formatAddressKey(lat, lon);
    if (clientAddressCache.has(key)) {
      return clientAddressCache.get(key);
    }
    try {
      const res = await apiFetch(`/api/geocoding/reverse?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        clientAddressCache.set(key, data);
        return data;
      }
    } catch (err) {
      console.warn('Falha no reverse geocode:', err);
    }
    return null;
  }

  // 6. Atualização de Posição em Tempo Real (via WS)
  function handleLiveLocation(locData) {
    const member = membersData.find((m) => m.id === locData.userId);
    const currentPlace = findPlaceForCoords(locData.latitude, locData.longitude);

    if (member) {
      member.currentPlace = currentPlace;
      member.location = {
        latitude: locData.latitude,
        longitude: locData.longitude,
        accuracy: locData.accuracy,
        speed: locData.speed,
        heading: locData.heading,
        battery: locData.battery,
        isCharging: locData.isCharging,
        recordedAt: locData.recordedAt,
      };
      if (locData.deviceName && member.activeDevice) {
        member.activeDevice.name = locData.deviceName;
      }
    } else {
      membersData.push({
        id: locData.userId,
        name: locData.userName,
        color: locData.userColor,
        avatarUrl: locData.userAvatar,
        currentPlace,
        activeDevice: { id: locData.deviceId, name: locData.deviceName },
        location: {
          latitude: locData.latitude,
          longitude: locData.longitude,
          accuracy: locData.accuracy,
          speed: locData.speed,
          heading: locData.heading,
          battery: locData.battery,
          isCharging: locData.isCharging,
          recordedAt: locData.recordedAt,
        },
      });
    }

    renderMemberMarker(locData.userId);
    renderMembersList();
    updateCollapsedBar();

    if (selectedMemberId === locData.userId) {
      renderMemberDetails(member || membersData[membersData.length - 1]);
    }
  }

  // 7. Carrega Membros Iniciais da API
  async function loadMembers() {
    try {
      const res = await apiFetch('/api/members/live');
      membersData = await res.json();
      renderMembersList();
      updateCollapsedBar();
      membersData.forEach((m) => renderMemberMarker(m.id));
      fitAllMembers();
    } catch (err) {
      console.error('Erro ao buscar membros:', err);
    }
  }

  // 8. Carrega Lugares/Cercas
  async function loadPlaces() {
    try {
      const res = await apiFetch('/api/places');
      placesData = await res.json();
      renderPlaces();
      renderPlacesChips();
      loadAlerts();
    } catch (err) {
      console.error('Erro ao buscar lugares:', err);
    }
  }

  // 9. Renderiza Cercas no Mapa
  function renderPlaces() {
    placesData.forEach((place) => {
      if (placeLayers.has(place.id)) {
        const prev = placeLayers.get(place.id);
        map.removeLayer(prev.circle);
        map.removeLayer(prev.labelMarker);
      }

      const color = place.color || '#10B981';
      const iconEmoji = PLACE_ICONS[place.icon] || '📍';

      const circle = L.circle([place.latitude, place.longitude], {
        color: color,
        fillColor: color,
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6, 6',
        radius: place.radiusMeters,
      }).addTo(map);

      const labelHtml = `
        <div class="place-floating-pill" style="border-color: ${color};">
          <span class="place-pill-icon">${iconEmoji}</span>
          <span class="place-pill-name">${place.name}</span>
        </div>
      `;

      const labelIcon = L.divIcon({
        html: labelHtml,
        className: 'place-pill-div',
        iconSize: [120, 32],
        iconAnchor: [60, 16],
      });

      const labelMarker = L.marker([place.latitude, place.longitude], {
        icon: labelIcon,
        interactive: true,
      }).addTo(map);

      labelMarker.on('click', () => {
        window.openEditPlaceModal(place.id);
      });

      placeLayers.set(place.id, { circle, labelMarker });
    });
  }

  // 10. Chips de Lugares no Bottom Sheet com Edição e Exclusão
  function renderPlacesChips() {
    const container = document.getElementById('placesChipsList');
    if (!container) return;

    if (placesData.length === 0) {
      container.innerHTML = '<span style="font-size: 12px; color: var(--text-tertiary);">Nenhum lugar cadastrado.</span>';
      return;
    }

    container.innerHTML = placesData.map(p => {
      const icon = PLACE_ICONS[p.icon] || '📍';
      const color = p.color || '#10B981';
      const safeName = p.name.replace(/'/g, "\\'");
      return `
        <div class="place-chip" onclick="window.zoomToPlace(${p.latitude}, ${p.longitude})">
          <span class="place-chip-dot" style="background: ${color};"></span>
          <span>${icon} ${p.name}</span>
          <span class="edit-chip-btn" title="Editar lugar" onclick="event.stopPropagation(); window.openEditPlaceModal('${p.id}')">✏️</span>
          <span class="delete-chip-btn" title="Excluir lugar" onclick="event.stopPropagation(); window.deletePlace('${p.id}', '${safeName}')">✕</span>
        </div>
      `;
    }).join('');
  }

  window.openEditPlaceModal = function (placeId) {
    const place = placesData.find((p) => p.id === placeId);
    if (!place) return;

    document.getElementById('placeModalTitle').textContent = 'Editar Lugar (Cerca Virtual)';
    document.getElementById('btnSavePlace').textContent = 'Salvar Alterações';
    document.getElementById('placeId').value = place.id;
    document.getElementById('placeName').value = place.name;
    document.getElementById('placeLat').value = place.latitude;
    document.getElementById('placeLng').value = place.longitude;
    document.getElementById('placeRadius').value = place.radiusMeters;
    document.getElementById('radiusVal').textContent = `${Math.round(place.radiusMeters)}m`;
    document.getElementById('placeIcon').value = place.icon || 'home';
    document.getElementById('placeColor').value = place.color || '#10B981';

    document.querySelectorAll('.icon-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.icon === (place.icon || 'home'));
    });

    placeModal.style.display = 'flex';
  };

  window.zoomToPlace = function(lat, lng) {
    map.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
  };

  window.deletePlace = async function (placeId, placeName) {
    if (!confirm(`Excluir o lugar "${placeName}"? A cerca virtual será removida do mapa.`)) return;

    try {
      const res = await apiFetch(`/api/places/${placeId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');

      const existing = placeLayers.get(placeId);
      if (existing) {
        map.removeLayer(existing.circle);
        map.removeLayer(existing.labelMarker);
        placeLayers.delete(placeId);
      }

      placesData = placesData.filter((p) => p.id !== placeId);
      renderPlacesChips();
      showToast(`Lugar "${placeName}" excluído.`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir lugar.');
    }
  };

  // 11. Renderiza Marcador Oficial Estilo Life360 com Anel de Bateria SVG
  function renderMemberMarker(userId) {
    const member = membersData.find((m) => m.id === userId);
    if (!member || !member.location) return;

    const lat = member.location.latitude;
    const lng = member.location.longitude;
    const initials = member.name.substring(0, 2).toUpperCase();
    const isSelected = selectedMemberId === userId;

    const rawBatt = member.location.battery;
    const batt = rawBatt !== undefined && rawBatt !== null ? Math.round(rawBatt) : 100;
    const isCharging = !!member.location.isCharging;

    const battColor = batt < 20 ? '#EF4444' : batt < 50 ? '#F59E0B' : '#10B981';
    const battClass = batt < 20 ? 'low' : batt < 50 ? 'medium' : 'high';

    const circumference = 150.8;
    const progressOffset = circumference * (1 - Math.max(0, Math.min(100, batt)) / 100);

    const speed = member.location.speed ? Math.round(member.location.speed) : 0;
    const isMoving = speed > 5;

    const statusTagHtml = isMoving
      ? `<div class="marker-status-tag moving">
           <span class="tag-icon">🚗</span>
           <span class="tag-text">${speed} km/h</span>
         </div>`
      : `<div class="marker-status-tag">
           <span class="tag-text">${member.name}</span>
         </div>`;

    const markerHtml = `
      <div class="life360-avatar-marker ${isSelected ? 'selected' : ''}">
        <div class="marker-radar-ring"></div>
        <div class="marker-avatar-container">
          <svg class="battery-svg" viewBox="0 0 58 58">
            <circle class="battery-track" cx="29" cy="29" r="24"></circle>
            <circle class="battery-fill ${isCharging ? 'charging' : ''}"
                    cx="29" cy="29" r="24"
                    stroke="${battColor}"
                    stroke-dasharray="150.8"
                    stroke-dashoffset="${progressOffset}"></circle>
          </svg>
          <div class="avatar-photo" style="background-color: ${member.color || '#3B82F6'};">
            ${member.avatarUrl ? `<img src="${member.avatarUrl}" alt="${member.name}" />` : initials}
          </div>
          <div class="avatar-battery-pill ${battClass}">
            ${isCharging ? '⚡' : batt + '%'}
          </div>
        </div>
        ${statusTagHtml}
      </div>
    `;

    const customIcon = L.divIcon({
      html: markerHtml,
      className: 'life360-marker-wrapper',
      iconSize: [64, 82],
      iconAnchor: [32, 76],
    });

    if (memberMarkers.has(userId)) {
      const existing = memberMarkers.get(userId);
      existing.marker.setLatLng([lat, lng]);
      existing.marker.setIcon(customIcon);
      if (existing.accuracyCircle) {
        existing.accuracyCircle.setLatLng([lat, lng]);
        existing.accuracyCircle.setRadius(member.location.accuracy || 20);
      }
    } else {
      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      const accuracyCircle = L.circle([lat, lng], {
        radius: member.location.accuracy || 20,
        color: member.color || '#3B82F6',
        fillColor: member.color || '#3B82F6',
        fillOpacity: 0.08,
        weight: 1,
      }).addTo(map);

      marker.on('click', () => selectMember(userId));
      memberMarkers.set(userId, { marker, accuracyCircle });
    }
  }

  // 12. Atualiza Barra Recolhida do Bottom Sheet
  function updateCollapsedBar() {
    const avatarsEl = document.getElementById('collapsedAvatars');
    const titleEl = document.getElementById('collapsedTitle');
    const subtextEl = document.getElementById('collapsedSubtext');

    if (!avatarsEl) return;

    avatarsEl.innerHTML = membersData.slice(0, 3).map((m) => {
      const initials = m.name.substring(0, 2).toUpperCase();
      return `<div class="mini-avatar" style="background-color: ${m.color || '#3B82F6'}">${initials}</div>`;
    }).join('');

    titleEl.textContent = membersData.length > 0 ? `Círculo (${membersData.length} membros)` : 'Círculo Família';

    const movingCount = membersData.filter(m => m.location?.speed && m.location.speed > 5).length;
    subtextEl.textContent = movingCount > 0 ? `${movingCount} membro(s) em trânsito` : 'Todos seguros e locais atualizados';
  }

  // 13. Renderiza Lista de Membros
  function renderMembersList() {
    const listEl = document.getElementById('membersList');
    document.getElementById('memberCount').textContent = `${membersData.length} membro${membersData.length === 1 ? '' : 's'}`;

    if (membersData.length === 0) {
      listEl.innerHTML = '<div class="loading-state">Nenhum membro cadastrado.</div>';
      return;
    }

    listEl.innerHTML = membersData
      .map((m) => {
        const initials = m.name.substring(0, 2).toUpperCase();
        const batt = m.location?.battery !== undefined && m.location?.battery !== null ? Math.round(m.location.battery) : '--';
        const isCharging = m.location?.isCharging ? '⚡' : '';
        const battClass = batt !== '--' && batt < 20 ? 'low' : batt < 50 ? 'medium' : 'high';

        let subtext = 'Sem localização recente';
        if (m.location) {
          const speed = m.location.speed ? Math.round(m.location.speed) : 0;
          const currentPlace = m.currentPlace || findPlaceForCoords(m.location.latitude, m.location.longitude);

          if (speed > 5) {
            subtext = `🚗 Em trânsito (${speed} km/h)`;
          } else if (currentPlace) {
            const icon = PLACE_ICONS[currentPlace.icon] || '📍';
            subtext = `${icon} ${currentPlace.name} • ${formatRelativeTime(m.location.recordedAt)}`;
          } else {
            const addrKey = formatAddressKey(m.location.latitude, m.location.longitude);
            const cached = clientAddressCache.get(addrKey);
            if (cached && cached.address) {
              const shortAddr = cached.road || cached.address.split(' - ')[0] || cached.address;
              subtext = `📍 ${shortAddr} • ${formatRelativeTime(m.location.recordedAt)}`;
            } else {
              subtext = `📍 Localizando... • ${formatRelativeTime(m.location.recordedAt)}`;
              fetchAddressForCoords(m.location.latitude, m.location.longitude).then((data) => {
                if (data && data.address) {
                  const subEl = document.getElementById(`memberSubtext-${m.id}`);
                  if (subEl) {
                    const shortAddr = data.road || data.address.split(' - ')[0] || data.address;
                    subEl.textContent = `📍 ${shortAddr} • ${formatRelativeTime(m.location.recordedAt)}`;
                  }
                }
              });
            }
          }
        }

        const isSelected = selectedMemberId === m.id ? 'selected' : '';

        return `
          <div class="member-card ${isSelected}" onclick="window.selectMember('${m.id}')">
            <div class="member-avatar" style="background-color: ${m.color || '#3B82F6'}">
              ${initials}
              <div class="battery-badge ${battClass}">${batt}% ${isCharging}</div>
            </div>
            <div class="member-info">
              <div class="member-name">${m.name}</div>
              <div class="member-subtext" id="memberSubtext-${m.id}">${subtext}</div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // 14. Seleciona Membro e Abre Painel de Detalhes
  window.selectMember = function (userId) {
    selectedMemberId = userId;
    const member = membersData.find((m) => m.id === userId);
    if (!member) return;

    if (member.location) {
      map.flyTo([member.location.latitude, member.location.longitude], 16, {
        animate: true,
        duration: 1.2,
      });
    }

    membersData.forEach((m) => renderMemberMarker(m.id));

    document.getElementById('membersList').style.display = 'none';
    document.getElementById('memberDetailPanel').style.display = 'flex';
    renderMemberDetails(member);
    loadDriverReportForMember(userId);
  };

  function renderMemberDetails(member) {
    const initials = member.name.substring(0, 2).toUpperCase();
    const batt = member.location?.battery ? `${Math.round(member.location.battery)}%` : '--';
    const isCharging = member.location?.isCharging ? ' (Carregando ⚡)' : '';
    const speed = member.location?.speed ? `${Math.round(member.location.speed)} km/h` : '0 km/h';
    const accuracy = member.location?.accuracy ? `${Math.round(member.location.accuracy)} m` : '--';
    const updated = member.location?.recordedAt ? formatRelativeTime(member.location.recordedAt) : '--';

    document.getElementById('detailHeader').innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div class="member-avatar" style="background-color: ${member.color || '#3B82F6'}; width: 48px; height: 48px; font-size: 18px;">
          ${initials}
        </div>
        <div>
          <h3 style="font-size: 18px; font-weight: 700;">${member.name}</h3>
          <p style="font-size: 12px; color: var(--text-secondary);">${member.activeDevice?.name || 'Celular Principal'}</p>
        </div>
      </div>
    `;

    // Banner de Endereço / Lugar Estilo Life360
    const addrCard = document.getElementById('detailAddressCard');
    if (member.location) {
      addrCard.style.display = 'flex';
      const spd = member.location.speed ? Math.round(member.location.speed) : 0;
      const currentPlace = member.currentPlace || findPlaceForCoords(member.location.latitude, member.location.longitude);

      if (currentPlace) {
        const icon = PLACE_ICONS[currentPlace.icon] || '📍';
        addrCard.innerHTML = `
          <div class="detail-address-icon">${icon}</div>
          <div class="detail-address-info">
            <div class="detail-address-title">${currentPlace.name}</div>
            <div class="detail-address-sub" id="detailAddressSub">Cerca virtual • Atualizado ${updated}</div>
          </div>
        `;
        fetchAddressForCoords(member.location.latitude, member.location.longitude).then((data) => {
          if (data && data.address && selectedMemberId === member.id) {
            const subEl = document.getElementById('detailAddressSub');
            if (subEl) subEl.textContent = `${data.address} • Atualizado ${updated}`;
          }
        });
      } else if (spd > 5) {
        addrCard.innerHTML = `
          <div class="detail-address-icon">🚗</div>
          <div class="detail-address-info">
            <div class="detail-address-title">Em trânsito (${spd} km/h)</div>
            <div class="detail-address-sub" id="detailAddressSub">Velocidade ao vivo • Atualizado ${updated}</div>
          </div>
        `;
        fetchAddressForCoords(member.location.latitude, member.location.longitude).then((data) => {
          if (data && data.address && selectedMemberId === member.id) {
            const subEl = document.getElementById('detailAddressSub');
            if (subEl) subEl.textContent = `Próximo a ${data.address} • Atualizado ${updated}`;
          }
        });
      } else {
        const addrKey = formatAddressKey(member.location.latitude, member.location.longitude);
        const cached = clientAddressCache.get(addrKey);
        const initialTitle = cached?.road || cached?.address?.split(' - ')[0] || 'Localizando endereço...';
        const initialSub = cached?.address
          ? `${cached.suburb ? cached.suburb + ', ' : ''}${cached.city || ''} • Atualizado ${updated}`
          : `Coordenadas: ${member.location.latitude.toFixed(4)}, ${member.location.longitude.toFixed(4)}`;

        addrCard.innerHTML = `
          <div class="detail-address-icon">📍</div>
          <div class="detail-address-info">
            <div class="detail-address-title" id="detailAddressTitle">${initialTitle}</div>
            <div class="detail-address-sub" id="detailAddressSub">${initialSub}</div>
          </div>
        `;

        if (!cached) {
          fetchAddressForCoords(member.location.latitude, member.location.longitude).then((data) => {
            if (data && data.address && selectedMemberId === member.id) {
              const titleEl = document.getElementById('detailAddressTitle');
              const subEl = document.getElementById('detailAddressSub');
              if (titleEl) titleEl.textContent = data.road || data.address.split(' - ')[0] || data.address;
              if (subEl) subEl.textContent = `${data.suburb ? data.suburb + ', ' : ''}${data.city || ''} • Atualizado ${updated}`;
            }
          });
        }
      }
    } else {
      addrCard.style.display = 'none';
    }

    document.getElementById('detailStats').innerHTML = `
      <div class="stat-box">
        <div class="stat-label">Bateria</div>
        <div class="stat-val">${batt}${isCharging}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Velocidade</div>
        <div class="stat-val">${speed}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Precisão GPS</div>
        <div class="stat-val">±${accuracy}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Atualizado</div>
        <div class="stat-val">${updated}</div>
      </div>
    `;
  }

  // 15. Relatório de Direção e Histórico (Platinum / Gold Features)
  function setupDriverReportAndHistory() {
    // Definir data padrão no input de data (hoje)
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('historyDateInput');
    if (dateInput) dateInput.value = todayStr;

    // Botão Como Chegar (Google Maps Nav)
    document.getElementById('btnNavigateToMember').addEventListener('click', () => {
      const member = membersData.find(m => m.id === selectedMemberId);
      if (!member || !member.location) {
        showToast('Localização do membro indisponível.');
        return;
      }
      const url = `https://www.google.com/maps/dir/?api=1&destination=${member.location.latitude},${member.location.longitude}`;
      window.open(url, '_blank');
    });

    // Botão Carregar Histórico e Iniciar Replay
    document.getElementById('btnShowHistory').addEventListener('click', () => loadAndPlayHistoryForMember(selectedMemberId));

    document.getElementById('btnLoadCustomDateHistory').addEventListener('click', () => {
      const customDate = document.getElementById('historyDateInput').value;
      if (!customDate) {
        showToast('Selecione uma data válida.');
        return;
      }
      loadAndPlayHistoryForMember(selectedMemberId, customDate);
    });

    document.getElementById('btnClearHistory').addEventListener('click', clearHistoryOverlay);
  }

  async function loadAndPlayHistoryForMember(userId, dateStr = null) {
    if (!userId) return;

    try {
      let url = `/api/members/${userId}/history?limit=500`;
      if (dateStr) {
        const from = `${dateStr}T00:00:00.000Z`;
        const to = `${dateStr}T23:59:59.999Z`;
        url = `/api/members/${userId}/history?from=${from}&to=${to}&limit=1000`;
      }

      const res = await apiFetch(url);
      const history = await res.json();

      if (!history || history.length === 0) {
        showToast('Nenhum registro de histórico encontrado para este período.');
        return;
      }

      replayPoints = history;

      if (historyPolyline) map.removeLayer(historyPolyline);

      const latlngs = history.map((pt) => [pt.latitude, pt.longitude]);
      historyPolyline = L.polyline(latlngs, {
        color: '#6366F1',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      map.fitBounds(historyPolyline.getBounds(), { padding: [50, 50] });
      document.getElementById('btnClearHistory').style.display = 'block';

      // Abre barra do Player de Replay
      document.getElementById('replayPlayerBar').style.display = 'block';
      document.getElementById('replaySlider').max = history.length - 1;
      document.getElementById('replaySlider').value = 0;
      replayIndex = 0;

      updateReplayUI();
      showToast(`Histórico carregado (${history.length} pontos). Replay pronto!`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar histórico.');
    }
  }

  function loadDriverReportForMember(userId) {
    apiFetch(`/api/members/${userId}/history?limit=200`)
      .then(res => res.json())
      .then(history => {
        if (!history || history.length === 0) return;

        let maxSpeed = 0;
        let totalDistKm = 0;
        let movingPointsCount = 0;
        let fastEvents = 0;

        for (let i = 0; i < history.length; i++) {
          const pt = history[i];
          const spd = pt.speed ? pt.speed * 3.6 : 0; // m/s para km/h
          if (spd > maxSpeed) maxSpeed = spd;
          if (spd > 5) movingPointsCount++;
          if (spd > 90) fastEvents++;

          if (i > 0) {
            const prev = history[i - 1];
            totalDistKm += calcHaversineDist(prev.latitude, prev.longitude, pt.latitude, pt.longitude);
          }
        }

        const totalMin = Math.round(movingPointsCount * 1.5); // estimativa de tempo

        document.getElementById('dMaxSpeed').textContent = `${Math.round(maxSpeed)} km/h`;
        document.getElementById('dDistance').textContent = `${totalDistKm.toFixed(1)} km`;
        document.getElementById('dTime').textContent = `${totalMin} min`;
        document.getElementById('dEvents').textContent = fastEvents;

        const gradeEl = document.getElementById('driverGrade');
        if (maxSpeed > 100 || fastEvents > 2) {
          gradeEl.textContent = 'Atenção';
          gradeEl.className = 'driver-grade danger';
        } else if (maxSpeed > 80) {
          gradeEl.textContent = 'Bom';
          gradeEl.className = 'driver-grade warning';
        } else {
          gradeEl.textContent = 'Excelente';
          gradeEl.className = 'driver-grade';
        }
      })
      .catch(err => console.error('Erro ao calcular driver report:', err));
  }

  function calcHaversineDist(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function clearHistoryOverlay() {
    if (historyPolyline) {
      map.removeLayer(historyPolyline);
      historyPolyline = null;
    }
    if (replayMarker) {
      map.removeLayer(replayMarker);
      replayMarker = null;
    }
    stopReplay();
    document.getElementById('replayPlayerBar').style.display = 'none';
    document.getElementById('btnClearHistory').style.display = 'none';
  }

  // Setup Replay Player controls
  function setupReplayPlayer() {
    const playBtn = document.getElementById('btnReplayPlay');
    const slider = document.getElementById('replaySlider');
    const rateBtn = document.getElementById('btnReplayRate');
    const closeBtn = document.getElementById('btnReplayClose');

    playBtn.addEventListener('click', () => {
      if (replayPlaying) {
        pauseReplay();
      } else {
        startReplay();
      }
    });

    slider.addEventListener('input', (e) => {
      replayIndex = parseInt(e.target.value, 10);
      updateReplayPosition();
    });

    rateBtn.addEventListener('click', () => {
      if (replaySpeedMultiplier === 1) {
        replaySpeedMultiplier = 2;
      } else if (replaySpeedMultiplier === 2) {
        replaySpeedMultiplier = 4;
      } else {
        replaySpeedMultiplier = 1;
      }
      rateBtn.textContent = `${replaySpeedMultiplier}x`;
    });

    closeBtn.addEventListener('click', clearHistoryOverlay);
  }

  function startReplay() {
    if (!replayPoints || replayPoints.length === 0) return;
    replayPlaying = true;
    document.getElementById('btnReplayPlay').textContent = '⏸️';

    const intervalTime = Math.max(100, 600 / replaySpeedMultiplier);

    replayTimer = setInterval(() => {
      if (replayIndex >= replayPoints.length - 1) {
        pauseReplay();
        replayIndex = 0;
        return;
      }
      replayIndex++;
      document.getElementById('replaySlider').value = replayIndex;
      updateReplayPosition();
    }, intervalTime);
  }

  function pauseReplay() {
    replayPlaying = false;
    document.getElementById('btnReplayPlay').textContent = '▶️';
    if (replayTimer) {
      clearInterval(replayTimer);
      replayTimer = null;
    }
  }

  function stopReplay() {
    pauseReplay();
    replayIndex = 0;
  }

  function updateReplayPosition() {
    if (!replayPoints || replayPoints.length === 0) return;
    const pt = replayPoints[replayIndex];
    if (!pt) return;

    const latlng = [pt.latitude, pt.longitude];
    const speed = pt.speed ? Math.round(pt.speed * 3.6) : 0;
    const timeStr = new Date(pt.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    document.getElementById('replayTime').textContent = timeStr;
    document.getElementById('replaySpeed').textContent = `${speed} km/h`;

    if (!replayMarker) {
      replayMarker = L.marker(latlng, {
        icon: L.divIcon({
          html: `<div style="background:#6366F1; color:white; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 4px 12px rgba(99,102,241,0.5);">🚗</div>`,
          className: 'replay-car-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
      }).addTo(map);
    } else {
      replayMarker.setLatLng(latlng);
    }
    map.panTo(latlng);
  }

  function updateReplayUI() {
    if (!replayPoints || replayPoints.length === 0) return;
    updateReplayPosition();
  }

  // 16. Fluxo de SOS e Pânico de Emergência
  function setupSosFlow() {
    const btnTopSos = document.getElementById('btnTopSos');
    const btnSheetSos = document.getElementById('btnSheetSos');
    const sosConfirmModal = document.getElementById('sosConfirmModal');
    const btnCancelSos = document.getElementById('btnCancelSos');
    const btnConfirmSosNow = document.getElementById('btnConfirmSosNow');

    const openConfirmModal = () => {
      currentSosCountdown = 5;
      document.getElementById('sosCountdown').textContent = currentSosCountdown;
      sosConfirmModal.style.display = 'flex';

      sosCountdownInterval = setInterval(() => {
        currentSosCountdown--;
        document.getElementById('sosCountdown').textContent = currentSosCountdown;
        if (currentSosCountdown <= 0) {
          clearInterval(sosCountdownInterval);
          executeSosDispatch();
        }
      }, 1000);
    };

    btnTopSos.addEventListener('click', openConfirmModal);
    btnSheetSos.addEventListener('click', openConfirmModal);

    btnCancelSos.addEventListener('click', () => {
      if (sosCountdownInterval) clearInterval(sosCountdownInterval);
      sosConfirmModal.style.display = 'none';
    });

    btnConfirmSosNow.addEventListener('click', () => {
      if (sosCountdownInterval) clearInterval(sosCountdownInterval);
      executeSosDispatch();
    });

    document.getElementById('btnSosDismiss').addEventListener('click', () => {
      document.getElementById('sosEmergencyOverlay').style.display = 'none';
    });
  }

  async function executeSosDispatch() {
    document.getElementById('sosConfirmModal').style.display = 'none';

    // Usuário atual (primeiro membro do círculo) com sua posição e bateria
    const user = getCurrentUser();
    const loc = user.location;

    const payload = {
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
      battery: loc.battery || 90,
      message: `🚨 ALERTA DE EMERGÊNCIA: ${user.name} acionou o SOS de pânico!`,
    };

    // Envia via WebSocket se aberto, ou via REST API
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'TRIGGER_SOS', data: payload }));
    } else {
      try {
        await apiFetch('/api/emergency/sos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error('Erro ao enviar SOS via REST:', err);
      }
    }

    triggerSosEmergencyOverlay(payload);
  }

  function triggerSosEmergencyOverlay(alert) {
    const overlay = document.getElementById('sosEmergencyOverlay');
    document.getElementById('sosSenderText').textContent = `${alert.userName || 'Membro'} acionou o botão de pânico SOS!`;

    document.getElementById('sosEmergencyStats').innerHTML = `
      <div class="emergency-stat-item">
        <div class="e-label">Bateria</div>
        <div class="e-val">${alert.battery !== undefined ? alert.battery + '%' : '--'}</div>
      </div>
      <div class="emergency-stat-item">
        <div class="e-label">Horário</div>
        <div class="e-val">${new Date(alert.triggeredAt || Date.now()).toLocaleTimeString()}</div>
      </div>
    `;

    document.getElementById('btnSosNavigate').onclick = () => {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${alert.latitude},${alert.longitude}`;
      window.open(url, '_blank');
    };

    overlay.style.display = 'flex';
  }

  // 17. Modal Novo Lugar & Seletor de Ícones
  const placeModal = document.getElementById('placeModal');
  const radiusInput = document.getElementById('placeRadius');
  const radiusVal = document.getElementById('radiusVal');

  radiusInput.addEventListener('input', () => {
    radiusVal.textContent = `${radiusInput.value}m`;
  });

  document.querySelectorAll('.icon-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.icon-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      document.getElementById('placeIcon').value = chip.dataset.icon;
      document.getElementById('placeColor').value = chip.dataset.color;
    });
  });

  function openCreatePlaceModal() {
    document.getElementById('placeModalTitle').textContent = 'Novo Lugar (Cerca Virtual)';
    document.getElementById('btnSavePlace').textContent = 'Salvar Lugar';
    document.getElementById('placeId').value = '';
    document.getElementById('placeForm').reset();
    const center = map.getCenter();
    document.getElementById('placeLat').value = center.lat.toFixed(6);
    document.getElementById('placeLng').value = center.lng.toFixed(6);
    document.getElementById('placeRadius').value = 100;
    document.getElementById('radiusVal').textContent = '100m';
    document.getElementById('placeIcon').value = 'home';
    document.getElementById('placeColor').value = '#10B981';
    document.querySelectorAll('.icon-chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.icon === 'home');
    });
    placeModal.style.display = 'flex';
  }

  document.getElementById('btnAddPlace').addEventListener('click', openCreatePlaceModal);
  document.getElementById('btnAddPlaceFromSheet').addEventListener('click', openCreatePlaceModal);

  document.getElementById('btnClosePlaceModal').addEventListener('click', () => {
    placeModal.style.display = 'none';
  });
  document.getElementById('btnCancelPlace').addEventListener('click', () => {
    placeModal.style.display = 'none';
  });

  document.getElementById('placeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const placeId = document.getElementById('placeId').value;
    const name = document.getElementById('placeName').value;
    const latitude = parseFloat(document.getElementById('placeLat').value);
    const longitude = parseFloat(document.getElementById('placeLng').value);
    const radiusMeters = parseFloat(radiusInput.value);
    const icon = document.getElementById('placeIcon').value;
    const color = document.getElementById('placeColor').value;

    const isEdit = !!placeId;
    const url = isEdit ? `/api/places/${placeId}` : '/api/places';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, latitude, longitude, radiusMeters, icon, color }),
      });

      if (res.ok) {
        placeModal.style.display = 'none';
        document.getElementById('placeForm').reset();
        document.getElementById('placeId').value = '';
        showToast(isEdit ? `Lugar "${name}" atualizado!` : `Lugar "${name}" cadastrado!`);
        await loadPlaces();

        // Atualiza status dos membros caso o raio ou lugar tenha mudado
        membersData.forEach((m) => {
          if (m.location) {
            m.currentPlace = findPlaceForCoords(m.location.latitude, m.location.longitude);
          }
        });
        renderMembersList();
        if (selectedMemberId) {
          const sel = membersData.find((m) => m.id === selectedMemberId);
          if (sel) renderMemberDetails(sel);
        }
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao salvar lugar');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar lugar');
    }
  });

  // Notificações Toast
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // Utilitário de tempo relativo
  function formatRelativeTime(dateString) {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 10) return 'Agora mesmo';
    if (diff < 60) return `Há ${diff}s`;
    if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
    return `Há ${Math.floor(diff / 3600)}h`;
  }

  // Inicialização
  // Inicializa a aplicação somente após autenticação bem-sucedida
  function startApp() {
    if (appStarted) {
      loadMembers();
      loadPlaces();
      loadChat();
      connectWebSocket();
      return;
    }
    appStarted = true;

    initMap();
    connectWebSocket();
    loadMembers();
    loadPlaces();
    loadChat();
  }

  async function bootstrapAuth() {
    setupAuthForm();
    document.getElementById('btnLogout').addEventListener('click', logout);

    const authenticated = await checkAuthStatus();
    if (authenticated) startApp();
  }

  bootstrapAuth();
});
