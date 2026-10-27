// My Life360 Web / PWA App Core
document.addEventListener('DOMContentLoaded', () => {
  let map;
  let memberMarkers = new Map(); // userId -> { marker, accuracyCircle }
  let placeCircles = new Map();  // placeId -> circle
  let historyPolyline = null;
  let membersData = [];
  let placesData = [];
  let selectedMemberId = null;
  let ws = null;

  // 1. Inicializa o Mapa Leaflet
  async function initMap() {
    // Padrão São Paulo ou centro do Brasil caso não haja dados
    map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
    }).setView([-23.55052, -46.633308], 14);

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    try {
      const cfgRes = await fetch('/api/config');
      const cfg = await cfgRes.json();
      if (cfg?.cartoApiKey) {
        tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${cfg.cartoApiKey}`;
      }
    } catch (err) {
      console.warn('Usando tiles padrão da Carto:', err);
    }

    // Tiles do CartoDB Voyager com suporte a chave de API
    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Clique no mapa abre modal para criar lugar na coordenada clicada
    map.on('click', (e) => {
      document.getElementById('placeLat').value = e.latlng.lat.toFixed(6);
      document.getElementById('placeLng').value = e.latlng.lng.toFixed(6);
      document.getElementById('placeModal').style.display = 'flex';
    });
  }

  // 2. Conexão WebSocket com reconexão automática
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

  // 3. Atualização de Posição em Tempo Real (via WS)
  function handleLiveLocation(locData) {
    // Atualiza nos dados locais
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
      // Novo membro recebido
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

  // 4. Carrega Membros Iniciais da API
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

  // 5. Carrega Lugares/Cercas
  async function loadPlaces() {
    try {
      const res = await fetch('/api/places');
      placesData = await res.json();
      renderPlaces();
    } catch (err) {
      console.error('Erro ao buscar lugares:', err);
    }
  }

  // 6. Renderiza Cercas no Mapa
  function renderPlaces() {
    placesData.forEach((place) => {
      if (placeCircles.has(place.id)) {
        map.removeLayer(placeCircles.get(place.id));
      }

      const circle = L.circle([place.latitude, place.longitude], {
        color: place.color || '#10B981',
        fillColor: place.color || '#10B981',
        fillOpacity: 0.15,
        weight: 2,
        radius: place.radiusMeters,
      }).addTo(map);

      circle.bindTooltip(`📍 <b>${place.name}</b>`, {
        permanent: true,
        direction: 'center',
        className: 'place-tooltip',
      });

      placeCircles.set(place.id, circle);
    });
  }

  // 7. Renderiza ou Atualiza Marcador do Membro
  function renderMemberMarker(userId) {
    const member = membersData.find((m) => m.id === userId);
    if (!member || !member.location) return;

    const lat = member.location.latitude;
    const lng = member.location.longitude;
    const initials = member.name.substring(0, 2).toUpperCase();
    const isPulsing = selectedMemberId === userId ? 'pulsing' : '';

    // Ícone HTML personalizado
    const iconHtml = `
      <div class="custom-avatar-marker">
        <div class="marker-pin ${isPulsing}" style="background-color: ${member.color || '#3B82F6'};">
          ${initials}
        </div>
        <div class="marker-name-tag">${member.name}</div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: '',
      iconSize: [44, 60],
      iconAnchor: [22, 30],
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

  // 8. Renderiza Lista de Membros na Gaveta
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

  // 9. Seleciona Membro e Abre Painel de Detalhes
  window.selectMember = function (userId) {
    selectedMemberId = userId;
    const member = membersData.find((m) => m.id === userId);
    if (!member) return;

    // Foca o mapa no membro
    if (member.location) {
      map.flyTo([member.location.latitude, member.location.longitude], 16, {
        animate: true,
        duration: 1.2,
      });
    }

    // Atualiza marcador selecionado com pulso
    membersData.forEach((m) => renderMemberMarker(m.id));

    // Exibe painel de detalhes
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

  // 10. Traçar Histórico de Hoje
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
        color: '#3B82F6',
        weight: 4,
        opacity: 0.8,
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

  // Modal Novo Lugar
  const placeModal = document.getElementById('placeModal');
  const radiusInput = document.getElementById('placeRadius');
  const radiusVal = document.getElementById('radiusVal');

  radiusInput.addEventListener('input', () => {
    radiusVal.textContent = `${radiusInput.value}m`;
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

    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, latitude, longitude, radiusMeters }),
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
