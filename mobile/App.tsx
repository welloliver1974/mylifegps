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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  startLocationTracking,
  stopLocationTracking,
  testTelemetryConnection,
  LOCATION_TASK_NAME,
} from './src/services/locationTask';

const DEFAULT_SERVER_URL = 'https://life360.housecloud.tec.br';

export default function App() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [deviceId, setDeviceId] = useState('');
  const [deviceApiKey, setDeviceApiKey] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

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
  }, []);

  async function loadSettings() {
    try {
      const savedUrl = await AsyncStorage.getItem('server_url');
      const savedDevice = await AsyncStorage.getItem('device_id');
      const savedKey = await AsyncStorage.getItem('device_api_key');
      const savedSync = await AsyncStorage.getItem('last_sync');

      if (savedUrl) {
        setServerUrl(savedUrl);
      } else {
        setServerUrl(DEFAULT_SERVER_URL);
        await AsyncStorage.setItem('server_url', DEFAULT_SERVER_URL);
      }
      if (savedDevice) setDeviceId(savedDevice);
      if (savedKey) setDeviceApiKey(savedKey);
      if (savedSync) setLastSync(savedSync);

      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      setIsTracking(hasStarted);

      // Se ainda não configurou o identificador e a chave, abre a tela de ajustes na 1ª vez
      if (!savedDevice || !savedKey) {
        setShowConfig(true);
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
      setShowConfig(false);
      Alert.alert('Configurações Salvas', 'Os parâmetros do aparelho foram atualizados com sucesso.');
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
          'Seu celular está transmitindo coordenadas em segundo plano com economia de bateria (My Life360).'
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
        <Text style={styles.loadingText}>Iniciando My Life360...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#762EEB" />

      {/* Mapa do Círculo Familiar (WebView integrada com o servidor da VPS) */}
      <View style={styles.mapContainer}>
        <WebView
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
          onError={() => {
            Alert.alert(
              'Falha de Conexão',
              `Não foi possível carregar ${serverUrl}.\nVerifique sua conexão ou toque no ícone ⚙️ para conferir o endereço da VPS.`
            );
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
                placeholder="https://life360.housecloud.tec.br"
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
