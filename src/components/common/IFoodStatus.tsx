import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../config/app';
import ifoodApi from '../../services/ifood/api';

const IFoodStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{ hasToken: boolean; expiresAt: Date | null }>({
    hasToken: false,
    expiresAt: null
  });

  const checkStatus = async () => {
    try {
      const connected = await ifoodApi.checkConnection();
      setIsConnected(connected);
      setTokenInfo(ifoodApi.getTokenInfo());
    } catch (error) {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Verificar status a cada 5 minutos
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (isConnected === null) return COLORS.textSecondary;
    return isConnected ? COLORS.secondary : COLORS.error;
  };

  const getStatusText = () => {
    if (isConnected === null) return 'Verificando...';
    return isConnected ? 'Conectado' : 'Desconectado';
  };

  const getStatusIcon = () => {
    if (isConnected === null) return '⏳';
    return isConnected ? '✅' : '❌';
  };

  const formatExpiryTime = () => {
    if (!tokenInfo.expiresAt) return '';
    
    const now = new Date();
    const expiry = tokenInfo.expiresAt;
    const diffMinutes = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < 0) return 'Expirado';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={checkStatus}>
      <View style={styles.content}>
        <Text style={styles.icon}>{getStatusIcon()}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>iFood API</Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {tokenInfo.hasToken && tokenInfo.expiresAt && (
            <Text style={styles.expiry}>
              Expira em: {formatExpiryTime()}
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
    borderLeftColor: COLORS.primary,
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
  expiry: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default IFoodStatus;

