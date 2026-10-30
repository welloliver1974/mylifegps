import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Switch,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar as RNStatusBar,
  PanResponder,
  Animated,
  AppState,
  Vibration,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as Notifications from 'expo-notifications';
import {
  startLocationTracking,
  stopLocationTracking,
  testTelemetryConnection,
  forceImmediateLocationUpdate,
  LOCATION_TASK_NAME,
} from './src/services/locationTask';
import {
  startCrashMonitoring,
  stopCrashMonitoring,
  simulateCrashEvent,
  sendCrashEmergencySos,
  resolveCrashEmergencySos,
  loadCrashConfig,
  saveCrashConfig,
  CrashConfig,
  CrashEvent,
  CrashSensitivity,
  DEFAULT_CRASH_CONFIG,
} from './src/services/crashDetection';
import { registerForNativePushAsync } from './src/services/nativePush';

const DEFAULT_SERVER_URL = 'https://gps.housecloud.tec.br';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [deviceId, setDeviceId] = useState('');
  const [deviceApiKey, setDeviceApiKey] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Detecção de Acidente Veicular (Etapa 9.3)
  const [crashConfig, setCrashConfig] = useState<CrashConfig>(DEFAULT_CRASH_CONFIG);
  const [activeCrashEvent, setActiveCrashEvent] = useState<CrashEvent | null>(null);
  const [countdownRemaining, setCountdownRemaining] = useState(30);
  const [sosDispatched, setSosDispatched] = useState(false);
  const [sosDispatchedId, setSosDispatchedId] = useState<string | null>(null);
  const [isDispatchingSos, setIsDispatchingSos] = useState(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Botão flutuante arrastável para não cobrir a gaveta inferior
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const isDraggingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        isDraggingRef.current = false;
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3) {
          isDraggingRef.current = true;
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(_, gestureState);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  useEffect(() => {
    loadSettings();

    // Sincroniza bateria e posição imediatamente ao retornar para primeiro plano
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        forceImmediateLocationUpdate().catch(() => {});
      }
    });

    // Monitora mudanças no nível ou estado da bateria (ex: plugar no carregador) mesmo parado
    let battSub: Battery.Subscription | null = null;
    let stateSub: Battery.Subscription | null = null;
    try {
      battSub = Battery.addBatteryLevelListener(() => {
        forceImmediateLocationUpdate().catch(() => {});
      });
      stateSub = Battery.addBatteryStateListener(() => {
        forceImmediateLocationUpdate().catch(() => {});
      });
    } catch {}

    // Heartbeat suave em primeiro plano a cada 90s para manter status vivo na tela
    const heartbeatInterval = setInterval(() => {
      if (AppState.currentState === 'active') {
        forceImmediateLocationUpdate().catch(() => {});
      }
    }, 90000);

    // Navega a WebView para o destino da notificação ao clicar nela (ex: Resumo Semanal)
    const notifResponseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.url && webViewRef.current) {
        const target = String(data.url);
        const script = `
          try {
            const dest = '${target}';
            if (dest.startsWith('http')) {
              window.location.href = dest;
            } else {
              const u = new URL(dest, window.location.origin);
              window.location.href = u.href;
            }
          } catch (_e) {}
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      }
    });

    return () => {
      stopCrashMonitoring();
      appStateSub.remove();
      battSub?.remove();
      stateSub?.remove();
      notifResponseSub.remove();
      clearInterval(heartbeatInterval);
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Controla a contagem regressiva de segurança (30s) antes do envio automático do SOS
  useEffect(() => {
    if (!activeCrashEvent || sosDispatched) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdownRemaining((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          dispatchAutomaticSos(activeCrashEvent);
          return 0;
        }

        // Vibra a cada 5 segundos para chamar atenção do condutor
        if (prev % 5 === 0) {
          try {
            Vibration.vibrate([0, 400, 150, 400]);
          } catch {}
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [activeCrashEvent, sosDispatched]);

  function triggerCrashFlow(event: CrashEvent) {
    setActiveCrashEvent(event);
    setCountdownRemaining(event.isSimulation ? 15 : (crashConfig.countdownSeconds || 30));
    setSosDispatched(false);
    setSosDispatchedId(null);

    // Notifica a página web via bridge nativa
    try {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: 'NATIVE_CRASH_DETECTED',
          gForce: event.gForce,
          speedKmh: event.speedKmh,
          isSimulation: event.isSimulation || false,
        })
      );
    } catch {}
  }

  async function dispatchAutomaticSos(event: CrashEvent) {
    setSosDispatched(true);
    setIsDispatchingSos(true);
    try {
      try {
        Vibration.vibrate([0, 800, 300, 800, 300, 800]);
      } catch {}

      const res = await sendCrashEmergencySos(event);
      if (res.success) {
        setSosDispatchedId(res.event?.id || 'dispatched');
        try {
          webViewRef.current?.postMessage(
            JSON.stringify({
              type: 'NATIVE_CRASH_SOS_SENT',
              eventId: res.event?.id,
              gForce: event.gForce,
            })
          );
        } catch {}
      } else {
        Alert.alert('Alerta SOS', `Falha ao transmitir: ${res.error}`);
      }
    } finally {
      setIsDispatchingSos(false);
    }
  }

  function handleCancelCrashAlert() {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setActiveCrashEvent(null);
    setSosDispatched(false);
    setSosDispatchedId(null);
    Alert.alert('Alerta Cancelado', 'Impacto descartado com segurança.');
  }

  function handleSendSosNow() {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (activeCrashEvent) {
      dispatchAutomaticSos(activeCrashEvent);
    }
  }

  async function handleResolveDispatchedSos() {
    if (sosDispatchedId && sosDispatchedId !== 'dispatched') {
      await resolveCrashEmergencySos(sosDispatchedId);
    }
    setActiveCrashEvent(null);
    setSosDispatched(false);
    setSosDispatchedId(null);
    Alert.alert('Emergência Finalizada', 'Alerta de colisão resolvido e gravado como seguro.');
  }

  function handleSimulateCrash() {
    setShowConfig(false);
    simulateCrashEvent(triggerCrashFlow);
  }

  async function loadSettings() {
    try {
      const savedUrl = await AsyncStorage.getItem('server_url');
      const savedDevice = await AsyncStorage.getItem('device_id');
      const savedKey = await AsyncStorage.getItem('device_api_key');
      const savedSync = await AsyncStorage.getItem('last_sync');

      let effectiveUrl = savedUrl;
      if (!effectiveUrl || effectiveUrl.includes('life360.housecloud.tec.br') || effectiveUrl.includes('mylife360')) {
        effectiveUrl = DEFAULT_SERVER_URL;
        await AsyncStorage.setItem('server_url', DEFAULT_SERVER_URL);
      }
      setServerUrl(effectiveUrl);

      if (savedDevice) setDeviceId(savedDevice);
      if (savedKey) setDeviceApiKey(savedKey);
      if (savedSync) setLastSync(savedSync);

      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      setIsTracking(hasStarted);

      // Carrega configuração do sensor de acidente
      const loadedCrashConfig = await loadCrashConfig();
      setCrashConfig(loadedCrashConfig);

      if (loadedCrashConfig.enabled) {
        await startCrashMonitoring(triggerCrashFlow);
      }

      // Se ainda não configurou o identificador e a chave, abre a tela de ajustes na 1ª vez
      if (!savedDevice || !savedKey) {
        setShowConfig(true);
      } else {
        // Envia telemetria inicial imediata (bateria + posição atual) para a VPS
        forceImmediateLocationUpdate().catch(() => {});

        // Registra para notificações push nativas no Android
        registerForNativePushAsync(effectiveUrl, savedDevice, savedKey).catch((err) => {
          console.warn('[NativePush] Registro em segundo plano:', err);
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveSettings() {
    try {
      await AsyncStorage.setItem('server_url', serverUrl.trim());
      await AsyncStorage.setItem('device_id', deviceId.trim());
      await AsyncStorage.setItem('device_api_key', deviceApiKey.trim());

      // Salva configuração do sensor de acidente
      await saveCrashConfig(crashConfig);
      if (crashConfig.enabled) {
        await startCrashMonitoring(triggerCrashFlow);
      } else {
        stopCrashMonitoring();
      }

      // Registra/atualiza push token nativo no servidor
      registerForNativePushAsync(serverUrl.trim(), deviceId.trim(), deviceApiKey.trim()).catch((err) => {
        console.warn('[NativePush] Falha ao registrar token após salvar:', err);
      });

      setShowConfig(false);
      Alert.alert('Configurações Salvas', 'Os parâmetros do aparelho e do sensor foram atualizados com sucesso.');
    } catch (e: any) {
      Alert.alert('Erro ao Salvar', e.message);
    }
  }

  async function handleTestConnection() {
    setIsTesting(true);
    try {
      // Salva previamente os valores em memória temporariamente
      await AsyncStorage.setItem('server_url', serverUrl.trim());
      await AsyncStorage.setItem('device_id', deviceId.trim());
      await AsyncStorage.setItem('device_api_key', deviceApiKey.trim());

      const res = await testTelemetryConnection();
      if (res.success) {
        setLastSync(new Date().toISOString());
        Alert.alert('🟢 Sucesso no Envio', res.message);
      } else {
        Alert.alert('🔴 Falha na Comunicação', res.message);
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Falha no teste');
    } finally {
      setIsTesting(false);
    }
  }

  async function toggleTracking(value: boolean) {
    try {
      if (value) {
        await startLocationTracking();
        setIsTracking(true);
        Alert.alert(
          'Rastreamento Ativado',
          'Seu celular está transmitindo coordenadas em segundo plano com economia de bateria (GPS Familiar).'
        );
      } else {
        await stopLocationTracking();
        setIsTracking(false);
        Alert.alert('Rastreamento Pausado', 'O envio em segundo plano foi interrompido.');
      }
    } catch (err: any) {
      Alert.alert('Permissão Necessária', err.message);
      setIsTracking(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#762EEB" />
        <Text style={styles.loadingText}>Iniciando GPS Familiar...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#762EEB" />

      {/* Mapa do Círculo Familiar (WebView integrada com o servidor da VPS) */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: serverUrl }}
          style={styles.webview}
          geolocationEnabled={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowsBackForwardNavigationGestures={true}
          pullToRefreshEnabled={true}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#762EEB" />
              <Text style={styles.loadingText}>Conectando ao círculo familiar...</Text>
            </View>
          )}
          applicationNameForUserAgent="GPSFamiliarApp/1.0"
          onError={() => {
            Alert.alert(
              'Falha de Conexão',
              `Não foi possível carregar ${serverUrl}.\nVerifique sua conexão ou toque no ícone ⚙️ para conferir o endereço da VPS.`
            );
          }}
          onMessage={async (event) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data);
              if (msg && msg.type === 'FORCE_LOCATION_UPDATE') {
                console.log('[NativeBridge] Comando FORCE_LOCATION_UPDATE recebido da página web');
                await forceImmediateLocationUpdate();
              } else if (msg && msg.type === 'TEST_NOTIFICATION') {
                Alert.alert(
                  msg.title || '🔔 GPS Familiar',
                  msg.body || 'O rastreamento em segundo plano e alertas nativos estão ativos neste aparelho!'
                );
                try {
                  Vibration.vibrate(400);
                } catch {}
              }
            } catch {
              // Ignora mensagens que não sejam JSON
            }
          }}
        />
      </View>

      {/* Botão Flutuante de Configurações (Posicionado acima da barra inferior e livremente arrastável) */}
      <Animated.View
        style={[
          styles.floatingButtonWrap,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[styles.floatingButton, isTracking && styles.floatingButtonActive]}
          onPress={() => {
            if (!isDraggingRef.current) {
              setShowConfig(true);
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingButtonText}>⚙️</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal de Configuração do Aparelho */}
      <Modal visible={showConfig} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.badgeLife}>
                <Text style={styles.badgeLifeText}>LIFE360 GPS</Text>
              </View>
              <Text style={styles.modalTitle}>Configuração do Aparelho</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Conecte este celular ao seu servidor familiar para rastreamento contínuo.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>URL da sua VPS (Cloudflare Tunnel)</Text>
              <TextInput
                style={styles.input}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="https://gps.housecloud.tec.br"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Identificador deste Celular (opcional)</Text>
              <TextInput
                style={styles.input}
                value={deviceId}
                onChangeText={(val) => setDeviceId(val.trim())}
                placeholder="Ex: celular-wellington"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chave de Telemetria (Gerada no Painel Web)</Text>
              <TextInput
                style={styles.input}
                value={deviceApiKey}
                onChangeText={(val) => setDeviceApiKey(val.trim().replace(/^["']|["']$/g, ''))}
                placeholder="l360_..."
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>Rastreamento em 2º Plano</Text>
                <Text style={styles.switchSubtitle}>
                  {isTracking ? '🟢 Ativo (dispara ao andar > 50m)' : '⚪ Pausado'}
                </Text>
              </View>
              <Switch
                value={isTracking}
                onValueChange={toggleTracking}
                trackColor={{ false: '#334155', true: '#762EEB' }}
                thumbColor={isTracking ? '#FFFFFF' : '#94A3B8'}
              />
            </View>

            {/* Botão de teste rápido de telemetria */}
            <TouchableOpacity
              style={styles.btnTest}
              onPress={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.btnTestText}>📡 Testar Envio de Coordenada Agora</Text>
              )}
            </TouchableOpacity>

            {lastSync && (
              <Text style={styles.syncText}>
                Última coordenada enviada: {new Date(lastSync).toLocaleTimeString()}
              </Text>
            )}

            {/* Seção de Detecção de Acidente (Etapa 9.3) */}
            <View style={styles.sectionDivider} />
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.switchTitle}>🛡️ Detecção de Acidente</Text>
                <Text style={styles.switchSubtitle}>
                  {crashConfig.enabled ? '🟢 Sensor ativo (Acelerômetro)' : '⚪ Pausado'}
                </Text>
              </View>
              <Switch
                value={crashConfig.enabled}
                onValueChange={(val) => setCrashConfig((prev) => ({ ...prev, enabled: val }))}
                trackColor={{ false: '#334155', true: '#DC2626' }}
                thumbColor={crashConfig.enabled ? '#FFFFFF' : '#94A3B8'}
              />
            </View>

            {crashConfig.enabled && (
              <View style={styles.crashSettingsBox}>
                <Text style={styles.inputLabel}>Sensibilidade do Impacto:</Text>
                <View style={styles.sensitivityRow}>
                  {(['high', 'medium', 'low'] as CrashSensitivity[]).map((sens) => {
                    const isSelected = crashConfig.sensitivity === sens;
                    const labels: Record<CrashSensitivity, string> = {
                      high: 'Alta (2.5G)',
                      medium: 'Média (3.0G)',
                      low: 'Baixa (3.8G)',
                    };
                    return (
                      <TouchableOpacity
                        key={sens}
                        style={[styles.sensPill, isSelected && styles.sensPillActive]}
                        onPress={() => setCrashConfig((prev) => ({ ...prev, sensitivity: sens }))}
                      >
                        <Text style={[styles.sensPillText, isSelected && styles.sensPillTextActive]}>
                          {labels[sens]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.crashHelpText}>
                  💡 Só dispara em velocidades de trânsito (&gt; {crashConfig.minSpeedKmh} km/h) para filtrar quedas do aparelho parado.
                </Text>

                <TouchableOpacity
                  style={styles.btnSimulateCrash}
                  onPress={handleSimulateCrash}
                >
                  <Text style={styles.btnSimulateCrashText}>🧪 Simular Alerta de Acidente (Teste)</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setShowConfig(false)}
              >
                <Text style={styles.btnTextSecondary}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSave]}
                onPress={handleSaveSettings}
              >
                <Text style={styles.btnTextPrimary}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Emergência / Contagem Regressiva de Acidente (Etapa 9.3) */}
      <Modal visible={activeCrashEvent !== null} animationType="fade" transparent>
        <View style={styles.crashOverlay}>
          <View style={styles.crashAlertBox}>
            <View style={styles.crashSirenBadge}>
              <Text style={styles.crashSirenIcon}>🚗💥</Text>
            </View>

            <Text style={styles.crashAlertTitle}>
              {sosDispatched ? 'SOS DE ACIDENTE ENVIADO!' : 'IMPACTO SEVERO DETECTADO!'}
            </Text>
            <Text style={styles.crashAlertSubtitle}>
              {sosDispatched
                ? 'Sua localização exata e alerta de colisão foram transmitidos à família.'
                : 'O acelerômetro do aparelho registrou uma desaceleração brusca.'}
            </Text>

            <View style={styles.crashStatsRow}>
              <View style={styles.crashStatCard}>
                <Text style={styles.crashStatLabel}>Força G</Text>
                <Text style={styles.crashStatValue}>{activeCrashEvent?.gForce.toFixed(1)} G</Text>
              </View>
              <View style={styles.crashStatCard}>
                <Text style={styles.crashStatLabel}>Velocidade</Text>
                <Text style={styles.crashStatValue}>~{Math.round(activeCrashEvent?.speedKmh || 0)} km/h</Text>
              </View>
              <View style={styles.crashStatCard}>
                <Text style={styles.crashStatLabel}>Origem</Text>
                <Text style={styles.crashStatValue}>
                  {activeCrashEvent?.isSimulation ? 'Simulação' : 'Sensor Real'}
                </Text>
              </View>
            </View>

            {!sosDispatched ? (
              <View style={styles.countdownSection}>
                <View style={styles.countdownCircle}>
                  <Text style={styles.countdownNumber}>{countdownRemaining}</Text>
                  <Text style={styles.countdownUnit}>segundos</Text>
                </View>

                <Text style={styles.countdownNotice}>
                  Você está bem? Se você não responder, um alerta de emergência com rota no mapa será enviado a todos os membros da família.
                </Text>

                <TouchableOpacity
                  style={styles.btnImOk}
                  onPress={handleCancelCrashAlert}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnImOkText}>✅ ESTOU BEM (Cancelar Alerta)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnSendSosNow}
                  onPress={handleSendSosNow}
                  disabled={isDispatchingSos}
                  activeOpacity={0.85}
                >
                  {isDispatchingSos ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.btnSendSosNowText}>🚨 ENVIAR SOS AGORA</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.dispatchedSection}>
                <View style={styles.dispatchedBadge}>
                  <Text style={styles.dispatchedBadgeText}>
                    🚨 ALERTA ATIVO NO CÍRCULO FAMILIAR
                  </Text>
                </View>

                <Text style={styles.dispatchedNotice}>
                  Todos os aparelhos conectados receberam o sinal sonoro e o botão de navegação direta via Google Maps até aqui.
                </Text>

                <TouchableOpacity
                  style={styles.btnResolveSos}
                  onPress={handleResolveDispatchedSos}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnResolveSosText}>✅ Estou Seguro Agora / Cancelar SOS</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0,
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  floatingButtonWrap: {
    position: 'absolute',
    bottom: 110,
    right: 18,
    zIndex: 9999,
  },
  floatingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  floatingButtonActive: {
    borderColor: '#762EEB',
    backgroundColor: '#2E1065',
  },
  floatingButtonText: {
    fontSize: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(118,46,235,0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  badgeLife: {
    backgroundColor: '#762EEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeLifeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginVertical: 8,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  btnTest: {
    backgroundColor: 'rgba(118,46,235,0.15)',
    borderWidth: 1,
    borderColor: '#762EEB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  btnTestText: {
    color: '#C084FC',
    fontWeight: '600',
    fontSize: 13,
  },
  syncText: {
    fontSize: 11,
    color: '#10B981',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 16,
    marginBottom: 4,
  },
  crashSettingsBox: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.3)',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  sensitivityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 10,
  },
  sensPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sensPillActive: {
    backgroundColor: 'rgba(220,38,38,0.85)',
    borderColor: '#DC2626',
  },
  sensPillText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sensPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  crashHelpText: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  btnSimulateCrash: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  btnSimulateCrashText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 12,
  },
  crashOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  crashAlertBox: {
    width: '100%',
    backgroundColor: '#1E1B1B',
    borderRadius: 24,
    padding: 22,
    borderWidth: 2,
    borderColor: '#DC2626',
    alignItems: 'center',
  },
  crashSirenBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(220,38,38,0.2)',
    borderWidth: 2,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  crashSirenIcon: {
    fontSize: 38,
  },
  crashAlertTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FCA5A5',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  crashAlertSubtitle: {
    fontSize: 13,
    color: '#D1D5DB',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  crashStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    marginBottom: 18,
    width: '100%',
  },
  crashStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  crashStatLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  crashStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  countdownSection: {
    width: '100%',
    alignItems: 'center',
  },
  countdownCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderWidth: 3,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  countdownNumber: {
    fontSize: 40,
    fontWeight: '900',
    color: '#F87171',
    lineHeight: 44,
  },
  countdownUnit: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  countdownNotice: {
    fontSize: 13,
    color: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  btnImOk: {
    width: '100%',
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnImOkText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  btnSendSosNow: {
    width: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSendSosNowText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  dispatchedSection: {
    width: '100%',
    alignItems: 'center',
  },
  dispatchedBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
  },
  dispatchedBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  dispatchedNotice: {
    fontSize: 13,
    color: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  btnResolveSos: {
    width: '100%',
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnResolveSosText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  btnSave: {
    backgroundColor: '#762EEB',
  },
  btnTextSecondary: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  btnTextPrimary: {
    color: 'white',
    fontWeight: '700',
  },
});
