// My Life360 Web / PWA App Core (Estilo Life360 Oficial + Todos os Recursos Premium Desbloqueados)
document.addEventListener('DOMContentLoaded', () => {
  let map;
  let currentTileLayer = null;
  let cartoKey = '';
  let currentLayerType = localStorage.getItem('life360_map_layer') || 'voyager';

  let memberMarkers = new Map(); // userId -> { marker, accuracyCircle }
  let placeLayers = new Map();   // placeId -> { circle, labelMarker }
  let historyPolyline = null;
  let tripStartMarker = null;
  let tripEndMarker = null;
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
  let currentAuthUser = null;
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
    const submitBtn = document.getElementById('authSubmitBtn');
    const footnote = document.getElementById('authFootnote');
    const errorEl = document.getElementById('authError');
    const toggleWrap = document.getElementById('authToggleWrap');
    const toggleBtn = document.getElementById('btnToggleAuthMode');

    screen.classList.remove('hidden');

    if (mode === 'setup') {
      subtitle.textContent = 'Primeira configuração: crie sua conta de administrador e seu círculo';
      nameGroup.style.display = 'block';
      if (inviteGroup) inviteGroup.style.display = 'none';
      submitBtn.textContent = 'Criar conta e entrar';
      footnote.textContent = 'Esta conta protegerá o acesso a todas as localizações da família.';
      document.getElementById('authPassword').setAttribute('autocomplete', 'new-password');
      if (toggleWrap) toggleWrap.style.display = 'none';
    } else if (mode === 'invite') {
      subtitle.textContent = 'Entre no círculo da sua família com seu código de convite';
      nameGroup.style.display = 'block';
      if (inviteGroup) inviteGroup.style.display = 'block';
      submitBtn.textContent = 'Criar conta e entrar no círculo';
      footnote.textContent = 'Você fará parte do círculo familiar correspondente ao código.';
      document.getElementById('authPassword').setAttribute('autocomplete', 'new-password');
      if (toggleWrap) toggleWrap.style.display = 'block';
      if (toggleBtn) toggleBtn.textContent = 'Já tem uma conta? Fazer login';
    } else {
      subtitle.textContent = 'Entre para acessar o círculo da família';
      nameGroup.style.display = 'none';
      if (inviteGroup) inviteGroup.style.display = 'none';
      submitBtn.textContent = 'Entrar';
      footnote.textContent = 'Seus dados ficam apenas no seu próprio servidor.';
      document.getElementById('authPassword').setAttribute('autocomplete', 'current-password');
      if (toggleWrap) toggleWrap.style.display = 'block';
      if (toggleBtn) toggleBtn.textContent = 'Tenho um código de convite da família';
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

    document.getElementById('authForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('authSubmitBtn');
      const errorEl = document.getElementById('authError');
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const name = document.getElementById('authName').value.trim();
      const inviteCode = document.getElementById('authInviteCode')?.value.trim();

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
            cartoKey = cfg.cartoApiKey;
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
      setupChat();
      setupAlerts();
      setupSosFlow();
      setupProfileModal();
      setupReplayPlayer();
      setupDriverReportAndHistory();
      setupDevicesModal();
      setupAdminModal();

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

      const titleEl = document.getElementById('circleModalTitle');
      if (titleEl) titleEl.textContent = 'Círculo ' + (data.name || 'Família');

      const topTitle = document.querySelector('.circle-name-wrap h1');
      if (topTitle) topTitle.textContent = 'Círculo ' + (data.name || 'Família');

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
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="circle-member-role-badge ${isAdmin ? 'admin' : 'member'}">
                  ${isAdmin ? 'Admin' : 'Membro'}
                </span>
                ${
                  canRemove
                    ? `<button type="button" class="circle-member-remove-btn" title="Remover membro do círculo" data-remove-id="${escapeHtml(m.id)}" data-member-name="${escapeHtml(m.name)}">🗑️</button>`
                    : ''
                }
              </div>
            </div>
          `;
        }).join('');

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
      <span class="chat-bubble-time">${time}${readIndicator}</span>
    `;
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
          loadSosHistory();
        } else if (msg.type === 'SOS_RESOLVED') {
          if (currentActiveSosAlert && (currentActiveSosAlert.id === msg.alert?.id || !msg.alert?.id)) {
            document.getElementById('sosEmergencyOverlay').style.display = 'none';
          }
          showToast(`✅ SOS resolvido por ${msg.alert?.resolvedByName || 'Família'}`);
          loadSosHistory();
        } else if (msg.type === 'CHECKIN_ALERT') {
          showToast(msg.alert?.message || '📍 Um membro fez check-in.');
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
              ${m.avatarUrl ? `<img src="${m.avatarUrl}" alt="${m.name}" />` : initials}
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
  function selectMember(userId) {
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
  }
  window.selectMember = selectMember;

  function renderMemberDetails(member) {
    const initials = member.name.substring(0, 2).toUpperCase();
    const batt = member.location?.battery ? `${Math.round(member.location.battery)}%` : '--';
    const isCharging = member.location?.isCharging ? ' (Carregando ⚡)' : '';
    const speed = member.location?.speed ? `${Math.round(member.location.speed)} km/h` : '0 km/h';
    const accuracy = member.location?.accuracy ? `${Math.round(member.location.accuracy)} m` : '--';
    const updated = member.location?.recordedAt ? formatRelativeTime(member.location.recordedAt) : '--';

    document.getElementById('detailHeader').innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
        <div class="member-avatar" style="background-color: ${member.color || '#3B82F6'}; width: 48px; height: 48px; font-size: 18px;">
          ${member.avatarUrl ? `<img src="${member.avatarUrl}" alt="${member.name}" />` : initials}
        </div>
        <div style="flex: 1; min-width: 0;">
          <h3 style="font-size: 18px; font-weight: 700;">${member.name}</h3>
          <p style="font-size: 12px; color: var(--text-secondary);">${member.activeDevice?.name || 'Celular Principal'}${member.phone ? ` • ${member.phone}` : ''}</p>
        </div>
        <button class="detail-edit-profile-btn" onclick="window.openProfileModal('${member.id}')" title="Editar perfil e foto">
          ✏️ Editar
        </button>
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

  function loadDriverReportForMember(userId, dateStr = null) {
    let url = `/api/members/${userId}/trips?limit=1500`;
    if (dateStr) {
      const from = `${dateStr}T00:00:00.000Z`;
      const to = `${dateStr}T23:59:59.999Z`;
      url = `/api/members/${userId}/trips?from=${from}&to=${to}&limit=2000`;
    }

    apiFetch(url)
      .then(res => res.json())
      .then(data => {
        const summary = data?.summary || {};
        const trips = data?.trips || [];
        memberTrips = trips;

        document.getElementById('dMaxSpeed').textContent = `${summary.maxSpeedKmH || 0} km/h`;
        document.getElementById('dDistance').textContent = `${(summary.totalDistanceKm || 0).toFixed(1)} km`;
        document.getElementById('dTime').textContent = `${summary.totalDurationMinutes || 0} min`;
        document.getElementById('dEvents').textContent = trips.reduce((acc, t) => acc + (t.speedEvents || 0), 0);

        const gradeEl = document.getElementById('driverGrade');
        const score = summary.score || 'Excelente';
        if (score === 'Atenção') {
          gradeEl.textContent = 'Atenção';
          gradeEl.className = 'driver-grade danger';
        } else if (score === 'Bom') {
          gradeEl.textContent = 'Bom';
          gradeEl.className = 'driver-grade warning';
        } else {
          gradeEl.textContent = 'Excelente';
          gradeEl.className = 'driver-grade';
        }

        renderTripsList(trips);
      })
      .catch(err => {
        console.error('Erro ao calcular driver report:', err);
        renderTripsList([]);
      });
  }

  function formatTripTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatTripDuration(minutes) {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
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
        const alertChip = t.speedEvents > 0
          ? `<span class="trip-stat-chip alert">⚠️ ${t.speedEvents} excesso${t.speedEvents === 1 ? '' : 's'}</span>`
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
              <span class="trip-stat-chip">🚀 máx ${t.maxSpeedKmH} km/h</span>
              <span class="trip-stat-chip">📊 méd ${t.avgSpeedKmH} km/h</span>
              ${alertChip}
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

    map.fitBounds(historyPolyline.getBounds(), { padding: [50, 50] });
    document.getElementById('btnClearHistory').style.display = 'block';

    // Habilita o player de replay para o trecho
    replayPoints = trip.points;
    document.getElementById('replayPlayerBar').style.display = 'block';
    document.getElementById('replaySlider').max = trip.points.length - 1;
    document.getElementById('replaySlider').value = 0;
    replayIndex = 0;
    updateReplayUI();

    showToast(`Viagem de ${formatTripTime(trip.startTime)} • ${trip.distanceKm} km`);
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
    document.getElementById('sosSenderText').textContent = `${alert.userName || 'Membro'} acionou o botão de pânico SOS!`;

    document.getElementById('sosEmergencyStats').innerHTML = `
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
      const isResolved = ev.status === 'RESOLVED';
      const isActive = ev.status === 'ACTIVE';
      const statusLabel = isActive ? 'Ativo' : isResolved ? 'Resolvido' : 'Cancelado';
      const badgeClass = isActive ? 'active' : isResolved ? 'resolved' : 'canceled';

      let resolvedInfo = '';
      if (isResolved && ev.resolvedAt) {
        const resTime = new Date(ev.resolvedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const resName = ev.resolvedBy?.name || 'Família';
        resolvedInfo = ` • Resolvido às ${resTime} por ${resName}`;
      }

      return `
        <div class="sos-card ${isActive ? 'active-alert' : ''}">
          <div class="sos-card-header">
            <div class="sos-user-wrap">
              <div class="sos-user-avatar" style="background: ${userColor};">
                ${initials}
              </div>
              <div class="sos-user-info">
                <span class="sos-user-name">${u.name || 'Membro'}</span>
                <span class="sos-time">${timeStr}${resolvedInfo}</span>
              </div>
            </div>
            <span class="sos-status-badge ${badgeClass}">${statusLabel}</span>
          </div>

          <div class="sos-card-message">${ev.message || 'Alerta de SOS acionado'}</div>

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

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toggleBtn.textContent = '❌ Push não suportado neste navegador';
      toggleBtn.disabled = true;
      if (testBtn) testBtn.style.display = 'none';
      return;
    }

    try {
      const reg = window.swRegistration || (await navigator.serviceWorker.ready);
      const sub = await reg.pushManager.getSubscription();
      if (sub && Notification.permission === 'granted') {
        toggleBtn.textContent = '🔔 Notificações Ativas (Toque para desativar)';
        toggleBtn.style.backgroundColor = '#ECFDF5';
        toggleBtn.style.color = '#059669';
        toggleBtn.style.borderColor = '#A7F3D0';
        if (testBtn) testBtn.style.display = 'block';
      } else {
        toggleBtn.textContent = '🔔 Ativar Notificações no Celular';
        toggleBtn.style.backgroundColor = '';
        toggleBtn.style.color = '';
        toggleBtn.style.borderColor = '';
        if (testBtn) testBtn.style.display = 'none';
      }
    } catch (err) {
      console.warn('Erro ao verificar status push:', err);
    }
  }

  async function togglePushNotifications() {
    const toggleBtn = document.getElementById('btnTogglePushNotifications');
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showToast('Push não é suportado pelo seu navegador.');
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

  // Inicialização
  // Inicializa a aplicação somente após autenticação bem-sucedida
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
