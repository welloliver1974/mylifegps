// My Life360 Web / PWA App Core (Estilo Life360 Oficial + Todos os Recursos Premium Desbloqueados)
document.addEventListener('DOMContentLoaded', () => {
  let map;
  let currentTileLayer = null;
  let cartoKey = '';
  let currentLayerType = localStorage.getItem('life360_map_layer') || 'voyager';
  // Se o mapa foi alterado para 'dark' anteriormente pelo tema, restaura para o padrão Voyager (Life360 Clean)
  if (currentLayerType === 'dark') {
    currentLayerType = 'voyager';
    localStorage.setItem('life360_map_layer', 'voyager');
  }

  let memberMarkers = new Map(); // userId -> { marker, accuracyCircle }
  let placeLayers = new Map();   // placeId -> { circle, labelMarker }
  let historyPolyline = null;
  let tripStartMarker = null;
  let tripEndMarker = null;
  let tripEventMarkers = [];
  let replayMarker = null;
  let replayTimer = null;
  let replayIndex = 0;
  let replayPoints = [];
  let replayPlaying = false;
  let replaySpeedMultiplier = 1;

  function clearTripEventMarkers() {
    if (tripEventMarkers && tripEventMarkers.length > 0) {
      tripEventMarkers.forEach((m) => {
        try { map.removeLayer(m); } catch {}
      });
      tripEventMarkers = [];
    }
  }

  let membersData = [];
  let placesData = [];
  let selectedMemberId = null;
  let ws = null;

  let sosCountdownInterval = null;
  let currentSosCountdown = 5;

  // ---------- Gerenciamento de Tema (Claro / Escuro) ----------
  function getPreferredTheme() {
    const saved = localStorage.getItem('life360_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('life360_theme', theme);

    const icon = document.getElementById('themeToggleIcon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    const btn = document.getElementById('btnToggleTheme');
    if (btn) {
      btn.title = theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro';
    }
  }

  // Aplica tema imediatamente ao carregar a página (sem alterar os tiles do mapa)
  applyTheme(getPreferredTheme());

  // ---------- Autenticação ----------
  const AUTH_TOKEN_KEY = 'life360_auth_token';
  let authToken = localStorage.getItem(AUTH_TOKEN_KEY) || '';
  let currentAuthUser = null;
  let authMode = 'login'; // 'login' | 'setup'
  let appStarted = false;

  let isCheckingAuth = false;

  // Estado de Reações e Menções no Chat (Etapa 9.5)
  const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥', '✅'];
  const chatMessageMeta = new Map(); // messageId -> { isDm, reactions }
  let reactionPickerEl = null;
  let mentionSuggestEl = null;

  // Estado do Relatório de Direção Histórico (Etapa 9.6)
  let driverReportPeriod = 'today'; // 'today' | 'week' | 'month'
  let driverChartMetric = 'score'; // 'score' | 'km'
  let currentHistoricalReport = null;

  // Wrapper de fetch que injeta o token e trata sessão expirada
  function apiFetch(url, options = {}) {
    const opts = { ...options, headers: { ...(options.headers || {}) } };
    if (authToken) opts.headers['Authorization'] = `Bearer ${authToken}`;

    return fetch(url, opts).then((res) => {
      // Ignora 401 de telemetria ou rotas de auth para não deslogar o usuário erroneamente
      if (res.status === 401 && !url.startsWith('/api/auth/') && !url.startsWith('/api/telemetry')) {
        handleUnauthorized(url);
      }
      return res;
    });
  }

  async function handleUnauthorized(failedUrl) {
    if (isCheckingAuth) return;
    isCheckingAuth = true;

    try {
      // Confere se a sessão realmente expirou ou se foi erro pontual de rota/permissão
      const verifyRes = await fetch('/api/auth/me', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (verifyRes.ok) {
        console.warn(`[Auth] Endpoint ${failedUrl || 'desconhecido'} retornou 401, mas a sessão continua válida.`);
        isCheckingAuth = false;
        return;
      }
    } catch (err) {
      // Oscilação de rede não deve deslogar o usuário
      console.warn('[Auth] Falha de rede ao verificar sessão:', err);
      isCheckingAuth = false;
      return;
    }

    isCheckingAuth = false;
    authToken = '';
    currentAuthUser = null;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    showAuthScreen('login', 'Sua sessão expirou. Entre novamente.');
  }

  function showAuthScreen(mode, message) {
    authMode = mode;
    const screen = document.getElementById('authScreen');
    const subtitle = document.getElementById('authSubtitle');
    const nameGroup = document.getElementById('authNameGroup');
    const inviteGroup = document.getElementById('authInviteGroup');
    const resetCodeGroup = document.getElementById('authResetCodeGroup');
    const passwordLabel = document.getElementById('authPasswordLabel');
    const confirmGroup = document.getElementById('authConfirmPasswordGroup');
    const submitBtn = document.getElementById('authSubmitBtn');
    const footnote = document.getElementById('authFootnote');
    const errorEl = document.getElementById('authError');
    const toggleWrap = document.getElementById('authToggleWrap');
    const toggleBtn = document.getElementById('btnToggleAuthMode');
    const forgotWrap = document.getElementById('authForgotWrap');
    const backToLoginWrap = document.getElementById('authBackToLoginWrap');

    screen.classList.remove('hidden');

    if (mode === 'setup') {
      subtitle.textContent = 'Primeira configuração: crie sua conta de administrador e seu círculo';
      nameGroup.style.display = 'block';
      if (inviteGroup) inviteGroup.style.display = 'none';
      if (resetCodeGroup) resetCodeGroup.style.display = 'none';
      if (confirmGroup) confirmGroup.style.display = 'none';
      if (passwordLabel) passwordLabel.textContent = 'Senha';
      submitBtn.textContent = 'Criar conta e entrar';
      footnote.textContent = 'Esta conta protegerá o acesso a todas as localizações da família.';
      document.getElementById('authPassword').setAttribute('autocomplete', 'new-password');
      if (toggleWrap) toggleWrap.style.display = 'none';
      if (forgotWrap) forgotWrap.style.display = 'none';
      if (backToLoginWrap) backToLoginWrap.style.display = 'none';
    } else if (mode === 'invite') {
      subtitle.textContent = 'Entre no círculo da sua família com seu código de convite';
      nameGroup.style.display = 'block';
      if (inviteGroup) inviteGroup.style.display = 'block';
      if (resetCodeGroup) resetCodeGroup.style.display = 'none';
      if (confirmGroup) confirmGroup.style.display = 'none';
      if (passwordLabel) passwordLabel.textContent = 'Senha';
      submitBtn.textContent = 'Criar conta e entrar no círculo';
      footnote.textContent = 'Você fará parte do círculo familiar correspondente ao código.';
      document.getElementById('authPassword').setAttribute('autocomplete', 'new-password');
      if (toggleWrap) toggleWrap.style.display = 'block';
      if (toggleBtn) toggleBtn.textContent = 'Já tem uma conta? Fazer login';
      if (forgotWrap) forgotWrap.style.display = 'none';
      if (backToLoginWrap) backToLoginWrap.style.display = 'none';
    } else if (mode === 'reset') {
      subtitle.textContent = 'Redefinir senha com código de recuperação';
      nameGroup.style.display = 'none';
      if (inviteGroup) inviteGroup.style.display = 'none';
      if (resetCodeGroup) resetCodeGroup.style.display = 'block';
      if (confirmGroup) confirmGroup.style.display = 'block';
      if (passwordLabel) passwordLabel.textContent = 'Nova Senha';
      submitBtn.textContent = 'Redefinir Senha e Entrar';
      footnote.textContent = 'Insira o código fornecido pelo administrador da família ou gerado no servidor.';
      document.getElementById('authPassword').setAttribute('autocomplete', 'new-password');
      if (toggleWrap) toggleWrap.style.display = 'none';
      if (forgotWrap) forgotWrap.style.display = 'none';
      if (backToLoginWrap) backToLoginWrap.style.display = 'block';
    } else {
      subtitle.textContent = 'Entre para acessar o círculo da família';
      nameGroup.style.display = 'none';
      if (inviteGroup) inviteGroup.style.display = 'none';
      if (resetCodeGroup) resetCodeGroup.style.display = 'none';
      if (confirmGroup) confirmGroup.style.display = 'none';
      if (passwordLabel) passwordLabel.textContent = 'Senha';
      submitBtn.textContent = 'Entrar';
      footnote.textContent = 'Seus dados ficam apenas no seu próprio servidor.';
      document.getElementById('authPassword').setAttribute('autocomplete', 'current-password');
      if (toggleWrap) toggleWrap.style.display = 'block';
      if (toggleBtn) toggleBtn.textContent = 'Tenho um código de convite da família';
      if (forgotWrap) forgotWrap.style.display = 'block';
      if (backToLoginWrap) backToLoginWrap.style.display = 'none';
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
    setTimeout(() => {
      if (map) {
        try { map.invalidateSize(); } catch (_e) {}
      }
    }, 100);
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
        const data = await res.json();
        currentAuthUser = data.user || null;
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
    const toggleBtn = document.getElementById('btnToggleAuthMode');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (authMode === 'login') {
          showAuthScreen('invite');
        } else {
          showAuthScreen('login');
        }
      });
    }

    const forgotBtn = document.getElementById('btnForgotPass');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', () => {
        showAuthScreen('reset');
      });
    }

    const backToLoginBtn = document.getElementById('btnBackToLogin');
    if (backToLoginBtn) {
      backToLoginBtn.addEventListener('click', () => {
        showAuthScreen('login');
      });
    }

    document.getElementById('authForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('authSubmitBtn');
      const errorEl = document.getElementById('authError');
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const name = document.getElementById('authName').value.trim();
      const inviteCode = document.getElementById('authInviteCode')?.value.trim();
      const resetCode = document.getElementById('authResetCode')?.value.trim();
      const confirmPassword = document.getElementById('authConfirmPassword')?.value;

      errorEl.style.display = 'none';
      submitBtn.disabled = true;

      let endpoint = '/api/auth/login';
      let payload = { email, password };

      if (authMode === 'setup') {
        endpoint = '/api/auth/setup';
        payload = { name, email, password };
      } else if (authMode === 'invite') {
        endpoint = '/api/auth/register-with-invite';
        payload = { name, email, password, inviteCode };
      } else if (authMode === 'reset') {
        if (!resetCode) {
          errorEl.textContent = 'Informe o código de recuperação (REC-XXXX-XXXX).';
          errorEl.style.display = 'block';
          submitBtn.disabled = false;
          return;
        }
        if (password.length < 8) {
          errorEl.textContent = 'A nova senha precisa ter ao menos 8 caracteres.';
          errorEl.style.display = 'block';
          submitBtn.disabled = false;
          return;
        }
        if (password !== confirmPassword) {
          errorEl.textContent = 'A confirmação de senha não confere com a nova senha.';
          errorEl.style.display = 'block';
          submitBtn.disabled = false;
          return;
        }
        endpoint = '/api/auth/reset-password';
        payload = { email, code: resetCode, newPassword: password };
      }

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
        currentAuthUser = data.user || null;
        localStorage.setItem(AUTH_TOKEN_KEY, authToken);
        document.getElementById('authPassword').value = '';
        if (document.getElementById('authConfirmPassword')) document.getElementById('authConfirmPassword').value = '';
        if (document.getElementById('authResetCode')) document.getElementById('authResetCode').value = '';
        hideAuthScreen();
        if (authMode === 'reset') {
          showToast('Senha redefinida com sucesso! Bem-vindo.');
        }
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

    // Fecha qualquer episódio de uso de celular ainda em aberto antes de perder o token
    try { flushPhoneUsage(); } catch (_e) {}
    try { stopPhoneUsageTracker(); } catch (_e) {}

    authToken = '';
    currentAuthUser = null;
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
    const cleanKey = encodeURIComponent(
      String(cartoKey || '')
        .replace(/^CARTO_API_KEY\s*=\s*/i, '')
        .replace(/^["']|["']$/g, '')
        .trim()
    );

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
        url: cleanKey
          ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${cleanKey}`
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      };
    }
    // Padrão: Voyager (Life360 Clean)
    return {
      url: cleanKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cleanKey}`
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
    if (map) {
      try { map.invalidateSize(); } catch (_e) {}
      return;
    }

    try {
      map = L.map('map', {
        zoomControl: false,
        attributionControl: true,
      }).setView([-23.55052, -46.633308], 14);

      try {
        const cfgRes = await fetch('/api/config');
        if (cfgRes.ok) {
          const cfg = await cfgRes.json();
          if (cfg?.cartoApiKey) {
            cartoKey = String(cfg.cartoApiKey)
              .replace(/^CARTO_API_KEY\s*=\s*/i, '')
              .replace(/^["']|["']$/g, '')
              .trim();
          }
        }
      } catch (err) {
        console.warn('Não foi possível obter config do servidor:', err);
      }

      switchBaseLayer(currentLayerType);

      map.on('click', (e) => {
        const latInput = document.getElementById('placeLat');
        const lngInput = document.getElementById('placeLng');
        const modal = document.getElementById('placeModal');
        if (latInput && lngInput && modal) {
          latInput.value = e.latlng.lat.toFixed(6);
          lngInput.value = e.latlng.lng.toFixed(6);
          modal.style.display = 'flex';
        }
      });

      setupFloatingControls();
      setupBottomsheetGestures();
      setupCircleMenu();
      setupThemeToggle();
      setupChat();
      setupAlerts();
      setupSosFlow();
      setupProfileModal();
      setupReplayPlayer();
      setupDriverReportAndHistory();
      setupDevicesModal();
      setupAdminModal();
      setupResetCodeModal();

      // Força Leaflet a calcular as dimensões reais da tela após o container se tornar visível
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 100);
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 500);

      window.addEventListener('resize', () => {
        if (map) map.invalidateSize();
      });
    } catch (err) {
      console.error('Erro crítico ao inicializar mapa:', err);
      showToast('Erro ao carregar mapa: ' + (err?.message || err));
    }
  }

  // 3. Controles Flutuantes do Mapa
  function setupFloatingControls() {
    const popover = document.getElementById('layerPopover');
    const btnLayers = document.getElementById('btnToggleLayers');

    if (btnLayers && popover) {
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
    }

    document.querySelectorAll('.layer-card').forEach((card) => {
      card.addEventListener('click', () => {
        const type = card.dataset.layer;
        switchBaseLayer(type);
        if (popover) popover.style.display = 'none';
      });
    });

    const btnRecenter = document.getElementById('btnRecenterFab');
    if (btnRecenter) {
      btnRecenter.addEventListener('click', fitAllMembers);
    }

    const btnFitAll = document.getElementById('btnFitAll');
    if (btnFitAll) {
      btnFitAll.addEventListener('click', fitAllMembers);
    }

    const btnZoomIn = document.getElementById('btnZoomIn');
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => map && map.zoomIn());
    }

    const btnZoomOut = document.getElementById('btnZoomOut');
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => map && map.zoomOut());
    }
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

    const desktopReopenBtn = document.getElementById('btnDesktopReopenSheet');

    const updateDesktopReopenState = () => {
      if (!isDesktop()) {
        if (desktopReopenBtn) desktopReopenBtn.style.display = 'none';
        return;
      }
      const isCollapsed = sheet.classList.contains('collapsed-desktop');
      if (desktopReopenBtn) {
        desktopReopenBtn.style.display = isCollapsed ? 'inline-flex' : 'none';
      }
    };

    if (desktopReopenBtn) {
      desktopReopenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sheet.classList.remove('collapsed-desktop');
        toggleBtn.textContent = '▾';
        toggleBtn.title = 'Minimizar painel';
        desktopReopenBtn.style.display = 'none';
      });
    }

    window.addEventListener('resize', updateDesktopReopenState);

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
        updateDesktopReopenState();
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
        updateDesktopReopenState();
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
        updateDesktopReopenState();
      }
    });
  }

  // 4b. Menu do Círculo Familiar, Código de Convite Real e Gestão de Membros (Etapa 9.1)
  let currentCircle = null;

  async function loadCircleData() {
    try {
      const res = await apiFetch('/api/circle');
      if (!res.ok) return;
      const data = await res.json();
      currentCircle = data;

      const inviteCodeEl = document.getElementById('circleInviteCode');
      if (inviteCodeEl) inviteCodeEl.textContent = data.inviteCode || 'INDISPONÍVEL';

      const circleDisplayName = data.name || 'Família';
      const titleEl = document.getElementById('circleModalTitle');
      if (titleEl) titleEl.textContent = 'Círculo ' + circleDisplayName;

      const topTitle = document.querySelector('.circle-name-wrap h1');
      if (topTitle) topTitle.textContent = 'Círculo ' + circleDisplayName;

      const desktopReopenLabel = document.getElementById('desktopReopenCircleName');
      if (desktopReopenLabel) desktopReopenLabel.textContent = circleDisplayName;

      const editBox = document.getElementById('circleNameEditBox');
      const inputName = document.getElementById('inputCircleName');
      if (editBox && inputName) {
        if (data.myRole === 'admin') {
          editBox.style.display = 'block';
          inputName.value = circleDisplayName;
        } else {
          editBox.style.display = 'none';
        }
      }

      const btnRegenerate = document.getElementById('btnRegenerateInviteCode');
      if (btnRegenerate) {
        btnRegenerate.style.display = data.myRole === 'admin' ? 'inline-block' : 'none';
      }

      const countEl = document.getElementById('circleMemberCount');
      if (countEl) countEl.textContent = (data.members || []).length;

      const listEl = document.getElementById('circleMemberList');
      if (listEl) {
        if (!data.members || data.members.length === 0) {
          listEl.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-secondary); text-align: center; padding: 12px;">Nenhum membro encontrado.</div>';
          return;
        }

        listEl.innerHTML = data.members.map((m) => {
          const isCurrentUser = m.isCurrentUser;
          const isAdmin = m.roleInCircle === 'admin';
          const canRemove = data.myRole === 'admin' && !isCurrentUser;

          const avatarContent = m.avatarUrl
            ? `<img src="${escapeHtml(m.avatarUrl)}" alt="${escapeHtml(m.name)}" />`
            : `${escapeHtml((m.name || 'M')[0].toUpperCase())}`;

          return `
            <div class="circle-member-item" data-member-id="${escapeHtml(m.id)}">
              <div class="circle-member-info">
                <div class="circle-member-avatar" style="background: ${escapeHtml(m.color || '#3B82F6')}">
                  ${avatarContent}
                </div>
                <div>
                  <div class="circle-member-name">
                    ${escapeHtml(m.name)}
                    ${isCurrentUser ? '<span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">(Você)</span>' : ''}
                  </div>
                  <div style="font-size: 11px; color: var(--text-secondary);">
                    ${escapeHtml(m.email || m.phone || 'Membro do Círculo')}
                  </div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="circle-member-role-badge ${isAdmin ? 'admin' : 'member'}">
                  ${isAdmin ? 'Admin' : 'Membro'}
                </span>
                ${
                  data.myRole === 'admin'
                    ? `<button type="button" class="circle-member-reset-btn" title="Gerar código de recuperação de senha" data-reset-id="${escapeHtml(m.id)}" data-member-name="${escapeHtml(m.name)}" data-member-email="${escapeHtml(m.email || '')}">🔑</button>`
                    : ''
                }
                ${
                  canRemove
                    ? `<button type="button" class="circle-member-remove-btn" title="Remover membro do círculo" data-remove-id="${escapeHtml(m.id)}" data-member-name="${escapeHtml(m.name)}">🗑️</button>`
                    : ''
                }
              </div>
            </div>
          `;
        }).join('');

        // Listeners para botões de geração de código de recuperação de senha (Etapa 9.7)
        listEl.querySelectorAll('.circle-member-reset-btn').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const memberId = btn.getAttribute('data-reset-id');
            const memberName = btn.getAttribute('data-member-name');

            if (!confirm(`Gerar código temporário de recuperação de senha para ${memberName}?`)) {
              return;
            }

            try {
              const res = await apiFetch('/api/auth/generate-reset-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: memberId }),
              });
              const resData = await res.json();
              if (!res.ok) {
                showToast(resData.error || 'Erro ao gerar código de recuperação.');
                return;
              }

              const modal = document.getElementById('resetCodeModal');
              const targetNameEl = document.getElementById('resetTargetName');
              const displayCodeEl = document.getElementById('resetDisplayCode');

              if (targetNameEl) targetNameEl.textContent = memberName;
              if (displayCodeEl) displayCodeEl.textContent = resData.code;
              if (modal) modal.style.display = 'flex';
              showToast(`Código de recuperação gerado para ${memberName}!`);
            } catch (err) {
              console.error(err);
              showToast('Falha de conexão ao gerar código de recuperação.');
            }
          });
        });

        // Listeners para botões de remoção
        listEl.querySelectorAll('.circle-member-remove-btn').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const memberId = btn.getAttribute('data-remove-id');
            const memberName = btn.getAttribute('data-member-name');
            if (!confirm(`Tem certeza que deseja remover ${memberName} deste círculo familiar?`)) {
              return;
            }

            try {
              const delRes = await apiFetch(`/api/circle/members/${memberId}`, { method: 'DELETE' });
              const delData = await delRes.json();
              if (!delRes.ok) {
                showToast(delData.error || 'Erro ao remover membro.');
                return;
              }
              showToast(`${memberName} foi removido do círculo.`);
              await loadCircleData();
              loadMembers();
            } catch (err) {
              console.error(err);
              showToast('Erro de conexão ao remover membro.');
            }
          });
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados do círculo:', err);
    }
  }

  function setupCircleMenu() {
    const circleModal = document.getElementById('circleModal');
    const btnCircleMenu = document.getElementById('btnCircleMenu');
    const btnCloseCircleModal = document.getElementById('btnCloseCircleModal');
    const btnRegenerate = document.getElementById('btnRegenerateInviteCode');
    const btnJoinCircle = document.getElementById('btnSubmitJoinCircle');

    btnCircleMenu.addEventListener('click', () => {
      const btnAdmin = document.getElementById('btnOpenAdminModal');
      if (btnAdmin) {
        btnAdmin.style.display = currentAuthUser?.role === 'admin' ? 'block' : 'none';
      }
      loadCircleData();
      updatePushNotificationUI();
      circleModal.style.display = 'flex';
    });

    btnCloseCircleModal.addEventListener('click', () => {
      circleModal.style.display = 'none';
    });

    circleModal.addEventListener('click', (e) => {
      if (e.target === circleModal) circleModal.style.display = 'none';
    });

    document.getElementById('btnCopyInviteCode').addEventListener('click', async () => {
      const code = currentCircle?.inviteCode || document.getElementById('circleInviteCode').textContent;
      try {
        await navigator.clipboard.writeText(code);
        showToast('Código de convite copiado!');
      } catch {
        showToast(`Código: ${code}`);
      }
    });

    if (btnRegenerate) {
      btnRegenerate.addEventListener('click', async () => {
        if (!confirm('Deseja gerar um novo código de convite? O código anterior deixará de funcionar.')) {
          return;
        }

        try {
          const res = await apiFetch('/api/circle/invite/regenerate', { method: 'POST' });
          const data = await res.json();
          if (!res.ok) {
            showToast(data.error || 'Erro ao gerar novo código.');
            return;
          }
          showToast('Novo código de convite gerado com sucesso! 🎉');
          await loadCircleData();
        } catch (err) {
          console.error(err);
          showToast('Falha de conexão ao gerar código.');
        }
      });
    }

    if (btnJoinCircle) {
      btnJoinCircle.addEventListener('click', async () => {
        const input = document.getElementById('inputJoinCircleCode');
        const code = (input?.value || '').trim();
        if (!code) {
          showToast('Informe o código de convite.');
          return;
        }

        try {
          const res = await apiFetch('/api/circle/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inviteCode: code }),
          });
          const data = await res.json();
          if (!res.ok) {
            showToast(data.error || 'Não foi possível entrar no círculo.');
            return;
          }
          showToast(data.message || 'Você entrou no círculo! 🎉');
          if (input) input.value = '';
          await loadCircleData();
          loadMembers();
        } catch (err) {
          console.error(err);
          showToast('Falha de conexão ao entrar no círculo.');
        }
      });
    }

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

    // Salvar novo nome do círculo (Admin)
    const btnSaveCircleName = document.getElementById('btnSaveCircleName');
    if (btnSaveCircleName) {
      btnSaveCircleName.addEventListener('click', async () => {
        const inputName = document.getElementById('inputCircleName');
        const newName = (inputName?.value || '').trim();
        if (!newName) {
          showToast('O nome do círculo não pode ficar vazio.');
          return;
        }

        btnSaveCircleName.disabled = true;
        btnSaveCircleName.textContent = 'Salvando...';
        try {
          const res = await apiFetch('/api/circle/name', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName }),
          });
          const json = await res.json();
          if (!res.ok) {
            showToast(json.error || 'Erro ao renomear círculo.');
            return;
          }
          showToast(`Nome do círculo atualizado para "${json.name || newName}"! 🎉`);
          await loadCircleData();
        } catch (err) {
          console.error(err);
          showToast('Falha de conexão ao renomear círculo.');
        } finally {
          btnSaveCircleName.disabled = false;
          btnSaveCircleName.textContent = 'Salvar';
        }
      });
    }
  }

  // 4b2. Alternador de Tema Claro / Escuro
  function setupThemeToggle() {
    const btnTop = document.getElementById('btnToggleTheme');
    const btnModal = document.getElementById('btnModalToggleTheme');

    const toggle = () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(next === 'dark' ? '🌙 Modo Escuro ativado (Interface)' : '☀️ Modo Claro ativado');
    };

    if (btnTop) btnTop.addEventListener('click', toggle);
    if (btnModal) btnModal.addEventListener('click', toggle);

    // Garante que o ícone reflita o tema salvo
    applyTheme(getPreferredTheme());
  }

  // 4c. Chat do Círculo Familiar & Mensagens Diretas 1:1 (Etapa 8.8)
  const renderedChatIds = new Set();
  let activeChatChannel = 'circle'; // 'circle' ou userId de outro membro
  let unreadDmsBySender = {};

  async function loadUnreadDms() {
    try {
      const res = await apiFetch('/api/messages/unread');
      if (res.ok) {
        const data = await res.json();
        unreadDmsBySender = data.unreadBySender || {};
        renderChatTabs();
      }
    } catch (err) {
      console.warn('Erro ao carregar mensagens não lidas:', err);
    }
  }

  function renderChatTabs() {
    const container = document.getElementById('chatTabChips');
    if (!container) return;

    const me = getCurrentUser();
    let html = `
      <button type="button" class="chat-tab-chip ${activeChatChannel === 'circle' ? 'active' : ''}" data-channel="circle" onclick="window.switchChatChannel('circle')">
        👥 Círculo (Todos)
      </button>
    `;

    // Filtra membros da família exceto o próprio usuário logado
    const others = (membersData || []).filter((m) => m.id !== me.id);
    for (const member of others) {
      const isSelected = activeChatChannel === member.id;
      const unread = unreadDmsBySender[member.id] || 0;
      const initials = (member.name || '--').substring(0, 2).toUpperCase();
      const avatarHtml = member.avatarUrl
        ? `<div class="tab-avatar-mini"><img src="${member.avatarUrl}" alt="${member.name}" /></div>`
        : `<div class="tab-avatar-mini" style="background-color: ${member.color || '#3B82F6'};">${initials}</div>`;

      html += `
        <button type="button" class="chat-tab-chip ${isSelected ? 'active' : ''}" data-channel="${member.id}" onclick="window.switchChatChannel('${member.id}')">
          ${avatarHtml}
          <span>${member.name}</span>
          ${unread > 0 ? `<span class="tab-unread-badge">${unread}</span>` : ''}
        </button>
      `;
    }

    container.innerHTML = html;
  }

  window.switchChatChannel = (channelId) => {
    activeChatChannel = channelId;
    renderChatTabs();

    const input = document.getElementById('chatInput');
    if (channelId === 'circle') {
      input.placeholder = 'Mensagem para a família...';
    } else {
      const target = (membersData || []).find((m) => m.id === channelId);
      input.placeholder = `Mensagem privada para ${target?.name || 'membro'}...`;
      if (unreadDmsBySender[channelId]) {
        delete unreadDmsBySender[channelId];
        renderChatTabs();
      }
    }

    loadChat();
  };

  function setupChat() {
    document.getElementById('chatForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text) return;

      const user = getCurrentUser();
      input.value = '';

      try {
        if (activeChatChannel === 'circle') {
          await apiFetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              userName: user.name,
              userColor: user.color || '#3B82F6',
              text,
            }),
          });
        } else {
          const res = await apiFetch(`/api/messages/direct/${activeChatChannel}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Falha ao enviar DM');
          }
        }
      } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        showToast(`Erro ao enviar mensagem: ${err.message}`);
      }
    });

    setupMentionAutocomplete(document.getElementById('chatInput'));

    renderChatTabs();
    loadUnreadDms();
  }

  async function loadChat() {
    try {
      const container = document.getElementById('chatMessages');
      if (!container) return;

      let url = '/api/messages?limit=80';
      if (activeChatChannel !== 'circle') {
        url = `/api/messages/direct/${activeChatChannel}?limit=100`;
      }

      const res = await apiFetch(url);
      const messages = await res.json();

      if (!messages || messages.length === 0) {
        const emptyMsg = activeChatChannel === 'circle'
          ? 'Nenhuma mensagem no círculo ainda.'
          : 'Nenhuma mensagem direta ainda. Inicie a conversa!';
        container.innerHTML = `<div class="loading-state">${emptyMsg}</div>`;
        document.getElementById('chatCount').textContent = '0';
        return;
      }

      container.innerHTML = '';
      renderedChatIds.clear();
      messages.forEach((m) => appendChatMessage(m, true));
      container.scrollTop = container.scrollHeight;
    } catch (err) {
      console.error('Erro ao carregar chat:', err);
    }
  }

  function appendChatMessage(message, isBulkLoad = false) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const placeholder = container.querySelector('.loading-state');
    if (placeholder) placeholder.remove();

    const isDm = Boolean(message.receiverId);
    const key = message.id || `${message.userName || message.senderName}-${message.createdAt}-${message.text}`;
    if (renderedChatIds.has(key)) return;
    renderedChatIds.add(key);

    const me = getCurrentUser();
    const isMine = isDm
      ? message.senderId === me.id
      : Boolean(message.userId && message.userId === me.id);

    const authorName = isDm
      ? (isMine ? 'Você' : (message.senderName || 'Membro'))
      : (message.userName || 'Membro da Família');

    const authorColor = isDm
      ? (message.senderColor || '#3B82F6')
      : (message.userColor || '#3B82F6');

    const time = message.createdAt
      ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    const readIndicator = isDm && isMine
      ? `<span class="chat-read-status" title="${message.read ? 'Lida' : 'Entregue'}">${message.read ? '✓✓' : '✓'}</span>`
      : '';

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble${isMine ? ' mine' : ''}${isDm ? ' dm-bubble' : ''}`;
    bubble.setAttribute('data-msg-id', message.id || '');
    bubble.innerHTML = `
      <span class="chat-bubble-author" style="color: ${authorColor};">${authorName}${isDm ? ' (Privado)' : ''}</span>
      <span class="chat-bubble-text"></span>
      <span class="chat-bubble-footer">
        <span class="chat-bubble-time">${time}${readIndicator}</span>
        <button class="chat-react-trigger" type="button" title="Reagir com emoji">☺+</button>
      </span>
      <div class="chat-reactions-row"></div>
    `;

    const textEl = bubble.querySelector('.chat-bubble-text');
    renderChatTextWithMentions(textEl, message.text || '');

    // Reações vindas do servidor (objeto) ou legado (string JSON)
    const initialReactions = parseReactionsClient(message.reactions);
    chatMessageMeta.set(message.id, { isDm, reactions: initialReactions });
    renderReactionChips(bubble, message.id, initialReactions);

    const trigger = bubble.querySelector('.chat-react-trigger');
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        openReactionPicker(e.currentTarget, message.id);
      });
    }

    // Toque longo no balão também abre o seletor (padrão dos apps de mensagem)
    let pressTimer = null;
    bubble.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => openReactionPicker(bubble, message.id), 450);
    }, { passive: true });
    const cancelPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };
    bubble.addEventListener('touchend', cancelPress);
    bubble.addEventListener('touchmove', cancelPress);
    bubble.addEventListener('touchcancel', cancelPress);

    container.appendChild(bubble);
    if (!isBulkLoad) container.scrollTop = container.scrollHeight;

    const countEl = document.getElementById('chatCount');
    if (countEl) countEl.textContent = renderedChatIds.size;
  }

  // ==========================================================
  // 4c.1 Reações e Menções no Chat (Etapa 9.5)
  // ==========================================================
  /** Normaliza reações que podem chegar como objeto (novo) ou string JSON (legado). */
  function parseReactionsClient(raw) {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  /** Renderiza o texto do balão destacando as menções @nome. */
  function renderChatTextWithMentions(el, text) {
    if (!el) return;
    el.textContent = '';

    const names = (membersData || [])
      .map((m) => m.name)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    if (names.length === 0 || !text.includes('@')) {
      el.textContent = text;
      return;
    }

    const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
    const regex = new RegExp(`@(${escaped.join('|')})(?![\\p{L}\\p{N}])`, 'giu');

    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        el.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const span = document.createElement('span');
      span.className = 'chat-mention';
      span.textContent = match[0];
      el.appendChild(span);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      el.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  /** Desenha as pílulas de reação abaixo do balão. */
  function renderReactionChips(bubble, messageId, reactions) {
    const row = bubble.querySelector('.chat-reactions-row');
    if (!row) return;

    const me = getCurrentUser();
    const entries = Object.entries(reactions || {}).filter(([, users]) => users && users.length > 0);

    if (entries.length === 0) {
      row.innerHTML = '';
      row.style.display = 'none';
      return;
    }

    row.style.display = 'flex';
    row.innerHTML = entries
      .map(([emoji, users]) => {
        const mine = users.includes(me.id) ? ' mine' : '';
        return `<button type="button" class="chat-reaction-chip${mine}" data-emoji="${emoji}" title="${users.length} reação(ões)">
          <span class="reaction-emoji">${emoji}</span>
          <span class="reaction-count">${users.length}</span>
        </button>`;
      })
      .join('');

    row.querySelectorAll('.chat-reaction-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        sendReaction(messageId, chip.dataset.emoji);
      });
    });
  }

  /** Atualiza as reações de uma mensagem já renderizada (vinda por WebSocket ou resposta da API). */
  function applyReactionUpdate(messageId, reactions) {
    const bubble = document.querySelector(`.chat-bubble[data-msg-id="${messageId}"]`);
    if (!bubble) return;

    const meta = chatMessageMeta.get(messageId);
    if (meta) meta.reactions = reactions;
    renderReactionChips(bubble, messageId, reactions);
  }

  /** Abre o seletor flutuante de emojis ancorado no balão clicado. */
  function openReactionPicker(anchorEl, messageId) {
    closeReactionPicker();

    const picker = document.createElement('div');
    picker.className = 'reaction-picker';
    picker.innerHTML = REACTION_EMOJIS.map(
      (emoji) => `<button type="button" class="reaction-picker-btn" data-emoji="${emoji}">${emoji}</button>`
    ).join('');

    document.body.appendChild(picker);
    reactionPickerEl = picker;

    const rect = anchorEl.getBoundingClientRect();
    const pickerWidth = picker.offsetWidth || 260;
    let left = rect.left + rect.width / 2 - pickerWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - pickerWidth - 8));
    const top = Math.max(8, rect.top - picker.offsetHeight - 8);

    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;

    picker.querySelectorAll('.reaction-picker-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sendReaction(messageId, btn.dataset.emoji);
        closeReactionPicker();
      });
    });

    setTimeout(() => {
      document.addEventListener('click', closeReactionPicker, { once: true });
      document.addEventListener('touchstart', closeReactionPicker, { once: true });
    }, 0);
  }

  function closeReactionPicker() {
    if (reactionPickerEl && reactionPickerEl.parentNode) {
      reactionPickerEl.parentNode.removeChild(reactionPickerEl);
    }
    reactionPickerEl = null;
  }

  /** Envia a reação ao servidor (rota do círculo ou da conversa privada). */
  async function sendReaction(messageId, emoji) {
    if (!messageId || !emoji) return;

    const meta = chatMessageMeta.get(messageId);
    const isDm = meta ? meta.isDm : activeChatChannel !== 'circle';
    const me = getCurrentUser();

    const url = isDm ? `/api/messages/direct/react/${messageId}` : `/api/messages/${messageId}/react`;

    try {
      const res = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userId: me.id, userName: me.name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Não foi possível reagir.');
        return;
      }
      if (data.reactions) applyReactionUpdate(messageId, data.reactions);
    } catch (err) {
      console.error('Erro ao reagir:', err);
      showToast('Falha de conexão ao reagir.');
    }
  }

  // ==========================================================
  // 4c.2 Autocomplete de Menções @nome (Etapa 9.5)
  // ==========================================================

  function closeMentionSuggest() {
    if (mentionSuggestEl && mentionSuggestEl.parentNode) {
      mentionSuggestEl.parentNode.removeChild(mentionSuggestEl);
    }
    mentionSuggestEl = null;
  }

  /** Descobre o trecho "@parcial" que está sendo digitado antes do cursor. */
  function getMentionQuery(input) {
    const value = input.value;
    const caret = typeof input.selectionStart === 'number' ? input.selectionStart : value.length;
    const before = value.slice(0, caret);
    const atIndex = before.lastIndexOf('@');
    if (atIndex === -1) return null;

    const fragment = before.slice(atIndex + 1);
    // Aborta se houver quebra de linha ou se o trecho já for longo demais
    if (/[\n\r]/.test(fragment) || fragment.length > 30) return null;
    return { atIndex, fragment };
  }

  function showMentionSuggest(input, query) {
    const me = getCurrentUser();
    const fragment = query.fragment.toLowerCase();

    const matches = (membersData || [])
      .filter((m) => m.id !== me.id && m.name)
      .filter((m) => fragment === '' || m.name.toLowerCase().includes(fragment))
      .slice(0, 6);

    if (matches.length === 0) {
      closeMentionSuggest();
      return;
    }

    const list = document.createElement('div');
    list.className = 'mention-suggest-list';
    list.innerHTML = matches
      .map(
        (m) => `<button type="button" class="mention-suggest-item" data-name="${m.name.replace(/"/g, '&quot;')}">
          <span class="mention-avatar" style="background-color: ${m.color || '#3B82F6'};">${m.name.substring(0, 2).toUpperCase()}</span>
          <span class="mention-name">${m.name}</span>
        </button>`
      )
      .join('');

    const wrapper = input.closest('.chat-input-wrapper') || input.parentElement;
    if (wrapper) {
      wrapper.style.position = 'relative';
      wrapper.appendChild(list);
    } else {
      document.body.appendChild(list);
    }
    mentionSuggestEl = list;

    list.querySelectorAll('.mention-suggest-item').forEach((item) => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        insertMention(input, query, item.dataset.name);
      });
    });
  }

  function insertMention(input, query, name) {
    const value = input.value;
    const caret = typeof input.selectionStart === 'number' ? input.selectionStart : value.length;
    const after = value.slice(caret);
    const prefix = value.slice(0, query.atIndex);

    input.value = `${prefix}@${name} ${after.replace(/^\s+/, '')}`;
    const newCaret = prefix.length + name.length + 2;
    input.setSelectionRange(newCaret, newCaret);
    input.focus();
    closeMentionSuggest();
  }

  function setupMentionAutocomplete(input) {
    if (!input) return;

    input.addEventListener('input', () => {
      const query = getMentionQuery(input);
      if (!query) {
        closeMentionSuggest();
        return;
      }
      showMentionSuggest(input, query);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMentionSuggest();
    });

    input.addEventListener('blur', () => setTimeout(closeMentionSuggest, 150));
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

  // Retorna o usuário autenticado (fonte de verdade) com fallback para o primeiro membro do círculo
  function getCurrentUser() {
    const own = currentAuthUser && currentAuthUser.id
      ? membersData.find((m) => m.id === currentAuthUser.id)
      : null;

    if (currentAuthUser && currentAuthUser.id) {
      return {
        id: currentAuthUser.id,
        name: currentAuthUser.name || own?.name || 'Você',
        color: currentAuthUser.color || own?.color || '#3B82F6',
        avatarUrl: currentAuthUser.avatarUrl || own?.avatarUrl || '',
        location: own?.location || { latitude: -23.55052, longitude: -46.633308 },
      };
    }

    const user = membersData[0] || {};
    return {
      id: user.id || 'usr_me',
      name: user.name || 'Você',
      color: user.color || '#3B82F6',
      avatarUrl: user.avatarUrl || '',
      location: user.location || { latitude: -23.55052, longitude: -46.633308 },
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
        } else if (msg.type === 'LOCATION_UPDATE_REQUEST') {
          handleIncomingLocationUpdateRequest(msg.data);
        } else if (msg.type === 'GEOFENCE_ALERT') {
          showToast(msg.alert.message);
        } else if (msg.type === 'SOS_ALERT') {
          triggerSosEmergencyOverlay(msg.alert);
          loadSosHistory();
        } else if (msg.type === 'SOS_RESOLVED') {
          if (currentActiveSosAlert && (currentActiveSosAlert.id === msg.alert?.id || !msg.alert?.id)) {
            document.getElementById('sosEmergencyOverlay').style.display = 'none';
          }
          showToast(`✅ SOS resolvido por ${msg.alert?.resolvedByName || 'Família'}`);
          loadSosHistory();
        } else if (msg.type === 'CHECKIN_ALERT') {
          showToast(msg.alert?.message || '📍 Um membro fez check-in.');
        } else if (msg.type === 'BATTERY_LOW_ALERT') {
          showToast(msg.alert?.message || '🪫 Bateria fraca detectada em um membro.');
        } else if (msg.type === 'CHAT_MESSAGE') {
          if (activeChatChannel === 'circle') {
            appendChatMessage(msg.message);
          } else {
            showToast(`💬 Nova mensagem no Círculo de ${msg.message.userName}`);
          }
        } else if (msg.type === 'DIRECT_MESSAGE') {
          const dm = msg.message;
          const me = getCurrentUser();
          const otherId = dm.senderId === me.id ? dm.receiverId : dm.senderId;

          if (activeChatChannel === otherId) {
            appendChatMessage(dm);
            if (dm.senderId !== me.id) {
              // Marca como lida no servidor em segundo plano
              apiFetch(`/api/messages/direct/${otherId}?limit=1`).catch(() => {});
            }
          } else {
            unreadDmsBySender[dm.senderId] = (unreadDmsBySender[dm.senderId] || 0) + 1;
            renderChatTabs();
            showToast(`💬 Mensagem privada de ${dm.senderName}`);
          }
        } else if (msg.type === 'DM_READ') {
          const data = msg.data;
          const me = getCurrentUser();
          if (activeChatChannel === data.senderId && data.receiverId === me.id) {
            document.querySelectorAll('.chat-read-status').forEach((el) => {
              el.textContent = '✓✓';
              el.title = 'Lida';
            });
          }
        } else if (msg.type === 'CHAT_REACTION' || msg.type === 'DM_REACTION') {
          const data = msg.data;
          if (msg.type === 'DM_REACTION') {
            const me = getCurrentUser();
            const otherId = data.senderId === me.id ? data.receiverId : data.senderId;
            if (activeChatChannel !== otherId) return;
          } else if (activeChatChannel !== 'circle') {
            return;
          }
          applyReactionUpdate(data.messageId, data.reactions);
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
      const effectiveBatt =
        locData.battery !== undefined && locData.battery !== null ? locData.battery : member.location?.battery;
      const effectiveCharge =
        locData.isCharging !== undefined ? locData.isCharging : member.location?.isCharging;

      member.currentPlace = currentPlace;
      member.location = {
        latitude: locData.latitude,
        longitude: locData.longitude,
        accuracy: locData.accuracy,
        speed: locData.speed,
        heading: locData.heading,
        battery: effectiveBatt,
        isCharging: effectiveCharge,
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

    // Se havia uma solicitação de "Atualizar agora" pendente para este membro, conclui o feedback visual
    onLocationUpdateReceived(locData.userId);
  }

  // 6.5 Enquadra todos os membros e lugares no mapa
  function fitAllMembers() {
    if (!map) return;
    try {
      map.invalidateSize();
    } catch (_e) {}

    const validCoords = (membersData || [])
      .filter((m) => m.location && typeof m.location.latitude === 'number' && typeof m.location.longitude === 'number')
      .map((m) => [m.location.latitude, m.location.longitude]);

    const placeCoords = (placesData || [])
      .filter((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number')
      .map((p) => [p.latitude, p.longitude]);

    const allCoords = [...validCoords, ...placeCoords];

    if (validCoords.length > 0) {
      if (validCoords.length === 1) {
        map.setView(validCoords[0], 15, { animate: true });
      } else {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
      }
    } else if (allCoords.length > 0) {
      if (allCoords.length === 1) {
        map.setView(allCoords[0], 15, { animate: true });
      } else {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
      }
    } else {
      map.setView([-23.55052, -46.633308], 14, { animate: true });
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
      renderChatTabs();
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

      // Posiciona a pílula do lugar na borda superior da cerca virtual (borda norte),
      // evitando sobreposição direta com o marcador do membro que fica no centro do lugar
      const latOffset = (place.radiusMeters || 100) / 111320;
      const labelLat = place.latitude + latOffset;

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
        iconAnchor: [60, 30],
      });

      const labelMarker = L.marker([labelLat, place.longitude], {
        icon: labelIcon,
        interactive: true,
        zIndexOffset: -100,
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
    let batt = null;
    if (rawBatt !== undefined && rawBatt !== null && rawBatt !== '' && !isNaN(Number(rawBatt))) {
      let num = Number(rawBatt);
      if (num > 0 && num <= 1) {
        num = num * 100;
      }
      batt = Math.max(0, Math.min(100, Math.round(num)));
    }
    const hasBattery = batt !== null;
    const isCharging = !!member.location.isCharging;

    const battColor = !hasBattery
      ? 'transparent'
      : batt < 20
      ? '#EF4444'
      : batt < 50
      ? '#F59E0B'
      : '#10B981';

    const battClass = !hasBattery
      ? ''
      : batt < 20
      ? 'low'
      : batt < 50
      ? 'medium'
      : 'high';

    const circumference = 150.8;
    const progressOffset = hasBattery
      ? circumference * (1 - batt / 100)
      : circumference;

    const speed = member.location.speed ? Math.round(member.location.speed) : 0;
    const isMoving = speed > 5;

    const battText = hasBattery ? `${isCharging ? '⚡' : ''}${batt}%` : '';
    const battBadgeHtml = hasBattery
      ? `<span class="tag-batt ${battClass}" title="Bateria: ${batt}%${isCharging ? ' (Carregando)' : ''}">${battText}</span>`
      : '';

    const statusTagHtml = isMoving
      ? `<div class="marker-status-tag moving">
           <span class="tag-icon">🚗</span>
           <span class="tag-text">${speed} km/h</span>
           ${battBadgeHtml ? `<span class="tag-dot">•</span>${battBadgeHtml}` : ''}
         </div>`
      : `<div class="marker-status-tag">
           <span class="tag-text">${member.name}</span>
           ${battBadgeHtml ? `<span class="tag-dot">•</span>${battBadgeHtml}` : ''}
         </div>`;

    const markerHtml = `
      <div class="life360-avatar-marker ${isSelected ? 'selected' : ''}">
        <div class="marker-radar-ring"></div>
        <div class="marker-avatar-container">
          <svg class="battery-svg" viewBox="0 0 58 58">
            <circle class="battery-track" cx="29" cy="29" r="24"></circle>
            ${hasBattery ? `
            <circle class="battery-fill ${isCharging ? 'charging' : ''}"
                    cx="29" cy="29" r="24"
                    stroke="${battColor}"
                    stroke-dasharray="150.8"
                    stroke-dashoffset="${progressOffset}"></circle>
            ` : ''}
          </svg>
          <div class="avatar-photo" style="background-color: ${member.color || '#3B82F6'};">
            ${member.avatarUrl ? `<img src="${member.avatarUrl}" alt="${member.name}" />` : initials}
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
      return `<div class="mini-avatar" style="background-color: ${m.color || '#3B82F6'}">${m.avatarUrl ? `<img src="${m.avatarUrl}" alt="${m.name}" />` : initials}</div>`;
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
        const rawBatt = m.location?.battery;
        let batt = null;
        if (rawBatt !== undefined && rawBatt !== null && rawBatt !== '' && !isNaN(Number(rawBatt))) {
          let num = Number(rawBatt);
          if (num > 0 && num <= 1) num = num * 100;
          batt = Math.max(0, Math.min(100, Math.round(num)));
        }
        const hasBatt = batt !== null;
        const battText = hasBatt ? `${batt}%` : '--';
        const isCharging = m.location?.isCharging ? '⚡' : '';
        const battClass = hasBatt && batt < 20 ? 'low' : hasBatt && batt < 50 ? 'medium' : 'high';

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
              ${m.avatarUrl ? `<img src="${m.avatarUrl}" alt="${m.name}" />` : initials}
              <div class="battery-badge ${battClass}">${battText} ${isCharging}</div>
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
  function selectMember(userId) {
    selectedMemberId = userId;
    const member = membersData.find((m) => m.id === userId);
    if (!member) return;

    // Ao abrir um membro, o relatório volta para o período "Hoje" (Etapa 9.6)
    driverReportPeriod = 'today';
    driverChartMetric = 'score';
    currentHistoricalReport = null;
    document.querySelectorAll('.driver-period-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.period === 'today');
    });
    const metricScoreBtn = document.getElementById('btnMetricScore');
    const metricKmBtn = document.getElementById('btnMetricKm');
    if (metricScoreBtn && metricKmBtn) {
      metricScoreBtn.classList.add('active');
      metricKmBtn.classList.remove('active');
    }
    const tableWrap = document.getElementById('driverTableWrap');
    const btnToggleTable = document.getElementById('btnToggleDriverTable');
    if (tableWrap) tableWrap.style.display = 'none';
    if (btnToggleTable) btnToggleTable.textContent = '📋 Ver Tabela';

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

    // Garante que o botão "Voltar" fique sempre clicável, mesmo após re-renderizações
    bindBackToListButton();

    // Em telas pequenas, rola o painel para o topo ao abrir os detalhes
    const sheetContent = document.getElementById('sheetContent');
    if (sheetContent) sheetContent.scrollTop = 0;
  }
  window.selectMember = selectMember;

  function bindBackToListButton() {
    const backBtn = document.getElementById('btnBackToList');
    if (!backBtn || backBtn.dataset.bound === '1') return;
    backBtn.dataset.bound = '1';
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      backToList();
    });
  }

  function backToList() {
    try {
      if (typeof stopReplay === 'function') stopReplay();
    } catch {}

    if (historyPolyline) {
      try { map.removeLayer(historyPolyline); } catch {}
      historyPolyline = null;
    }
    if (replayMarker) {
      try { map.removeLayer(replayMarker); } catch {}
      replayMarker = null;
    }
    if (tripStartMarker) {
      try { map.removeLayer(tripStartMarker); } catch {}
      tripStartMarker = null;
    }
    if (tripEndMarker) {
      try { map.removeLayer(tripEndMarker); } catch {}
      tripEndMarker = null;
    }
    clearTripEventMarkers();

    const replayPlayerBar = document.getElementById('replayPlayerBar');
    if (replayPlayerBar) replayPlayerBar.style.display = 'none';

    const btnClearHistory = document.getElementById('btnClearHistory');
    if (btnClearHistory) btnClearHistory.style.display = 'none';

    selectedMemberId = null;
    membersData.forEach((m) => renderMemberMarker(m.id));

    const panel = document.getElementById('memberDetailPanel');
    const list = document.getElementById('membersList');
    if (panel) panel.style.display = 'none';
    if (list) list.style.display = 'flex';

    const addrCard = document.getElementById('detailAddressCard');
    if (addrCard) addrCard.style.display = 'none';

    if (map && membersData.length) {
      const points = membersData.filter((m) => m.location).map((m) => [m.location.latitude, m.location.longitude]);
      if (points.length === 1) {
        map.setView(points[0], 14, { animate: true });
      } else if (points.length > 1) {
        map.fitBounds(points, { padding: [60, 60], maxZoom: 15 });
      }
    }
  }
  window.backToList = backToList;

  function renderMemberDetails(member) {
    const initials = member.name.substring(0, 2).toUpperCase();
    const rawBatt = member.location?.battery;
    let batt = null;
    if (rawBatt !== undefined && rawBatt !== null && rawBatt !== '' && !isNaN(Number(rawBatt))) {
      let num = Number(rawBatt);
      if (num > 0 && num <= 1) num = num * 100;
      batt = Math.max(0, Math.min(100, Math.round(num)));
    }
    const hasBatt = batt !== null;
    const battText = hasBatt ? `${batt}%` : '--';
    const isCharging = member.location?.isCharging ? ' ⚡' : '';
    const speed = member.location?.speed ? `${Math.round(member.location.speed)} km/h` : '0 km/h';
    const accuracy = member.location?.accuracy ? `${Math.round(member.location.accuracy)} m` : '--';
    const updated = member.location?.recordedAt ? formatRelativeTime(member.location.recordedAt) : '--';

    document.getElementById('detailHeader').innerHTML = `
      <div class="detail-header-card">
        <div class="member-avatar" style="background-color: ${member.color || '#3B82F6'}; width: 46px; height: 46px; font-size: 17px;">
          ${member.avatarUrl ? `<img src="${member.avatarUrl}" alt="${member.name}" />` : initials}
        </div>
        <div class="detail-header-info">
          <h3 class="detail-header-name">${member.name}</h3>
          <p class="detail-header-sub">${member.activeDevice?.name || 'Celular Principal'}${member.phone ? ` • ${member.phone}` : ''}</p>
        </div>
        <div class="detail-header-actions">
          <button class="detail-refresh-btn" id="btnHeaderRefreshLocation" onclick="window.requestMemberLocationUpdate('${member.id}')" title="Atualizar localização agora">
            🔄 Atualizar
          </button>
          <button class="detail-edit-profile-btn" onclick="window.openProfileModal('${member.id}')" title="Editar perfil e foto">
            ✏️ Editar
          </button>
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

  // ==========================================================
  // 14.5 "Atualizar Agora" - Solicitação de Posição Remota (Etapa 9.4)
  // ==========================================================
  let pendingLocationUpdateMemberId = null;
  let pendingLocationUpdateTimeout = null;

  async function requestMemberLocationUpdate(userId) {
    const targetId = userId || selectedMemberId;
    if (!targetId) return;

    const member = membersData.find((m) => m.id === targetId);
    const memberName = member?.name || 'Membro';

    const btn = document.getElementById('btnRequestLocationUpdate');
    const titleEl = document.getElementById('btnRequestLocationTitle');
    const subEl = document.getElementById('btnRequestLocationSub');
    const headerBtn = document.getElementById('btnHeaderRefreshLocation');

    if (btn) {
      btn.classList.add('loading');
      btn.disabled = true;
    }
    if (titleEl) titleEl.textContent = 'Solicitando...';
    if (subEl) subEl.textContent = `Aguardando GPS de ${memberName}`;
    if (headerBtn) {
      headerBtn.classList.add('loading');
      headerBtn.innerHTML = '<span>🔄</span> Solicitando...';
    }

    pendingLocationUpdateMemberId = targetId;
    showToast(`📡 Solicitando posição em tempo real de ${memberName}...`);

    // Timeout de 20s para informar caso o aparelho esteja offline ou sem GPS ativo
    if (pendingLocationUpdateTimeout) clearTimeout(pendingLocationUpdateTimeout);
    pendingLocationUpdateTimeout = setTimeout(() => {
      if (pendingLocationUpdateMemberId === targetId) {
        resetLocationUpdateButton(false, 'Sem resposta imediata');
        showToast(`⚠️ ${memberName} ainda não respondeu. A posição atualizará assim que o aparelho transmitir.`);
        pendingLocationUpdateMemberId = null;
      }
    }, 20000);

    try {
      const res = await apiFetch(`/api/members/${targetId}/request-update`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao solicitar atualização.');
        resetLocationUpdateButton(false);
      }
    } catch (err) {
      console.error('Erro ao solicitar atualização:', err);
      showToast('Falha na comunicação ao solicitar localização.');
      resetLocationUpdateButton(false);
    }
  }
  window.requestMemberLocationUpdate = requestMemberLocationUpdate;

  function onLocationUpdateReceived(userId) {
    if (pendingLocationUpdateMemberId && pendingLocationUpdateMemberId === userId) {
      if (pendingLocationUpdateTimeout) clearTimeout(pendingLocationUpdateTimeout);
      pendingLocationUpdateMemberId = null;

      const member = membersData.find((m) => m.id === userId);
      const memberName = member?.name || 'Membro';
      const accuracy = member?.location?.accuracy ? ` (±${Math.round(member.location.accuracy)}m)` : '';

      showToast(`🟢 Localização de ${memberName} atualizada com sucesso!${accuracy}`);
      resetLocationUpdateButton(true, 'Atualizado agora mesmo!');
    }
  }

  function resetLocationUpdateButton(isSuccess = false, customSub = null) {
    const btn = document.getElementById('btnRequestLocationUpdate');
    const titleEl = document.getElementById('btnRequestLocationTitle');
    const subEl = document.getElementById('btnRequestLocationSub');
    const headerBtn = document.getElementById('btnHeaderRefreshLocation');

    if (btn) {
      btn.classList.remove('loading');
      btn.disabled = false;
      if (isSuccess) {
        btn.classList.add('success');
        setTimeout(() => btn.classList.remove('success'), 4000);
      }
    }
    if (titleEl) titleEl.textContent = isSuccess ? '🟢 Atualizado!' : 'Atualizar Agora';
    if (subEl) subEl.textContent = customSub || (isSuccess ? 'Posição obtida com sucesso' : 'Solicitar GPS em tempo real');

    if (headerBtn) {
      headerBtn.classList.remove('loading');
      headerBtn.innerHTML = isSuccess ? '🟢 Atualizado' : '🔄 Atualizar';
      setTimeout(() => {
        if (headerBtn) headerBtn.innerHTML = '🔄 Atualizar';
      }, 4000);
    }

    if (isSuccess) {
      setTimeout(() => {
        if (titleEl) titleEl.textContent = 'Atualizar Agora';
        if (subEl) subEl.textContent = 'Solicitar GPS em tempo real';
      }, 5000);
    }
  }

  // Quando este próprio dispositivo recebe uma ordem de atualização de outro membro
  function handleIncomingLocationUpdateRequest(data) {
    const me = getCurrentUser();
    if (me && data && data.userId === me.id) {
      console.log(`[RemoteUpdate] Ordem de atualização recebida de ${data.requestedBy || 'Familiar'}`);
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            let battLevel = undefined;
            let isCharging = false;
            if ('getBattery' in navigator) {
              try {
                const b = await navigator.getBattery();
                if (b && typeof b.level === 'number' && b.level >= 0) {
                  battLevel = Math.round(b.level * 100);
                  isCharging = Boolean(b.charging);
                }
              } catch {}
            }
            const payload = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0,
              heading: pos.coords.heading,
              altitude: pos.coords.altitude,
              battery: battLevel,
              isCharging,
            };
            apiFetch('/api/telemetry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }).catch((err) => console.warn('[RemoteUpdate] Falha no envio de telemetria:', err));
          },
          (err) => console.warn('[RemoteUpdate] Falha ao obter posição:', err.message),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }

      // Notifica o wrapper nativo do React Native (WebView) se estiver rodando dentro do APK
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'FORCE_LOCATION_UPDATE' }));
      }
    }
  }

  // 15. Relatório de Direção e Histórico (Platinum / Gold Features)
  function setupDriverReportAndHistory() {
    bindBackToListButton();

    // Definir data padrão no input de data (hoje)
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('historyDateInput');
    if (dateInput) dateInput.value = todayStr;

    // Botão Atualizar Agora (Recurso Life360 - Etapa 9.4)
    const btnRequestLoc = document.getElementById('btnRequestLocationUpdate');
    if (btnRequestLoc) {
      btnRequestLoc.addEventListener('click', () => {
        if (!selectedMemberId) return;
        requestMemberLocationUpdate(selectedMemberId);
      });
    }

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

    // Botão Mensagem Direta 1:1 com o membro selecionado
    const btnDm = document.getElementById('btnDirectMessageMember');
    if (btnDm) {
      btnDm.addEventListener('click', () => {
        if (!selectedMemberId) return;
        window.switchChatChannel(selectedMemberId);
        const chatSec = document.querySelector('.sheet-chat-section');
        if (chatSec) {
          chatSec.scrollIntoView({ behavior: 'smooth' });
          const input = document.getElementById('chatInput');
          if (input) input.focus();
        }
      });
    }

    // Botão Carregar Histórico e Iniciar Replay
    document.getElementById('btnShowHistory').addEventListener('click', () => loadAndPlayHistoryForMember(selectedMemberId));

    document.getElementById('btnLoadCustomDateHistory').addEventListener('click', () => {
      const customDate = document.getElementById('historyDateInput').value;
      if (!customDate) {
        showToast('Selecione uma data válida.');
        return;
      }
      loadAndPlayHistoryForMember(selectedMemberId, customDate);
      loadDriverReportForMember(selectedMemberId, customDate);
    });

    document.getElementById('btnClearHistory').addEventListener('click', clearHistoryOverlay);

    // Alternância de Período do Relatório de Direção (Hoje / Semana / Mês - Etapa 9.6)
    const periodBtns = document.querySelectorAll('.driver-period-btn');
    periodBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const p = btn.dataset.period;
        if (p === driverReportPeriod) return;
        periodBtns.forEach((b) => b.classList.toggle('active', b === btn));
        driverReportPeriod = p;
        if (selectedMemberId) {
          loadDriverReportForMember(selectedMemberId);
        }
      });
    });

    // Alternância de Métrica no Gráfico de Evolução (Nota / Km - Etapa 9.6)
    const btnMetricScore = document.getElementById('btnMetricScore');
    const btnMetricKm = document.getElementById('btnMetricKm');
    if (btnMetricScore && btnMetricKm) {
      btnMetricScore.addEventListener('click', (e) => {
        e.preventDefault();
        driverChartMetric = 'score';
        btnMetricScore.classList.add('active');
        btnMetricKm.classList.remove('active');
        if (currentHistoricalReport?.days) {
          renderDriverEvolutionChart(currentHistoricalReport.days, 'score');
        }
      });
      btnMetricKm.addEventListener('click', (e) => {
        e.preventDefault();
        driverChartMetric = 'km';
        btnMetricKm.classList.add('active');
        btnMetricScore.classList.remove('active');
        if (currentHistoricalReport?.days) {
          renderDriverEvolutionChart(currentHistoricalReport.days, 'km');
        }
      });
    }

    // Toggle da Tabela Acessível de Dados
    const btnToggleTable = document.getElementById('btnToggleDriverTable');
    const tableWrap = document.getElementById('driverTableWrap');
    if (btnToggleTable && tableWrap) {
      btnToggleTable.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = tableWrap.style.display === 'none';
        tableWrap.style.display = isHidden ? 'block' : 'none';
        btnToggleTable.textContent = isHidden ? '✕ Ocultar Tabela' : '📋 Ver Tabela';
      });
    }
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

  // Guarda as viagens carregadas para uso no replay de trecho
  let memberTrips = [];

  function applyGradeElement(el, score) {
    if (!el) return;
    if (score === 'Atenção') {
      el.textContent = 'Atenção';
      el.className = 'driver-grade danger';
    } else if (score === 'Bom') {
      el.textContent = 'Bom';
      el.className = 'driver-grade warning';
    } else {
      el.textContent = 'Excelente';
      el.className = 'driver-grade';
    }
  }

  function setDrivingStatValue(elId, val) {
    const el = document.getElementById(elId);
    if (!el) return;
    const num = Number(val) || 0;
    el.textContent = num;
    if (num > 0) {
      if (elId === 'dHardBrakes') {
        el.style.color = '#DC2626';
      } else if (elId === 'dRapidAccels') {
        el.style.color = '#D97706';
      } else if (elId === 'dEvents') {
        el.style.color = '#B91C1C';
      }
    } else {
      el.style.color = '';
    }
  }

  async function loadDriverReportForMember(userId, dateStr = null) {
    if (!userId) return;

    const evolutionContainer = document.getElementById('driverEvolutionContainer');
    const periodLabel = document.getElementById('driverPeriodLabel');
    const chartSubtitle = document.getElementById('driverChartSubtitle');
    const tripsTitle = document.getElementById('tripsSectionTitle');
    const trendPill = document.getElementById('driverTrendPill');
    const scoreNumEl = document.getElementById('driverScoreNum');
    const gradeEl = document.getElementById('driverGrade');

    // Se o usuário selecionou uma data personalizada no calendário, forçamos o período "Hoje/Dia"
    if (dateStr) {
      driverReportPeriod = 'today';
      document.querySelectorAll('.driver-period-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.period === 'today');
      });
    }

    if (driverReportPeriod === 'today') {
      if (evolutionContainer) evolutionContainer.style.display = 'none';
      if (trendPill) trendPill.style.display = 'none';
      if (periodLabel) periodLabel.textContent = dateStr ? `Data: ${dateStr}` : 'Período de Hoje';
      if (tripsTitle) tripsTitle.textContent = '🛣️ Viagens Individuais';

      // "Hoje" = janela do dia local do aparelho (não UTC), para não virar o dia às 21h em UTC-3
      let fromIso;
      let toIso;
      if (dateStr) {
        fromIso = `${dateStr}T00:00:00.000Z`;
        toIso = `${dateStr}T23:59:59.999Z`;
      } else {
        const now = new Date();
        fromIso = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
        toIso = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
      }
      const url = `/api/members/${userId}/trips?from=${fromIso}&to=${toIso}&limit=2000`;

      try {
        const res = await apiFetch(url);
        const data = await res.json();
        const summary = data?.summary || {};
        const trips = data?.trips || [];
        memberTrips = trips;

        const totalHardBrakes = typeof summary.totalHardBrakingEvents === 'number'
          ? summary.totalHardBrakingEvents
          : trips.reduce((acc, t) => acc + (t.hardBrakingEvents || 0), 0);
        const totalRapidAccels = typeof summary.totalRapidAccelEvents === 'number'
          ? summary.totalRapidAccelEvents
          : trips.reduce((acc, t) => acc + (t.rapidAccelEvents || 0), 0);
        const totalSpeedEvents = typeof summary.totalSpeedEvents === 'number'
          ? summary.totalSpeedEvents
          : trips.reduce((acc, t) => acc + (t.speedEvents || 0), 0);
        const totalPhoneMinutes = typeof summary.totalPhoneUsageMinutes === 'number'
          ? summary.totalPhoneUsageMinutes
          : trips.reduce((acc, t) => acc + (t.phoneUsageMinutes || 0), 0);

        document.getElementById('dMaxSpeed').textContent = `${summary.maxSpeedKmH || 0} km/h`;
        document.getElementById('dDistance').textContent = `${(summary.totalDistanceKm || 0).toFixed(1)} km`;
        document.getElementById('dTime').textContent = formatTripDuration(summary.totalDurationMinutes || 0);
        setDrivingStatValue('dEvents', totalSpeedEvents);
        setDrivingStatValue('dHardBrakes', totalHardBrakes);
        setDrivingStatValue('dRapidAccels', totalRapidAccels);
        const dPhoneEl = document.getElementById('dPhoneUsage');
        if (dPhoneEl) {
          dPhoneEl.textContent = `${totalPhoneMinutes} min`;
          dPhoneEl.style.color = totalPhoneMinutes > 0 ? '#DC2626' : '';
        }

        const score = summary.score || 'Excelente';
        const numScore = typeof summary.scoreValue === 'number'
          ? summary.scoreValue
          : (score === 'Atenção' ? 65 : score === 'Bom' ? 82 : 96);

        if (scoreNumEl) scoreNumEl.textContent = numScore;
        applyGradeElement(gradeEl, score);

        renderTripsList(trips);
      } catch (err) {
        console.error('Erro ao calcular driver report:', err);
        renderTripsList([]);
      }
      return;
    }

    // Período Histórico (Semana / Mês - Etapa 9.6)
    if (evolutionContainer) evolutionContainer.style.display = 'flex';
    if (periodLabel) {
      periodLabel.textContent = driverReportPeriod === 'week' ? 'Média dos Últimos 7 dias' : 'Média dos Últimos 30 dias';
    }
    if (chartSubtitle) {
      chartSubtitle.textContent = driverReportPeriod === 'week' ? 'Últimos 7 dias (dia a dia)' : 'Últimos 30 dias (dia a dia)';
    }
    if (tripsTitle) {
      tripsTitle.textContent = driverReportPeriod === 'week' ? '🛣️ Viagens Recentes da Semana' : '🛣️ Viagens Recentes do Mês';
    }

    try {
      const res = await apiFetch(`/api/members/${userId}/driving-history?period=${driverReportPeriod}`);
      if (!res.ok) throw new Error('Falha ao obter histórico de direção');
      const data = await res.json();
      currentHistoricalReport = data;

      const summary = data?.summary || {};
      const days = data?.days || [];
      const trips = data?.recentTrips || [];
      memberTrips = trips;

      document.getElementById('dMaxSpeed').textContent = `${summary.overallMaxSpeedKmH || 0} km/h`;
      document.getElementById('dDistance').textContent = `${(summary.totalDistanceKm || 0).toFixed(1)} km`;
      document.getElementById('dTime').textContent = formatTripDuration(summary.totalDurationMinutes || 0);
      setDrivingStatValue('dEvents', summary.totalSpeedEvents || 0);
      setDrivingStatValue('dHardBrakes', summary.totalHardBrakingEvents || 0);
      setDrivingStatValue('dRapidAccels', summary.totalRapidAccelEvents || 0);
      const histPhoneEl = document.getElementById('dPhoneUsage');
      if (histPhoneEl) {
        const histPhoneMin = summary.totalPhoneUsageMinutes || 0;
        histPhoneEl.textContent = `${histPhoneMin} min`;
        histPhoneEl.style.color = histPhoneMin > 0 ? '#DC2626' : '';
      }

      if (scoreNumEl) scoreNumEl.textContent = summary.averageScore || 100;
      applyGradeElement(gradeEl, summary.overallGrade || 'Excelente');

      if (trendPill) {
        trendPill.style.display = 'inline-block';
        if (summary.trend === 'improving') {
          trendPill.textContent = '📈 Melhorando';
          trendPill.style.background = '#ECFDF5';
          trendPill.style.color = '#059669';
          trendPill.style.borderColor = '#A7F3D0';
        } else if (summary.trend === 'declining') {
          trendPill.textContent = '📉 Em queda';
          trendPill.style.background = '#FEF2F2';
          trendPill.style.color = '#DC2626';
          trendPill.style.borderColor = '#FECACA';
        } else {
          trendPill.textContent = '➡️ Estável';
          trendPill.style.background = '#EEF2FF';
          trendPill.style.color = '#4F46E5';
          trendPill.style.borderColor = '#C7D2FE';
        }
      }

      renderDriverEvolutionChart(days, driverChartMetric);
      renderDriverDataTable(days);
      renderTripsList(trips);
    } catch (err) {
      console.error('Erro ao carregar histórico de direção:', err);
      renderTripsList([]);
    }
  }

  function renderDriverEvolutionChart(days, metric = 'score') {
    const wrap = document.getElementById('driverChartSvgWrap');
    const tooltip = document.getElementById('driverChartTooltip');
    if (!wrap) return;

    if (!days || days.length === 0) {
      wrap.innerHTML = '<div class="loading-state" style="padding: 20px 0; font-size: 11px;">Sem dados para o gráfico.</div>';
      return;
    }

    const n = days.length;
    const isWeek = n <= 7;
    const width = 340;
    const height = 180;
    const padLeft = 32;
    const padRight = 14;
    const padTop = 22;
    const padBottom = 34;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;
    const colW = chartW / n;
    const barW = Math.max(4, Math.min(26, colW * 0.65));

    let maxVal = 100;
    if (metric === 'km') {
      const maxKm = Math.max(...days.map((d) => d.totalDistanceKm || 0));
      maxVal = maxKm > 0 ? Math.ceil(maxKm * 1.2) : 10;
    }

    // Grid e labels do eixo Y
    let gridLinesHtml = '';
    const ySteps = metric === 'score' ? [100, 75, 50] : [maxVal, Math.round(maxVal / 2)];
    for (const step of ySteps) {
      const y = padTop + (1 - step / maxVal) * chartH;
      gridLinesHtml += `
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="currentColor" stroke-opacity="0.12" stroke-dasharray="3,3" />
        <text x="${padLeft - 6}" y="${y + 3}" text-anchor="end" font-size="8.5" font-weight="600" fill="currentColor" fill-opacity="0.55">${step}</text>
      `;
    }
    const baselineY = padTop + chartH;
    gridLinesHtml += `<line x1="${padLeft}" y1="${baselineY}" x2="${width - padRight}" y2="${baselineY}" stroke="currentColor" stroke-opacity="0.25" />`;

    // Barras e labels do eixo X
    let barsHtml = '';
    let overlaysHtml = '';

    days.forEach((day, i) => {
      const cx = padLeft + i * colW + colW / 2;
      const x = cx - barW / 2;
      let val = metric === 'score' ? day.scoreValue : day.totalDistanceKm;
      const hasTrips = day.hasTrips && val !== null && val !== undefined;

      let barColor = '#CBD5E1';
      let barH = 6;
      let barY = baselineY - barH;
      let labelVal = '';

      if (metric === 'score') {
        if (hasTrips) {
          barColor = val >= 90 ? '#10B981' : val >= 75 ? '#F59E0B' : '#EF4444';
          barH = Math.max(6, (val / 100) * chartH);
          barY = baselineY - barH;
          labelVal = isWeek ? `${val}` : '';
        } else {
          barColor = 'currentColor';
          barH = 4;
          barY = baselineY - barH;
          labelVal = isWeek ? '--' : '';
        }
      } else {
        // Métrica Km
        val = day.totalDistanceKm || 0;
        barColor = '#6366F1';
        barH = maxVal > 0 && val > 0 ? Math.max(4, (val / maxVal) * chartH) : 3;
        barY = baselineY - barH;
        labelVal = isWeek && val > 0 ? `${val.toFixed(0)}` : '';
      }

      const opacity = metric === 'score' && !hasTrips ? '0.25' : '0.9';

      barsHtml += `
        <rect x="${x}" y="${barY}" width="${barW}" height="${barH}" rx="3.5" ry="3.5" fill="${barColor}" fill-opacity="${opacity}" />
      `;

      if (labelVal) {
        barsHtml += `
          <text x="${cx}" y="${barY - 3}" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" fill-opacity="0.85">${labelVal}</text>
        `;
      }

      // X-Axis labels
      if (isWeek) {
        barsHtml += `
          <text x="${cx}" y="${baselineY + 13}" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor">${day.dayName}</text>
          <text x="${cx}" y="${baselineY + 24}" text-anchor="middle" font-size="8" font-weight="500" fill="currentColor" fill-opacity="0.6">${day.formattedDate.split('/')[0]}</text>
        `;
      } else if (i % 5 === 0 || i === n - 1) {
        barsHtml += `
          <text x="${cx}" y="${baselineY + 14}" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" fill-opacity="0.75">${day.formattedDate}</text>
        `;
      }

      // Hit target cobrindo a coluna
      overlaysHtml += `
        <rect x="${padLeft + i * colW}" y="0" width="${colW}" height="${height}" fill="transparent" class="chart-hit-column" data-day-idx="${i}" style="cursor: pointer;" />
      `;
    });

    wrap.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="driver-chart-svg" style="width: 100%; height: auto; display: block;" role="img" aria-label="Gráfico de evolução da condução">
        <g class="chart-grid">${gridLinesHtml}</g>
        <g class="chart-bars">${barsHtml}</g>
        <g class="chart-hits">${overlaysHtml}</g>
      </svg>
    `;

    // Interação de Tooltip
    let hideTimer = null;
    const hitCols = wrap.querySelectorAll('.chart-hit-column');
    hitCols.forEach((col) => {
      const showTip = () => {
        if (hideTimer) clearTimeout(hideTimer);
        const idx = parseInt(col.dataset.dayIdx, 10);
        const day = days[idx];
        if (!day || !tooltip) return;

        let content = `<b>${day.dayName}, ${day.formattedDate}</b><br/>`;
        if (day.hasTrips) {
          content += `Nota: <b>${day.scoreValue}/100</b> (${day.scoreGrade})<br/>`;
          content += `Distância: <b>${day.totalDistanceKm.toFixed(1)} km</b> em ${day.tripsCount} viagem(ns)<br/>`;
          content += `Tempo: <b>${formatTripDuration(day.totalDurationMinutes)}</b> • Máx: <b>${day.maxSpeedKmH} km/h</b>`;
          if (day.speedEvents > 0) {
            content += `<br/><span style="color: #F87171;">⚠️ ${day.speedEvents} excesso(s) > 90 km/h</span>`;
          }
          if (day.hardBrakingEvents > 0) {
            content += `<br/><span style="color: #EF4444;">🛑 ${day.hardBrakingEvents} frenagem(ns) brusca(s)</span>`;
          }
          if (day.rapidAccelEvents > 0) {
            content += `<br/><span style="color: #F59E0B;">🚀 ${day.rapidAccelEvents} arrancada(s) brusca(s)</span>`;
          }
          if (day.phoneUsageMinutes > 0) {
            content += `<br/><span style="color: #3B82F6;">📱 ${day.phoneUsageMinutes} min celular ao volante</span>`;
          }
        } else {
          content += `Sem viagens registradas neste dia.`;
        }

        tooltip.innerHTML = content;
        tooltip.style.display = 'block';
        hideTimer = setTimeout(() => {
          tooltip.style.display = 'none';
        }, 4000);
      };

      col.addEventListener('mouseenter', showTip);
      col.addEventListener('touchstart', showTip, { passive: true });
    });

    wrap.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.style.display = 'none';
    });
  }

  function renderDriverDataTable(days) {
    const tbody = document.getElementById('driverTableBody');
    if (!tbody || !days) return;

    tbody.innerHTML = days
      .map((d) => {
        const scoreDisplay = d.hasTrips && d.scoreValue !== null
          ? `<b>${d.scoreValue}</b> (${d.scoreGrade})`
          : '--';
        return `
          <tr>
            <td>${d.formattedDate}</td>
            <td>${d.dayName}</td>
            <td>${scoreDisplay}</td>
            <td>${(d.totalDistanceKm || 0).toFixed(1)} km</td>
            <td>${formatTripDuration(d.totalDurationMinutes || 0)}</td>
            <td>${d.maxSpeedKmH || 0} km/h</td>
            <td>${d.tripsCount || 0}</td>
          </tr>
        `;
      })
      .join('');
  }

  function formatTripTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatTripDuration(minutes) {
    if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) return '0 min';
    if (minutes < 1) {
      const sec = Math.max(1, Math.round(minutes * 60));
      return `${sec} s`;
    }
    const roundedMin = Math.round(minutes);
    if (roundedMin < 60) return `${roundedMin} min`;
    const h = Math.floor(roundedMin / 60);
    const m = roundedMin % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  function renderTripsList(trips) {
    const listEl = document.getElementById('tripsList');
    const countEl = document.getElementById('tripsCount');
    if (!listEl) return;

    countEl.textContent = `${trips.length} viagem${trips.length === 1 ? '' : 's'}`;

    if (!trips || trips.length === 0) {
      listEl.innerHTML = '<div class="loading-state" style="padding: 10px 0; font-size: 12px;">Nenhuma viagem registrada neste período.</div>';
      return;
    }

    // Mais recentes primeiro
    const ordered = [...trips].reverse();

    listEl.innerHTML = ordered
      .map((t) => {
        const brakeChip = (t.hardBrakingEvents || 0) > 0
          ? `<span class="trip-stat-chip brake" title="${t.hardBrakingEvents} frenagem(ns) brusca(s)">🛑 ${t.hardBrakingEvents} frenage${t.hardBrakingEvents === 1 ? 'm' : 'ns'}</span>`
          : '';
        const accelChip = (t.rapidAccelEvents || 0) > 0
          ? `<span class="trip-stat-chip accel" title="${t.rapidAccelEvents} arrancada(s) brusca(s)">🚀 ${t.rapidAccelEvents} arrancada${t.rapidAccelEvents === 1 ? '' : 's'}</span>`
          : '';
        const speedChip = (t.speedEvents || 0) > 0
          ? `<span class="trip-stat-chip alert" title="${t.speedEvents} excesso(s) > 90 km/h">⚠️ ${t.speedEvents} excesso${t.speedEvents === 1 ? '' : 's'}</span>`
          : '';
        const phoneChip = (t.phoneUsageMinutes || 0) > 0
          ? `<span class="trip-stat-chip phone" title="${t.phoneUsageMinutes} min de tela ativa em movimento (${t.phoneUsageEpisodes || 0} episódio(s))">📱 ${t.phoneUsageMinutes} min celular</span>`
          : '';
        const hasAnyEvent = (t.hardBrakingEvents || 0) > 0 || (t.rapidAccelEvents || 0) > 0 || (t.speedEvents || 0) > 0 || (t.phoneUsageMinutes || 0) > 0;
        const smoothChip = !hasAnyEvent
          ? `<span class="trip-stat-chip smooth" title="Condução suave sem manobras bruscas">🛡️ Suave</span>`
          : '';

        return `
          <div class="trip-card" onclick="window.replayTrip('${t.id}')">
            <div class="trip-card-header">
              <span class="trip-time">${formatTripTime(t.startTime)} → ${formatTripTime(t.endTime)}</span>
              <span class="trip-duration">${formatTripDuration(t.durationMinutes)}</span>
            </div>
            <div class="trip-route">
              <div class="trip-route-line">
                <span class="trip-route-dot start"></span>
                <span class="trip-route-text">${t.startLocation.label}</span>
              </div>
              <div class="trip-route-line">
                <span class="trip-route-dot end"></span>
                <span class="trip-route-text">${t.endLocation.label}</span>
              </div>
            </div>
            <div class="trip-stats-row">
              <span class="trip-stat-chip">📏 ${t.distanceKm} km</span>
              <span class="trip-stat-chip">⚡ máx ${t.maxSpeedKmH} km/h</span>
              <span class="trip-stat-chip">📊 méd ${t.avgSpeedKmH} km/h</span>
              ${brakeChip}
              ${accelChip}
              ${speedChip}
              ${phoneChip}
              ${smoothChip}
            </div>
          </div>
        `;
      })
      .join('');
  }

  // Reproduz no mapa o trajeto de uma viagem específica
  window.replayTrip = function (tripId) {
    const trip = memberTrips.find((t) => t.id === tripId);
    if (!trip || !trip.points || trip.points.length < 2) {
      showToast('Trecho sem pontos suficientes para reproduzir.');
      return;
    }

    if (historyPolyline) map.removeLayer(historyPolyline);

    const latlngs = trip.points.map((p) => [p.latitude, p.longitude]);
    historyPolyline = L.polyline(latlngs, {
      color: '#6366F1',
      weight: 5,
      opacity: 0.85,
    }).addTo(map);

    // Marcadores de início e fim
    if (tripStartMarker) map.removeLayer(tripStartMarker);
    if (tripEndMarker) map.removeLayer(tripEndMarker);

    tripStartMarker = L.circleMarker(latlngs[0], {
      radius: 7,
      color: '#FFFFFF',
      weight: 3,
      fillColor: '#3B82F6',
      fillOpacity: 1,
    }).addTo(map).bindTooltip(`Início ${formatTripTime(trip.startTime)}`);

    tripEndMarker = L.circleMarker(latlngs[latlngs.length - 1], {
      radius: 7,
      color: '#FFFFFF',
      weight: 3,
      fillColor: '#EF4444',
      fillOpacity: 1,
    }).addTo(map).bindTooltip(`Fim ${formatTripTime(trip.endTime)}`);

    // Limpa marcadores de eventos de condução anteriores (Etapa 10.2)
    clearTripEventMarkers();

    // Plota no mapa os marcadores de frenagens bruscas, arrancadas e excessos
    if (trip.events && trip.events.length > 0) {
      trip.events.forEach((evt) => {
        let emoji = '⚠️';
        let cssClass = 'speed';
        let title = 'Excesso de Velocidade';
        if (evt.type === 'hard_brake') {
          emoji = '🛑';
          cssClass = 'brake';
          title = 'Frenagem Brusca';
        } else if (evt.type === 'rapid_accel') {
          emoji = '🚀';
          cssClass = 'accel';
          title = 'Arrancada Brusca';
        }

        const icon = L.divIcon({
          className: `trip-event-div-icon ${cssClass}`,
          html: `<span class="event-emoji">${emoji}</span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker([evt.latitude, evt.longitude], { icon })
          .addTo(map)
          .bindTooltip(
            `<b>${emoji} ${title}</b><br/>${evt.description}<br/><small style="opacity: 0.75;">⏰ ${formatTripTime(evt.timestamp)}</small>`,
            { direction: 'top', offset: [0, -10] }
          );

        tripEventMarkers.push(marker);
      });
    }

    map.fitBounds(historyPolyline.getBounds(), { padding: [50, 50] });
    document.getElementById('btnClearHistory').style.display = 'block';

    // Habilita o player de replay para o trecho
    replayPoints = trip.points;
    document.getElementById('replayPlayerBar').style.display = 'block';
    document.getElementById('replaySlider').max = trip.points.length - 1;
    document.getElementById('replaySlider').value = 0;
    replayIndex = 0;
    updateReplayUI();

    const eventCount = trip.events ? trip.events.length : 0;
    const eventSuffix = eventCount > 0 ? ` • ⚠️ ${eventCount} evento(s) no trajeto` : ' • 🛡️ Condução suave';
    showToast(`Viagem de ${formatTripTime(trip.startTime)} (${trip.distanceKm} km)${eventSuffix}`);
  };

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
    if (tripStartMarker) {
      map.removeLayer(tripStartMarker);
      tripStartMarker = null;
    }
    if (tripEndMarker) {
      map.removeLayer(tripEndMarker);
      tripEndMarker = null;
    }
    if (replayMarker) {
      map.removeLayer(replayMarker);
      replayMarker = null;
    }
    clearTripEventMarkers();
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
    // A velocidade já é gravada em km/h pelo App Android e pelo PWA — não multiplicar de novo
    const speed = pt.speed && pt.speed > 0 && pt.speed < 200 ? Math.round(pt.speed) : 0;
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

  // 16. Fluxo de SOS e Pânico de Emergência (Etapa 8.6 - Histórico Persistido)
  let currentActiveSosAlert = null;
  let currentSosFilter = 'ALL';

  function setupSosFlow() {
    const btnTopSos = document.getElementById('btnTopSos');
    const btnSheetSos = document.getElementById('btnSheetSos');
    const sosConfirmModal = document.getElementById('sosConfirmModal');
    const btnCancelSos = document.getElementById('btnCancelSos');
    const btnConfirmSosNow = document.getElementById('btnConfirmSosNow');
    const btnSosResolveActive = document.getElementById('btnSosResolveActive');
    const btnRefreshSosHistory = document.getElementById('btnRefreshSosHistory');

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

    if (btnTopSos) btnTopSos.addEventListener('click', openConfirmModal);
    if (btnSheetSos) btnSheetSos.addEventListener('click', openConfirmModal);

    if (btnCancelSos) {
      btnCancelSos.addEventListener('click', () => {
        if (sosCountdownInterval) clearInterval(sosCountdownInterval);
        sosConfirmModal.style.display = 'none';
      });
    }

    if (btnConfirmSosNow) {
      btnConfirmSosNow.addEventListener('click', () => {
        if (sosCountdownInterval) clearInterval(sosCountdownInterval);
        executeSosDispatch();
      });
    }

    const btnDismiss = document.getElementById('btnSosDismiss');
    if (btnDismiss) {
      btnDismiss.addEventListener('click', () => {
        document.getElementById('sosEmergencyOverlay').style.display = 'none';
      });
    }

    if (btnSosResolveActive) {
      btnSosResolveActive.addEventListener('click', () => {
        if (currentActiveSosAlert && currentActiveSosAlert.id) {
          resolveSosAlert(currentActiveSosAlert.id, 'RESOLVED');
        } else {
          document.getElementById('sosEmergencyOverlay').style.display = 'none';
        }
      });
    }

    if (btnRefreshSosHistory) {
      btnRefreshSosHistory.addEventListener('click', () => loadSosHistory());
    }

    document.querySelectorAll('#sosFilterChips .sos-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#sosFilterChips .sos-filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentSosFilter = chip.dataset.status || 'ALL';
        loadSosHistory(currentSosFilter);
      });
    });
  }

  async function executeSosDispatch() {
    document.getElementById('sosConfirmModal').style.display = 'none';

    // Usuário atual (primeiro membro do círculo) com sua posição e bateria
    const user = getCurrentUser();
    const loc = user?.location || {};

    const payload = {
      userId: user?.id,
      userName: user?.name,
      userAvatar: user?.avatarUrl || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
      battery: loc.battery !== undefined ? loc.battery : 90,
      message: `🚨 ALERTA DE EMERGÊNCIA: ${user?.name || 'Membro'} acionou o SOS de pânico!`,
    };

    try {
      const res = await apiFetch('/api/emergency/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const event = data?.event || payload;
      currentActiveSosAlert = event;
      triggerSosEmergencyOverlay(event);
      loadSosHistory();
      showToast('🚨 Alerta de SOS transmitido e gravado no histórico!');
    } catch (err) {
      console.error('Erro ao enviar SOS via REST:', err);
      // Fallback WS se houver falha de rede REST
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'TRIGGER_SOS', data: payload }));
      }
      triggerSosEmergencyOverlay(payload);
    }
  }

  function triggerSosEmergencyOverlay(alert) {
    currentActiveSosAlert = alert;
    const overlay = document.getElementById('sosEmergencyOverlay');
    const isCrash = alert?.type === 'CRASH' || String(alert?.message || '').includes('ACIDENTE');

    const sirenEl = overlay.querySelector('.emergency-siren-animation');
    const titleEl = overlay.querySelector('.emergency-title');
    if (sirenEl) sirenEl.textContent = isCrash ? '🚗💥' : '🚨';
    if (titleEl) titleEl.textContent = isCrash ? 'COLISÃO / ACIDENTE VEICULAR' : 'ALERTA DE EMERGÊNCIA / SOS';

    const defaultCrashText = `Possível colisão veicular detectada para ${alert.userName || 'Membro da Família'}!`;
    const defaultSosText = `${alert.userName || 'Membro'} acionou o botão de pânico SOS!`;
    document.getElementById('sosSenderText').textContent = alert.message || (isCrash ? defaultCrashText : defaultSosText);

    document.getElementById('sosEmergencyStats').innerHTML = `
      <div class="emergency-stat-item">
        <div class="e-label">Tipo</div>
        <div class="e-val">${isCrash ? 'Colisão 🚗' : 'SOS Manual 🚨'}</div>
      </div>
      <div class="emergency-stat-item">
        <div class="e-label">Bateria</div>
        <div class="e-val">${alert.battery !== undefined && alert.battery !== null ? alert.battery + '%' : '--'}</div>
      </div>
      <div class="emergency-stat-item">
        <div class="e-label">Horário</div>
        <div class="e-val">${new Date(alert.triggeredAt || alert.createdAt || Date.now()).toLocaleTimeString()}</div>
      </div>
    `;

    document.getElementById('btnSosNavigate').onclick = () => {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${alert.latitude},${alert.longitude}`;
      window.open(url, '_blank');
    };

    overlay.style.display = 'flex';
  }

  async function resolveSosAlert(sosId, status = 'RESOLVED') {
    if (!sosId) {
      document.getElementById('sosEmergencyOverlay').style.display = 'none';
      return;
    }
    try {
      const res = await apiFetch(`/api/emergency/sos/${sosId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        document.getElementById('sosEmergencyOverlay').style.display = 'none';
        showToast(status === 'RESOLVED' ? '✅ Alerta marcado como Seguro / Resolvido.' : 'Alerta cancelado.');
        loadSosHistory(currentSosFilter);
      } else {
        const err = await res.json();
        showToast(`Erro ao resolver: ${err.error || 'Falha na requisição'}`);
      }
    } catch (err) {
      console.error('Erro ao resolver SOS:', err);
      showToast('Erro de conexão ao resolver alerta.');
    }
  }

  async function loadSosHistory(status = null) {
    if (status !== null) currentSosFilter = status;
    const listEl = document.getElementById('sosEventsList');
    if (!listEl) return;

    try {
      const res = await apiFetch(`/api/emergency/sos?status=${currentSosFilter}&limit=50`);
      if (!res.ok) throw new Error('Falha ao obter histórico de SOS');
      const data = await res.json();
      renderSosHistory(data?.events || []);
    } catch (err) {
      console.error('Erro ao carregar histórico de SOS:', err);
      listEl.innerHTML = '<div class="loading-state">Erro ao carregar histórico de segurança.</div>';
    }
  }

  function renderSosHistory(events) {
    const listEl = document.getElementById('sosEventsList');
    if (!listEl) return;

    if (!events || events.length === 0) {
      listEl.innerHTML = '<div class="loading-state" style="padding: 12px 0; font-size: 12px;">Nenhum alerta de emergência registrado.</div>';
      return;
    }

    listEl.innerHTML = events.map(ev => {
      const u = ev.user || {};
      const userColor = u.color || '#EF4444';
      const initials = (u.name || 'Membro').slice(0, 2).toUpperCase();
      const timeStr = new Date(ev.createdAt).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      const isCrash = ev.type === 'CRASH' || String(ev.message || '').includes('ACIDENTE');
      const isResolved = ev.status === 'RESOLVED';
      const isActive = ev.status === 'ACTIVE';
      const statusLabel = isActive ? (isCrash ? '💥 Colisão Ativa' : 'Ativo') : isResolved ? 'Resolvido' : 'Cancelado';
      const badgeClass = isActive ? 'active' : isResolved ? 'resolved' : 'canceled';

      let resolvedInfo = '';
      if (isResolved && ev.resolvedAt) {
        const resTime = new Date(ev.resolvedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const resName = ev.resolvedBy?.name || 'Família';
        resolvedInfo = ` • Resolvido às ${resTime} por ${resName}`;
      }

      return `
        <div class="sos-card ${isActive ? 'active-alert' : ''} ${isCrash ? 'crash-card' : ''}">
          <div class="sos-card-header">
            <div class="sos-user-wrap">
              <div class="sos-user-avatar" style="background: ${isCrash ? '#DC2626' : userColor};">
                ${isCrash ? '🚗' : initials}
              </div>
              <div class="sos-user-info">
                <span class="sos-user-name">${u.name || 'Membro'}${isCrash ? ' (Acidente)' : ''}</span>
                <span class="sos-time">${timeStr}${resolvedInfo}</span>
              </div>
            </div>
            <span class="sos-status-badge ${badgeClass}">${statusLabel}</span>
          </div>

          <div class="sos-card-message">${ev.message || (isCrash ? 'Colisão veicular detectada' : 'Alerta de SOS acionado')}</div>

          <div class="sos-card-meta">
            <span>🔋 ${ev.battery !== null && ev.battery !== undefined ? ev.battery + '%' : '--'}</span>
            <span>📍 ${ev.latitude ? ev.latitude.toFixed(4) : 0}, ${ev.longitude ? ev.longitude.toFixed(4) : 0}</span>
          </div>

          <div class="sos-card-actions">
            <button class="sos-action-btn map" onclick="window.viewSosOnMap(${ev.latitude}, ${ev.longitude})">
              🗺️ Ver no Mapa
            </button>
            ${isActive ? `
              <button class="sos-action-btn resolve" onclick="window.resolveSosItem('${ev.id}')">
                ✅ Marcar como Seguro
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  window.viewSosOnMap = (lat, lon) => {
    if (!lat && !lon) return;
    map.flyTo([lat, lon], 17, { animate: true, duration: 1.2 });
    showToast('📍 Centralizado na localização do alerta de emergência.');
  };

  window.resolveSosItem = (id) => {
    resolveSosAlert(id, 'RESOLVED');
  };

  // Bridge nativa para eventos recebidos do app mobile Expo (Etapa 9.3)
  function handleNativeBridgeMessage(event) {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (!data || !data.type) return;
      if (data.type === 'NATIVE_CRASH_DETECTED') {
        showToast(`🚗💥 Impacto de ${data.gForce}G detectado no sensor. Contagem de segurança ativa.`);
      } else if (data.type === 'NATIVE_CRASH_SOS_SENT') {
        showToast('🚨 Alerta de acidente transmitido à família!');
        loadSosHistory(currentSosFilter);
      }
    } catch {}
  }
  window.addEventListener('message', handleNativeBridgeMessage);
  document.addEventListener('message', handleNativeBridgeMessage);

  // 16b. Edição de Perfil & Foto Real do Membro (Etapa 8.7)
  let profilePendingAvatarFile = null;
  let profileCurrentAvatarUrl = '';

  function updateProfileAvatarPreview(name, avatarUrl, color) {
    const circle = document.getElementById('profileAvatarCircle');
    const initialsEl = document.getElementById('profileAvatarInitials');
    const imgEl = document.getElementById('profileAvatarImg');
    const removeBtn = document.getElementById('btnRemoveAvatarPhoto');

    circle.style.backgroundColor = color || '#3B82F6';
    initialsEl.textContent = (name || '--').substring(0, 2).toUpperCase();

    if (avatarUrl) {
      imgEl.src = avatarUrl;
      imgEl.style.display = 'block';
      initialsEl.style.display = 'none';
      if (removeBtn) removeBtn.style.display = 'inline-block';
    } else {
      imgEl.src = '';
      imgEl.style.display = 'none';
      initialsEl.style.display = 'block';
      if (removeBtn) removeBtn.style.display = 'none';
    }
  }

  window.openProfileModal = (userId) => {
    const member = membersData.find((m) => m.id === userId);
    if (!member) {
      showToast('Membro não encontrado.');
      return;
    }

    profilePendingAvatarFile = null;
    profileCurrentAvatarUrl = member.avatarUrl || '';

    document.getElementById('profileUserId').value = member.id;
    document.getElementById('profileName').value = member.name || '';
    document.getElementById('profilePhone').value = member.phone || '';
    document.getElementById('profileColor').value = member.color || '#3B82F6';
    document.getElementById('profileAvatarFileInput').value = '';

    document.querySelectorAll('#profileColorSwatches .color-swatch').forEach((sw) => {
      sw.classList.toggle('active', sw.dataset.color === (member.color || '#3B82F6'));
    });

    updateProfileAvatarPreview(member.name, profileCurrentAvatarUrl, member.color);
    document.getElementById('profileModal').style.display = 'flex';
  };

  function setupProfileModal() {
    const modal = document.getElementById('profileModal');
    const fileInput = document.getElementById('profileAvatarFileInput');
    const nameInput = document.getElementById('profileName');
    const colorInput = document.getElementById('profileColor');

    const closeModal = () => {
      modal.style.display = 'none';
      profilePendingAvatarFile = null;
    };

    const closeBtn = document.getElementById('btnCloseProfileModal');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const cancelBtn = document.getElementById('btnCancelProfile');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    const triggerBtn = document.getElementById('btnTriggerAvatarFile');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          showToast('⚠️ Imagem muito grande. Máximo de 5MB.');
          fileInput.value = '';
          return;
        }
        profilePendingAvatarFile = file;
        const previewUrl = URL.createObjectURL(file);
        updateProfileAvatarPreview(nameInput.value, previewUrl, colorInput.value);
      });
    }

    const removeBtn = document.getElementById('btnRemoveAvatarPhoto');
    if (removeBtn) {
      removeBtn.addEventListener('click', async () => {
        const userId = document.getElementById('profileUserId').value;
        if (!userId) return;
        try {
          const res = await apiFetch(`/api/members/${userId}/avatar`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Falha ao remover foto');
          profileCurrentAvatarUrl = '';
          profilePendingAvatarFile = null;
          fileInput.value = '';
          updateProfileAvatarPreview(nameInput.value, '', colorInput.value);
          await loadMembers();
          showToast('🗑️ Foto removida. Voltando às iniciais coloridas.');
        } catch (err) {
          console.error(err);
          showToast('Erro ao remover a foto de perfil.');
        }
      });
    }

    if (nameInput) {
      nameInput.addEventListener('input', () => {
        const preview = profilePendingAvatarFile
          ? document.getElementById('profileAvatarImg').src
          : profileCurrentAvatarUrl;
        updateProfileAvatarPreview(nameInput.value, preview, colorInput.value);
      });
    }

    document.querySelectorAll('#profileColorSwatches .color-swatch').forEach((sw) => {
      sw.addEventListener('click', () => {
        document.querySelectorAll('#profileColorSwatches .color-swatch').forEach((s) => s.classList.remove('active'));
        sw.classList.add('active');
        colorInput.value = sw.dataset.color;
        document.getElementById('profileAvatarCircle').style.backgroundColor = sw.dataset.color;
      });
    });

    const form = document.getElementById('profileForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('profileUserId').value;
        const name = nameInput.value.trim();
        const phone = document.getElementById('profilePhone').value.trim();
        const color = colorInput.value;
        const saveBtn = document.getElementById('btnSaveProfile');

        if (!userId) return;
        if (!name) {
          showToast('⚠️ O nome do membro é obrigatório.');
          return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Salvando...';

        try {
          // 1. Envia a foto, se houver uma nova selecionada
          if (profilePendingAvatarFile) {
            const formData = new FormData();
            formData.append('file', profilePendingAvatarFile);
            const uploadRes = await apiFetch(`/api/members/${userId}/avatar`, {
              method: 'POST',
              body: formData,
            });
            if (!uploadRes.ok) {
              const err = await uploadRes.json().catch(() => ({}));
              throw new Error(err.error || 'Falha no upload da foto');
            }
          }

          // 2. Atualiza os dados de texto/cor
          const res = await apiFetch(`/api/members/${userId}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, color }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Falha ao salvar perfil');
          }

          closeModal();
          await loadMembers();
          showToast('✅ Perfil do membro atualizado com sucesso!');
        } catch (err) {
          console.error('Erro ao salvar perfil:', err);
          showToast(`Erro: ${err.message}`);
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Salvar Alterações';
        }
      });
    }
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

  // 18. Notificações Push Web (VAPID / Web Push)
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function updatePushNotificationUI() {
    const toggleBtn = document.getElementById('btnTogglePushNotifications');
    const testBtn = document.getElementById('btnTestPushNotification');
    if (!toggleBtn) return;

    // 1. Se estiver rodando dentro do App Android (APK com WebView nativo)
    const isNativeApp = !!(window.ReactNativeWebView || /MyLife360App/i.test(navigator.userAgent));
    if (isNativeApp) {
      toggleBtn.classList.add('push-active');
      toggleBtn.textContent = '🟢 Notificações Nativas do App Ativas';
      toggleBtn.title = 'Rastreamento em segundo plano e alertas gerenciados nativamente pelo Android';
      toggleBtn.disabled = false;
      if (testBtn) {
        testBtn.style.display = 'block';
        testBtn.textContent = '📲 Testar Notificação no Celular';
      }
      return;
    }

    // 2. Se for navegador comum, mas não suportar a Web Push API (ex: iOS sem PWA ou anônimo)
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toggleBtn.classList.remove('push-active');
      toggleBtn.textContent = 'ℹ️ Notificações Web Indisponíveis';
      toggleBtn.title = 'Para notificações em segundo plano neste navegador, acesse pelo Google Chrome ou instale o App Android';
      toggleBtn.disabled = false;
      if (testBtn) testBtn.style.display = 'none';
      return;
    }

    // 3. Navegador comum com suporte a Web Push API (Chrome / Edge / Firefox)
    try {
      const reg = window.swRegistration || (await navigator.serviceWorker.ready);
      const sub = await reg.pushManager.getSubscription();
      if (sub && Notification.permission === 'granted') {
        toggleBtn.classList.add('push-active');
        toggleBtn.textContent = '🔔 Notificações Ativas (Toque para desativar)';
        if (testBtn) {
          testBtn.style.display = 'block';
          testBtn.textContent = '📲 Testar Notificação Push';
        }
      } else {
        toggleBtn.classList.remove('push-active');
        toggleBtn.textContent = '🔔 Ativar Notificações no Celular';
        if (testBtn) testBtn.style.display = 'none';
      }
    } catch (err) {
      console.warn('Erro ao verificar status push:', err);
    }
  }

  async function togglePushNotifications() {
    const toggleBtn = document.getElementById('btnTogglePushNotifications');
    const isNativeApp = !!(window.ReactNativeWebView || /MyLife360App/i.test(navigator.userAgent));

    if (isNativeApp) {
      showToast('🟢 O My Life360 gerencia o rastreamento e alertas nativamente pelo Android!');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showToast('Este navegador não suporta a Web Push API. Abra pelo Google Chrome ou use o App Android.');
      return;
    }

    const reg = window.swRegistration || (await navigator.serviceWorker.ready);
    const existingSub = await reg.pushManager.getSubscription();

    if (existingSub) {
      try {
        const endpoint = existingSub.endpoint;
        await existingSub.unsubscribe();
        await apiFetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
        showToast('Notificações push desativadas.');
        updatePushNotificationUI();
      } catch (err) {
        console.error('Erro ao desinscrever:', err);
        showToast('Erro ao desativar notificações.');
      }
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('Permissão de notificação negada no navegador.');
        return;
      }

      const keyRes = await apiFetch('/api/push/public-key');
      const keyData = await keyRes.json();
      if (!keyData.configured || !keyData.publicKey) {
        showToast('Servidor não possui chaves VAPID configuradas.');
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);
      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subJson = newSub.toJSON();
      const res = await apiFetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
          userAgent: navigator.userAgent,
        }),
      });

      if (res.ok) {
        showToast('🔔 Notificações push ativadas com sucesso!');
        updatePushNotificationUI();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Erro ao registrar notificação.');
      }
    } catch (err) {
      console.error('Falha ao ativar push:', err);
      showToast('Erro ao ativar notificações push.');
    }
  }

  async function testPushNotification() {
    const isNativeApp = !!(window.ReactNativeWebView || /MyLife360App/i.test(navigator.userAgent));
    if (isNativeApp && window.ReactNativeWebView?.postMessage) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'TEST_NOTIFICATION',
          title: '🔔 Notificação My Life360',
          body: 'O rastreamento em segundo plano e alertas nativos estão 100% operacionais neste aparelho!',
        })
      );
      showToast('Disparado no celular!');
      return;
    }

    try {
      showToast('Enviando notificação de teste...');
      const res = await apiFetch('/api/push/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Notificação enviada!');
      } else {
        showToast(data.error || 'Falha ao testar notificação.');
      }
    } catch (err) {
      console.error('Erro ao testar push:', err);
      showToast('Erro ao solicitar teste.');
    }
  }

  function setupPushNotifications() {
    const toggleBtn = document.getElementById('btnTogglePushNotifications');
    const testBtn = document.getElementById('btnTestPushNotification');
    if (toggleBtn) toggleBtn.addEventListener('click', togglePushNotifications);
    if (testBtn) testBtn.addEventListener('click', testPushNotification);

    window.onServiceWorkerReady = () => updatePushNotificationUI();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => updatePushNotificationUI());
    }
  }

  // Sanitizador simples para inserção segura no DOM
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==========================================================
  // 19. Dispositivos & Chaves de Telemetria GPS (Etapa 8.9)
  // ==========================================================
  const revealedDeviceKeys = new Set();

  async function loadDevices() {
    const listEl = document.getElementById('devicesList');
    if (!listEl) return;

    try {
      const res = await apiFetch('/api/devices');
      if (!res.ok) {
        listEl.innerHTML = '<div class="loading-state">Erro ao carregar dispositivos.</div>';
        return;
      }

      const devices = await res.json();
      if (!devices || devices.length === 0) {
        listEl.innerHTML = `
          <div class="loading-state">
            Nenhum aparelho conectado.<br>
            <span style="font-size: 11px; color: var(--text-tertiary);">
              Clique em "+ Conectar Novo Aparelho" acima para autorizar o envio de GPS.
            </span>
          </div>`;
        return;
      }

      listEl.innerHTML = devices
        .map((d) => {
          const isRevealed = revealedDeviceKeys.has(d.id);
          const keyDisplay = isRevealed ? (d.apiKey || d.maskedApiKey) : d.maskedApiKey;
          const eyeIcon = isRevealed ? '🔒 Ocultar' : '👁️ Revelar';
          const onlineClass = d.online ? 'online' : 'offline';
          const onlineText = d.online
            ? '🟢 Online'
            : d.minutesAgo !== null
            ? `⚪ Visto há ${d.minutesAgo} min`
            : '⚪ Nunca visto';
          const userBadge = d.user
            ? `<span class="device-user-badge">👤 ${escapeHtml(d.user.name)}</span>`
            : '<span class="device-user-badge" style="background:#F1F5F9; color:#64748B;">Sem membro</span>';

          return `
            <div class="device-card" data-device-id="${d.id}">
              <div class="device-card-header">
                <div class="device-title-wrap">
                  <span class="device-name">${escapeHtml(d.name)}</span>
                  <span class="device-identifier">ID: ${escapeHtml(d.identifier)}</span>
                  ${userBadge}
                </div>
                <span class="device-online-badge ${onlineClass}">${onlineText}</span>
              </div>
              <div class="device-key-box">
                <span class="key-text" id="devKey_${d.id}">${escapeHtml(keyDisplay)}</span>
                <button type="button" class="device-key-btn" onclick="window.toggleRevealDeviceKey('${d.id}')">${eyeIcon}</button>
                <button type="button" class="device-key-btn" onclick="window.copyDeviceKey('${d.id}', '${d.apiKey}')">📋 Copiar</button>
              </div>
              <div class="device-actions-row">
                <button type="button" class="btn small secondary" onclick="window.rotateDeviceKey('${d.id}', '${escapeHtml(d.name)}')">🔑 Rotacionar Chave</button>
                <button type="button" class="btn small secondary" style="color: var(--accent-red);" onclick="window.deleteDevice('${d.id}', '${escapeHtml(d.name)}')">🗑️ Excluir</button>
              </div>
            </div>`;
        })
        .join('');
    } catch (err) {
      console.error('Erro ao carregar dispositivos:', err);
      listEl.innerHTML = '<div class="loading-state">Falha de conexão com o servidor.</div>';
    }
  }

  window.toggleRevealDeviceKey = (id) => {
    if (revealedDeviceKeys.has(id)) {
      revealedDeviceKeys.delete(id);
    } else {
      revealedDeviceKeys.add(id);
    }
    loadDevices();
  };

  window.copyDeviceKey = async (id, fullKey) => {
    try {
      await navigator.clipboard.writeText(fullKey);
      showToast('Chave de telemetria copiada! Cole no app mobile ou Traccar.');
    } catch {
      showToast(`Chave: ${fullKey}`);
    }
  };

  window.rotateDeviceKey = async (id, name) => {
    if (!confirm(`Deseja gerar uma nova chave de envio para "${name}"? O aparelho precisará atualizar a chave para continuar transmitindo.`)) {
      return;
    }
    try {
      const res = await apiFetch(`/api/devices/${id}/rotate-key`, { method: 'POST' });
      if (res.ok) {
        showToast('Nova chave gerada com sucesso! 🔑');
        revealedDeviceKeys.add(id);
        loadDevices();
      } else {
        const err = await res.json();
        showToast(err.error || 'Erro ao rotacionar chave.');
      }
    } catch (err) {
      showToast('Falha ao comunicar com o servidor.');
    }
  };

  window.deleteDevice = async (id, name) => {
    if (!confirm(`Remover o aparelho "${name}"? Todo o histórico de localização deste aparelho será excluído.`)) {
      return;
    }
    try {
      const res = await apiFetch(`/api/devices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Aparelho removido com sucesso.');
        loadDevices();
      } else {
        const err = await res.json();
        showToast(err.error || 'Erro ao remover aparelho.');
      }
    } catch (err) {
      showToast('Falha ao comunicar com o servidor.');
    }
  };

  function setupDevicesModal() {
    const modal = document.getElementById('devicesModal');
    const openBtn = document.getElementById('btnOpenDevicesModal');
    const closeBtn = document.getElementById('btnCloseDevicesModal');
    const toggleFormBtn = document.getElementById('btnToggleNewDeviceForm');
    const form = document.getElementById('newDeviceForm');
    const cancelFormBtn = document.getElementById('btnCancelNewDevice');
    const userSelect = document.getElementById('newDeviceUserId');

    if (!modal) return;

    function populateMemberSelect() {
      if (!userSelect) return;
      const currentVal = userSelect.value;
      userSelect.innerHTML = '<option value="">(Nenhum / Não associado)</option>' +
        membersData.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
      if (currentVal) userSelect.value = currentVal;
    }

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        populateMemberSelect();
        modal.style.display = 'flex';
        loadDevices();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    if (toggleFormBtn) {
      toggleFormBtn.addEventListener('click', () => {
        const isHidden = form.style.display === 'none';
        form.style.display = isHidden ? 'flex' : 'none';
        toggleFormBtn.textContent = isHidden ? '▲ Recolher Formulário' : '➕ Conectar Novo Aparelho';
      });
    }

    if (cancelFormBtn) {
      cancelFormBtn.addEventListener('click', () => {
        form.reset();
        form.style.display = 'none';
        toggleFormBtn.textContent = '➕ Conectar Novo Aparelho';
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('btnSaveNewDevice');
        const name = document.getElementById('newDeviceName').value.trim();
        const identifier = document.getElementById('newDeviceIdentifier').value.trim();
        const userId = userSelect.value || null;

        if (!name) return;
        saveBtn.disabled = true;

        try {
          const res = await apiFetch('/api/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              identifier: identifier || undefined,
              userId: userId || undefined,
            }),
          });

          const data = await res.json();
          if (res.ok) {
            showToast('Aparelho conectado! Copie a chave gerada.');
            form.reset();
            form.style.display = 'none';
            toggleFormBtn.textContent = '➕ Conectar Novo Aparelho';
            revealedDeviceKeys.add(data.id);
            await loadDevices();
          } else {
            showToast(data.error || 'Erro ao cadastrar aparelho.');
          }
        } catch (err) {
          console.error('Erro ao criar dispositivo:', err);
          showToast('Falha de conexão ao criar dispositivo.');
        } finally {
          saveBtn.disabled = false;
        }
      });
    }
  }

  // ==========================================================
  // 20. Painel de Administração, Backups & Auditoria (Etapa 8.9)
  // ==========================================================
  async function loadBackups() {
    const listEl = document.getElementById('backupsList');
    if (!listEl) return;

    try {
      const res = await apiFetch('/api/admin/backups');
      if (!res.ok) {
        listEl.innerHTML = '<div class="loading-state">Erro ao listar backups (requer perfil admin).</div>';
        return;
      }
      const data = await res.json();
      const backups = data.backups || [];

      if (backups.length === 0) {
        listEl.innerHTML = '<div class="loading-state">Nenhum backup em disco ainda. O agendador criará backups diários automaticamente.</div>';
        return;
      }

      listEl.innerHTML = backups
        .map((b) => {
          const dateStr = new Date(b.createdAt).toLocaleString('pt-BR');
          return `
            <div class="backup-item">
              <div>
                <div class="backup-item-title">📦 ${escapeHtml(b.filename)}</div>
                <div class="backup-item-meta">${dateStr} • <strong>${b.sizeMb} MB</strong> • SQLite format 3</div>
              </div>
              <span class="badge-online">Íntegro</span>
            </div>`;
        })
        .join('');
    } catch (err) {
      console.error('Erro ao listar backups:', err);
      listEl.innerHTML = '<div class="loading-state">Falha ao consultar backups.</div>';
    }
  }

  async function loadAuditSummary() {
    try {
      const res = await apiFetch('/api/admin/logs/summary');
      if (!res.ok) return;
      const data = await res.json();
      const totalEl = document.getElementById('logSummaryTotal');
      const errEl = document.getElementById('logSummaryErrors');
      const failEl = document.getElementById('logSummaryFailedLogins');
      if (totalEl) totalEl.textContent = data.total24h ?? '--';
      if (errEl) errEl.textContent = data.errors24h ?? '0';
      if (failEl) failEl.textContent = data.failedLogins24h ?? '0';
    } catch (err) {
      console.error('Erro ao carregar resumo de logs:', err);
    }
  }

  async function loadAuditLogs(onlyErrors = false) {
    const listEl = document.getElementById('auditLogsList');
    if (!listEl) return;

    try {
      const url = `/api/admin/logs?limit=80${onlyErrors ? '&onlyErrors=true' : ''}`;
      const res = await apiFetch(url);
      if (!res.ok) {
        listEl.innerHTML = '<div class="loading-state">Erro ao carregar logs.</div>';
        return;
      }
      const data = await res.json();
      const logs = Array.isArray(data) ? data : (data.logs || []);

      if (!logs || logs.length === 0) {
        listEl.innerHTML = '<div class="loading-state">Nenhum registro de acesso encontrado.</div>';
        return;
      }

      listEl.innerHTML = logs
        .map((l) => {
          const timeStr = new Date(l.createdAt).toLocaleTimeString('pt-BR');
          const statusPrefix = Math.floor(l.statusCode / 100);
          const statusClass = `s-${statusPrefix}xx`;
          const durationStr = l.durationMs !== null ? `${l.durationMs}ms` : '--';
          const ipStr = l.ip || 'local';
          const userStr = l.userName ? ` (${escapeHtml(l.userName)})` : '';

          return `
            <div class="log-item">
              <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                <span class="log-badge-method ${l.method}">${l.method}</span>
                <span class="log-badge-status ${statusClass}">${l.statusCode}</span>
                <span style="font-family: monospace; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;" title="${escapeHtml(l.path)}">
                  ${escapeHtml(l.path)}
                </span>
              </div>
              <div style="font-size: 10px; color: var(--text-tertiary); text-align: right; white-space: nowrap;">
                <span>${durationStr} • ${escapeHtml(ipStr)}${userStr}</span><br>
                <span>${timeStr}</span>
              </div>
            </div>`;
        })
        .join('');
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
      listEl.innerHTML = '<div class="loading-state">Falha de conexão com os logs.</div>';
    }
  }

  function setupAdminModal() {
    const modal = document.getElementById('adminModal');
    const openBtn = document.getElementById('btnOpenAdminModal');
    const closeBtn = document.getElementById('btnCloseAdminModal');
    const tabBackups = document.getElementById('tabBtnBackups');
    const tabLogs = document.getElementById('tabBtnLogs');
    const paneBackups = document.getElementById('adminPaneBackups');
    const paneLogs = document.getElementById('adminPaneLogs');
    const btnCreateBackup = document.getElementById('btnCreateBackupNow');
    const btnPruneBackups = document.getElementById('btnPruneBackups');
    const chkOnlyErrors = document.getElementById('chkLogsOnlyErrors');
    const btnRefreshLogs = document.getElementById('btnRefreshLogs');

    if (!modal) return;

    function switchAdminTab(tab) {
      if (tab === 'backups') {
        tabBackups.classList.add('active');
        tabLogs.classList.remove('active');
        paneBackups.style.display = 'block';
        paneLogs.style.display = 'none';
        loadBackups();
      } else {
        tabLogs.classList.add('active');
        tabBackups.classList.remove('active');
        paneLogs.style.display = 'block';
        paneBackups.style.display = 'none';
        loadAuditSummary();
        loadAuditLogs(chkOnlyErrors?.checked || false);
      }
    }

    if (tabBackups) tabBackups.addEventListener('click', () => switchAdminTab('backups'));
    if (tabLogs) tabLogs.addEventListener('click', () => switchAdminTab('logs'));

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        if (currentAuthUser && currentAuthUser.role !== 'admin') {
          showToast('Apenas administradores podem acessar este painel.');
          return;
        }
        modal.style.display = 'flex';
        switchAdminTab('backups');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    if (btnCreateBackup) {
      btnCreateBackup.addEventListener('click', async () => {
        btnCreateBackup.disabled = true;
        btnCreateBackup.textContent = 'Criando backup...';
        try {
          const res = await apiFetch('/api/admin/backup', { method: 'POST' });
          const data = await res.json();
          if (res.ok) {
            showToast(`✅ Backup criado: ${data.backup?.filename || 'OK'}`);
            loadBackups();
          } else {
            showToast(data.error || 'Erro ao criar backup.');
          }
        } catch (err) {
          showToast('Falha ao comunicar com o servidor.');
        } finally {
          btnCreateBackup.disabled = false;
          btnCreateBackup.textContent = '💾 Fazer Backup Manual Agora';
        }
      });
    }

    if (btnPruneBackups) {
      btnPruneBackups.addEventListener('click', async () => {
        if (!confirm('Deseja podar backups com mais de 14 dias de retenção?')) return;
        try {
          const res = await apiFetch('/api/admin/backups/prune', { method: 'POST' });
          const data = await res.json();
          showToast(`🧹 Limpeza concluída: ${data.deletedCount} removidos.`);
          loadBackups();
        } catch {
          showToast('Falha ao podar backups.');
        }
      });
    }

    if (chkOnlyErrors) {
      chkOnlyErrors.addEventListener('change', () => {
        loadAuditLogs(chkOnlyErrors.checked);
      });
    }

    if (btnRefreshLogs) {
      btnRefreshLogs.addEventListener('click', () => {
        loadAuditSummary();
        loadAuditLogs(chkOnlyErrors?.checked || false);
        showToast('Logs atualizados.');
      });
    }
  }

  // Modal de Código de Recuperação de Senha (Etapa 9.7)
  function setupResetCodeModal() {
    const modal = document.getElementById('resetCodeModal');
    const btnClose = document.getElementById('btnCloseResetCodeModal');
    const btnCopy = document.getElementById('btnCopyResetCode');
    const btnCopyWhatsapp = document.getElementById('btnCopyResetWhatsapp');

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => {
        modal.style.display = 'none';
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });
    }

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const code = document.getElementById('resetDisplayCode')?.textContent?.trim() || '';
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code);
          showToast('Código copiado para a área de transferência! 📋');
        } catch {
          showToast(`Código: ${code}`);
        }
      });
    }

    if (btnCopyWhatsapp) {
      btnCopyWhatsapp.addEventListener('click', async () => {
        const targetName = document.getElementById('resetTargetName')?.textContent?.trim() || 'Membro';
        const code = document.getElementById('resetDisplayCode')?.textContent?.trim() || '';
        const appUrl = window.location.origin;
        const msg = `Oi ${targetName}! Seu código de recuperação de senha no My Life360 é: *${code}*.\n\nEle é válido por 30 minutos.\nAcesse ${appUrl} e clique em "Esqueci minha senha" para cadastrar sua nova senha.`;

        try {
          await navigator.clipboard.writeText(msg);
          showToast('Mensagem pronta copiada para o WhatsApp! 💬');
        } catch {
          showToast('Não foi possível copiar automaticamente.');
        }
      });
    }
  }

  // Inicialização
  // Inicializa a aplicação somente após autenticação bem-sucedida
  // ---------- Uso de celular ao volante (Etapa 10.3) ----------
  // O cliente só enxerga a própria tela: enquanto ela estiver ATIVA (documento
  // visível) e o veículo se deslocando acima do limiar, contamos tempo de
  // "celular ao volante". Vale igual para o navegador e para o WebView do APK.
  // Limitação honesta: mexer em OUTRO app não é detectável sem a permissão
  // Android UsageStats (build nativo dedicado) — esse tempo não é contado.
  const PHONE_USAGE_MIN_SPEED_KMH = 20;
  const PHONE_USAGE_TICK_MS = 5000;
  const PHONE_USAGE_MIN_EPISODE_SEC = 15;
  const PHONE_USAGE_HEARTBEAT_MS = 60000;
  const PHONE_USAGE_PREF_KEY = 'life360_phone_usage_enabled';

  let phoneUsageEnabled = localStorage.getItem(PHONE_USAGE_PREF_KEY) !== 'false';
  let phoneUsageState = { startedAt: 0, lastTick: 0, maxSpeed: 0 };
  let phoneUsageTimer = null;

  function isLikelyMobileDevice() {
    try {
      const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
      return Boolean(coarse || mobileUa);
    } catch (_e) {
      return false;
    }
  }

  // Velocidade do próprio aparelho, vinda da telemetria ao vivo
  function getOwnSpeedKmH() {
    if (!currentAuthUser || !currentAuthUser.id) return 0;
    const me = membersData.find((m) => m.id === currentAuthUser.id);
    const spd = Number(me?.location?.speed);
    return Number.isFinite(spd) && spd > 0 ? spd : 0;
  }

  function flushPhoneUsage() {
    const { startedAt, lastTick, maxSpeed } = phoneUsageState;
    phoneUsageState = { startedAt: 0, lastTick: 0, maxSpeed: 0 };

    if (!startedAt || !lastTick) return;
    const durationSeconds = Math.round((lastTick - startedAt) / 1000);
    if (durationSeconds < PHONE_USAGE_MIN_EPISODE_SEC) return;

    const body = JSON.stringify({
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(lastTick).toISOString(),
      durationSeconds,
      maxSpeedKmH: Math.round(maxSpeed || getOwnSpeedKmH()),
      source: window.ReactNativeWebView ? 'apk_appstate' : 'pwa_visible',
    });

    // keepalive permite que o envio sobreviva ao fechamento/troca de app
    fetch('/api/phone-usage/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body,
      keepalive: true,
    }).catch((err) => console.warn('[PhoneUsage] Falha ao enviar episódio:', err));
  }

  function tickPhoneUsage() {
    if (!phoneUsageEnabled || !authToken) return;

    const now = Date.now();
    const visible = document.visibilityState === 'visible';
    const isMoving = getOwnSpeedKmH() > PHONE_USAGE_MIN_SPEED_KMH;

    if (visible && isMoving && isLikelyMobileDevice()) {
      if (!phoneUsageState.startedAt) {
        phoneUsageState.startedAt = now;
      }
      phoneUsageState.lastTick = now;
      phoneUsageState.maxSpeed = Math.max(phoneUsageState.maxSpeed, getOwnSpeedKmH());

      // Envia em blocos de 1 min para não perder um episódio longo se a aba fechar
      if (now - phoneUsageState.startedAt >= PHONE_USAGE_HEARTBEAT_MS) {
        const segmentStart = phoneUsageState.startedAt;
        const segmentEnd = now;
        phoneUsageState.startedAt = now;
        phoneUsageState.lastTick = now;

        const durationSeconds = Math.round((segmentEnd - segmentStart) / 1000);
        if (durationSeconds >= PHONE_USAGE_MIN_EPISODE_SEC) {
          fetch('/api/phone-usage/ingest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              startedAt: new Date(segmentStart).toISOString(),
              endedAt: new Date(segmentEnd).toISOString(),
              durationSeconds,
              maxSpeedKmH: Math.round(phoneUsageState.maxSpeed || getOwnSpeedKmH()),
              source: window.ReactNativeWebView ? 'apk_appstate' : 'pwa_visible',
            }),
            keepalive: true,
          }).catch((err) => console.warn('[PhoneUsage] Falha ao enviar bloco:', err));
        }
      }
    } else {
      flushPhoneUsage();
    }
  }

  function startPhoneUsageTracker() {
    if (phoneUsageTimer) return;
    phoneUsageTimer = setInterval(tickPhoneUsage, PHONE_USAGE_TICK_MS);
    updatePhoneUsageToggleUI();
  }

  function stopPhoneUsageTracker() {
    if (phoneUsageTimer) {
      clearInterval(phoneUsageTimer);
      phoneUsageTimer = null;
    }
    phoneUsageState = { startedAt: 0, lastTick: 0, maxSpeed: 0 };
  }

  function updatePhoneUsageToggleUI() {
    const btn = document.getElementById('btnTogglePhoneUsage');
    if (!btn) return;
    btn.textContent = phoneUsageEnabled ? '📱 Celular ao volante: Medindo' : '📵 Celular ao volante: Pausado';
    btn.classList.toggle('paused', !phoneUsageEnabled);
  }

  function setupPhoneUsageToggle() {
    const btn = document.getElementById('btnTogglePhoneUsage');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    updatePhoneUsageToggleUI();

    btn.addEventListener('click', () => {
      phoneUsageEnabled = !phoneUsageEnabled;
      localStorage.setItem(PHONE_USAGE_PREF_KEY, phoneUsageEnabled ? 'true' : 'false');
      if (!phoneUsageEnabled) flushPhoneUsage();
      updatePhoneUsageToggleUI();
      showToast(
        phoneUsageEnabled
          ? '📱 Monitoramento de celular ao volante ativado.'
          : '📵 Monitoramento de celular ao volante pausado.'
      );
    });
  }

  // Fecha o episódio em aberto quando a tela apaga / o app vai para segundo plano
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPhoneUsage();
    }
  });
  window.addEventListener('pagehide', () => {
    flushPhoneUsage();
  });

  async function startApp() {
    if (appStarted) {
      loadMembers();
      loadPlaces();
      loadChat();
      loadUnreadDms();
      loadSosHistory();
      loadCircleData();
      connectWebSocket();
      updatePushNotificationUI();
      setupPhoneUsageToggle();
      startPhoneUsageTracker();
      if (map) {
        try { map.invalidateSize(); } catch (_e) {}
      }
      return;
    }
    appStarted = true;

    await initMap();
    connectWebSocket();
    loadCircleData();
    loadMembers();
    loadPlaces();
    loadChat();
    loadUnreadDms();
    loadSosHistory();
    setupPushNotifications();
    setupPhoneUsageToggle();
    startPhoneUsageTracker();

    setTimeout(() => {
      if (map) {
        try { map.invalidateSize(); } catch (_e) {}
      }
    }, 200);
  }

  async function bootstrapAuth() {
    setupAuthForm();
    document.getElementById('btnLogout').addEventListener('click', logout);

    const authenticated = await checkAuthStatus();
    if (authenticated) {
      await startApp();
    }
  }

  bootstrapAuth();
});
