import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../../config/app';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationStatus: React.FC = () => {
  const { isInitialized, hasPermission, fcmToken, requestPermission } = useNotifications();

  const getStatusColor = () => {
    if (!isInitialized) return COLORS.textSecondary;
    return hasPermission ? COLORS.secondary : COLORS.error;
  };

  const getStatusText = () => {
    if (!isInitialized) return 'Inicializando...';
    return hasPermission ? 'Ativas' : 'Desabilitadas';
  };

  const getStatusIcon = () => {
    if (!isInitialized) return '⏳';
    return hasPermission ? '🔔' : '🔕';
  };

  const handlePress = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Notificações Desabilitadas',
        'As notificações são importantes para receber novos pedidos. Deseja habilitar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Habilitar', 
            onPress: async () => {
              const granted = await requestPermission();
              if (!granted) {
                Alert.alert(
                  'Permissão Negada',
                  'Você pode habilitar as notificações nas configurações do dispositivo.'
                );
              }
            }
          }
        ]
      );
    } else {
      // Mostrar informações do token
      Alert.alert(
        'Notificações Ativas',
        `Token FCM: ${fcmToken ? fcmToken.substring(0, 20) + '...' : 'Não disponível'}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.content}>
        <Text style={styles.icon}>{getStatusIcon()}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Notificações</Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {hasPermission && fcmToken && (
            <Text style={styles.detail}>
              Pronto para receber pedidos
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  status: {
    fontSize: 12,
    marginTop: 2,
  },
  detail: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default NotificationStatus;

