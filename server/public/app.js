// My Life360 Web / PWA App Core (Estilo Life360 Oficial)
document.addEventListener('DOMContentLoaded', () => {
  let map;
  let currentTileLayer = null;
  let cartoKey = '';
  let currentLayerType = localStorage.getItem('life360_map_layer') || 'voyager';

  let memberMarkers = new Map(); // userId -> { marker, accuracyCircle }
  let placeLayers = new Map();   // placeId -> { circle, labelMarker }
  let historyPolyline = null;
  let membersData = [];
  let placesData = [];
  let selectedMemberId = null;
  let ws = null;

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
    // Padrão: Voyager (Life360 Clean - pastel, parques verdes, água azul e ruas suaves)
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

    // Fallback defensivo caso o CDN do CARTO oscile
    let fallbackTriggered = false;
    currentTileLayer.on('tileerror', () => {
      if (!fallbackTriggered && cfg.url.includes('cartocdn.com')) {
        fallbackTriggered = true;
        console.warn('Tiles CARTO indisponíveis, alternando para OpenStreetMap...');
        currentTileLayer.setUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
      }
    });

    // Atualiza visual dos cards de seleção no popover
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

    // Busca chave CARTO da API pública de configuração
    try {
      const cfgRes = await fetch('/api/config');
      const cfg = await cfgRes.json();
      if (cfg?.cartoApiKey) {
        cartoKey = cfg.cartoApiKey;
      }
    } catch (err) {
      console.warn('Não foi possível obter config do servidor:', err);
    }

    // Aplica a camada inicial (Voyager padrão ou preferência salva)
    switchBaseLayer(currentLayerType);

    // Clique no mapa abre modal para criar lugar na coordenada clicada
    map.on('click', (e) => {
      document.getElementById('placeLat').value = e.latlng.lat.toFixed(6);
      document.getElementById('placeLng').value = e.latlng.lng.toFixed(6);
      document.getElementById('placeModal').style.display = 'flex';
    });

    setupFloatingControls();
  }

  // 3. Controles Flutuantes do Mapa (Estilo Life360)
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

    // Botões de Zoom e Centralizar
    document.getElementById('btnRecenterFab').addEventListener('click', fitAllMembers);
    document.getElementById('btnZoomIn').addEventListener('click', () => map.zoomIn());
    document.getElementById('btnZoomOut').addEventListener('click', () => map.zoomOut());
  }

  // 4. Conexão WebSocket com reconexão automática
  function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

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

  // 5. Atualização de Posição em Tempo Real (via WS)
  function handleLiveLocation(locData) {
    const member = membersData.find((m) => m.id === locData.userId);
    if (member) {
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

    if (selectedMemberId === locData.userId) {
      renderMemberDetails(member || membersData[membersData.length - 1]);
    }
  }

  // 6. Carrega Membros Iniciais da API
  async function loadMembers() {
    try {
      const res = await fetch('/api/members/live');
      membersData = await res.json();
      renderMembersList();
      membersData.forEach((m) => renderMemberMarker(m.id));
      fitAllMembers();
    } catch (err) {
      console.error('Erro ao buscar membros:', err);
    }
  }

  // 7. Carrega Lugares/Cercas
  async function loadPlaces() {
    try {
      const res = await fetch('/api/places');
      placesData = await res.json();
      renderPlaces();
    } catch (err) {
      console.error('Erro ao buscar lugares:', err);
    }
  }

  // 8. Renderiza Cercas no Mapa (Círculo Pastel + Pílula Central com Emoji)
  function renderPlaces() {
    placesData.forEach((place) => {
      // Remove camada anterior caso exista
      if (placeLayers.has(place.id)) {
        const prev = placeLayers.get(place.id);
        map.removeLayer(prev.circle);
        map.removeLayer(prev.labelMarker);
      }

      const color = place.color || '#10B981';
      const iconEmoji = PLACE_ICONS[place.icon] || '📍';

      // Círculo translúcido com borda tracejada suave
      const circle = L.circle([place.latitude, place.longitude], {
        color: color,
        fillColor: color,
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6, 6',
        radius: place.radiusMeters,
      }).addTo(map);

      // Pílula flutuante no centro da cerca com emoji e nome
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
        interactive: false,
      }).addTo(map);

      placeLayers.set(place.id, { circle, labelMarker });
    });
  }

  // 9. Renderiza Marcador Oficial Estilo Life360 com Anel de Bateria SVG
  function renderMemberMarker(userId) {
    const member = membersData.find((m) => m.id === userId);
    if (!member || !member.location) return;

    const lat = member.location.latitude;
    const lng = member.location.longitude;
    const initials = member.name.substring(0, 2).toUpperCase();
    const isSelected = selectedMemberId === userId;

    // Cálculo da bateria e anel SVG
    const rawBatt = member.location.battery;
    const batt = rawBatt !== undefined && rawBatt !== null ? Math.round(rawBatt) : 100;
    const isCharging = !!member.location.isCharging;

    // Cores da bateria: Verde (>50%), Laranja (20-50%), Vermelho (<20%)
    const battColor = batt < 20 ? '#EF4444' : batt < 50 ? '#F59E0B' : '#10B981';
    const battClass = batt < 20 ? 'low' : batt < 50 ? 'medium' : 'high';

    // Perímetro do círculo de raio 24: 2 * PI * 24 = 150.8
    const circumference = 150.8;
    const progressOffset = circumference * (1 - Math.max(0, Math.min(100, batt)) / 100);

    // Velocidade e Status de Movimento
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

    // Template HTML idêntico ao Life360 oficial
    const markerHtml = `
      <div class="life360-avatar-marker ${isSelected ? 'selected' : ''}">
        <div class="marker-radar-ring"></div>
        <div class="marker-avatar-container">
          <!-- Anel SVG de Bateria -->
          <svg class="battery-svg" viewBox="0 0 58 58">
            <circle class="battery-track" cx="29" cy="29" r="24"></circle>
            <circle class="battery-fill ${isCharging ? 'charging' : ''}"
                    cx="29" cy="29" r="24"
                    stroke="${battColor}"
                    stroke-dasharray="150.8"
                    stroke-dashoffset="${progressOffset}"></circle>
          </svg>

          <!-- Foto ou Iniciais -->
          <div class="avatar-photo" style="background-color: ${member.color || '#3B82F6'};">
            ${member.avatarUrl ? `<img src="${member.avatarUrl}" alt="${member.name}" />` : initials}
          </div>

          <!-- Badge de Carga / Bateria -->
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

  // 10. Renderiza Lista de Membros na Gaveta
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
          subtext = speed > 5 ? `🚗 Em trânsito (${speed} km/h)` : `📍 Parado • ${formatRelativeTime(m.location.recordedAt)}`;
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
              <div class="member-subtext">${subtext}</div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // 11. Seleciona Membro e Abre Painel de Detalhes
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

  // 12. Traçar Histórico de Hoje
  document.getElementById('btnShowHistory').addEventListener('click', async () => {
    if (!selectedMemberId) return;

    try {
      const res = await fetch(`/api/members/${selectedMemberId}/history?limit=300`);
      const history = await res.json();

      if (historyPolyline) {
        map.removeLayer(historyPolyline);
      }

      if (!history || history.length === 0) {
        showToast('Nenhum histórico encontrado para este membro.');
        return;
      }

      const latlngs = history.map((pt) => [pt.latitude, pt.longitude]);
      historyPolyline = L.polyline(latlngs, {
        color: '#6366F1',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      map.fitBounds(historyPolyline.getBounds(), { padding: [50, 50] });

      document.getElementById('btnClearHistory').style.display = 'block';
      showToast(`Rastro com ${history.length} pontos carregado.`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar histórico.');
    }
  });

  document.getElementById('btnClearHistory').addEventListener('click', () => {
    if (historyPolyline) {
      map.removeLayer(historyPolyline);
      historyPolyline = null;
    }
    document.getElementById('btnClearHistory').style.display = 'none';
  });

  // Voltar da tela de detalhes para a lista
  document.getElementById('btnBackToList').addEventListener('click', () => {
    selectedMemberId = null;
    document.getElementById('membersList').style.display = 'flex';
    document.getElementById('memberDetailPanel').style.display = 'none';
    membersData.forEach((m) => renderMemberMarker(m.id));
  });

  // Enquadrar todos os membros na tela
  function fitAllMembers() {
    const validLocs = membersData.filter((m) => m.location).map((m) => [m.location.latitude, m.location.longitude]);
    if (validLocs.length > 0) {
      map.fitBounds(validLocs, { padding: [60, 60], maxZoom: 15 });
    }
  }
  document.getElementById('btnFitAll').addEventListener('click', fitAllMembers);

  // 13. Modal Novo Lugar & Seletor de Ícones
  const placeModal = document.getElementById('placeModal');
  const radiusInput = document.getElementById('placeRadius');
  const radiusVal = document.getElementById('radiusVal');

  radiusInput.addEventListener('input', () => {
    radiusVal.textContent = `${radiusInput.value}m`;
  });

  // Seleção visual dos chips de tipo de lugar
  document.querySelectorAll('.icon-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.icon-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      document.getElementById('placeIcon').value = chip.dataset.icon;
      document.getElementById('placeColor').value = chip.dataset.color;
    });
  });

  document.getElementById('btnAddPlace').addEventListener('click', () => {
    const center = map.getCenter();
    document.getElementById('placeLat').value = center.lat.toFixed(6);
    document.getElementById('placeLng').value = center.lng.toFixed(6);
    placeModal.style.display = 'flex';
  });

  document.getElementById('btnClosePlaceModal').addEventListener('click', () => {
    placeModal.style.display = 'none';
  });
  document.getElementById('btnCancelPlace').addEventListener('click', () => {
    placeModal.style.display = 'none';
  });

  document.getElementById('placeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('placeName').value;
    const latitude = parseFloat(document.getElementById('placeLat').value);
    const longitude = parseFloat(document.getElementById('placeLng').value);
    const radiusMeters = parseFloat(radiusInput.value);
    const icon = document.getElementById('placeIcon').value;
    const color = document.getElementById('placeColor').value;

    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, latitude, longitude, radiusMeters, icon, color }),
      });
      if (res.ok) {
        placeModal.style.display = 'none';
        document.getElementById('placeForm').reset();
        showToast(`Lugar "${name}" cadastrado!`);
        await loadPlaces();
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao cadastrar lugar');
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
  initMap();
  connectWebSocket();
  loadMembers();
  loadPlaces();
});
