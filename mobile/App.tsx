import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  startLocationTracking,
  stopLocationTracking,
  LOCATION_TASK_NAME,
} from './src/services/locationTask';

export default function App() {
  const [serverUrl, setServerUrl] = useState('http://192.168.1.100:3000');
  const [deviceId, setDeviceId] = useState('celular-01');
  const [isTracking, setIsTracking] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const savedUrl = await AsyncStorage.getItem('server_url');
      const savedDevice = await AsyncStorage.getItem('device_id');
      const savedSync = await AsyncStorage.getItem('last_sync');

      if (savedUrl) setServerUrl(savedUrl);
      if (savedDevice) setDeviceId(savedDevice);
      if (savedSync) setLastSync(savedSync);

      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      setIsTracking(hasStarted);

      // Se ainda não configurou, abre a tela de ajustes no primeiro acesso
      if (!savedUrl || !savedDevice) {
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
      setShowConfig(false);
      Alert.alert('Sucesso', 'Configurações salvas!');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  }

  async function toggleTracking(value: boolean) {
    try {
      if (value) {
        await startLocationTracking();
        setIsTracking(true);
        Alert.alert('Rastreamento Ativado', 'Seu celular está transmitindo coordenadas em segundo plano com economia de bateria.');
      } else {
        await stopLocationTracking();
        setIsTracking(false);
        Alert.alert('Rastreamento Pausado', 'O envio em segundo plano foi interrompido.');
      }
    } catch (err: any) {
      Alert.alert('Erro de Permissão', err.message);
      setIsTracking(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Iniciando My Life360...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Mapa do Círculo Familiar (WebView integrada com o servidor da VPS) */}
      <View style={styles.mapContainer}>
        <WebView
          source={{ uri: serverUrl }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Conectando ao mapa da VPS...</Text>
            </View>
          )}
          onError={() => {
            Alert.alert(
              'Falha de Conexão',
              `Não foi possível carregar a URL ${serverUrl}. Verifique se a VPS está online e o endereço está correto.`
            );
          }}
        />
      </View>

      {/* Botão Flutuante de Configurações */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowConfig(true)}
      >
        <Text style={styles.floatingButtonText}>⚙️</Text>
      </TouchableOpacity>

      {/* Modal de Configuração do Aparelho */}
      <Modal visible={showConfig} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configuração My Life360</Text>
            <Text style={styles.modalSubtitle}>
              Conecte este celular à sua VPS para rastreamento familiar 24/7.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>URL da sua VPS (ou Cloudflare Tunnel)</Text>
              <TextInput
                style={styles.input}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="https://sua-vps.com"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Identificador deste Celular</Text>
              <TextInput
                style={styles.input}
                value={deviceId}
                onChangeText={setDeviceId}
                placeholder="Ex: wellington-galaxy-s23"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>Rastreamento em 2º Plano</Text>
                <Text style={styles.switchSubtitle}>
                  {isTracking ? '🟢 Ativo (dispara se andar > 50m)' : '⚪ Pausado'}
                </Text>
              </View>
              <Switch
                value={isTracking}
                onValueChange={toggleTracking}
                trackColor={{ false: '#334155', true: '#3B82F6' }}
              />
            </View>

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
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  floatingButtonText: {
    fontSize: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 6,
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginVertical: 10,
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
  syncText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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
    backgroundColor: '#3B82F6',
  },
  btnTextSecondary: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  btnTextPrimary: {
    color: 'white',
    fontWeight: '600',
  },
});
