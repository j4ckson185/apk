import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus, Vibration } from 'react-native';
import { NotificationService } from '../services/firebase/notifications';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  isInitialized: boolean;
  hasPermission: boolean;
  fcmToken: string | null;
  requestPermission: () => Promise<boolean>;
  initializeNotifications: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Inicializar notificações quando o app carrega
    initializeNotifications();

    // Listener para mudanças no estado do app
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App voltou ao primeiro plano, verificar permissões
        checkPermissions();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    // Gerenciar inscrições em tópicos baseado no usuário logado
    if (user && isInitialized) {
      subscribeToUserTopics();
    } else if (!user && isInitialized) {
      unsubscribeFromUserTopics();
    }
  }, [user, isInitialized]);

  const checkPermissions = async () => {
    try {
      const permission = await NotificationService.checkPermission();
      setHasPermission(permission);
    } catch (error) {
      console.error('Erro ao verificar permissões de notificação:', error);
      setHasPermission(false);
    }
  };

  const initializeNotifications = async (): Promise<boolean> => {
    try {
      const success = await NotificationService.initialize();
      setIsInitialized(success);
      
      if (success) {
        setHasPermission(true);
        const token = await NotificationService.getFCMToken();
        setFcmToken(token);
        console.log('Notificações inicializadas com sucesso');
      }
      
      return success;
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
      setIsInitialized(false);
      setHasPermission(false);
      return false;
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const granted = await NotificationService.requestPermission();
      setHasPermission(granted);
      
      if (granted && !isInitialized) {
        // Se permissão foi concedida e ainda não inicializou, inicializar agora
        await initializeNotifications();
      }
      
      return granted;
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return false;
    }
  };

  const subscribeToUserTopics = async () => {
    if (!user) return;
    
    try {
      await NotificationService.subscribeToDeliveryTopics(user.deliveryId);
      console.log(`Inscrito nos tópicos para ${user.deliveryId}`);
    } catch (error) {
      console.error('Erro ao se inscrever nos tópicos:', error);
    }
  };

  const unsubscribeFromUserTopics = async () => {
    if (!user) return;
    
    try {
      await NotificationService.unsubscribeFromDeliveryTopics(user.deliveryId);
      console.log(`Desinscrito dos tópicos para ${user.deliveryId}`);
    } catch (error) {
      console.error('Erro ao se desinscrever dos tópicos:', error);
    }
  };

  const value: NotificationContextType = {
    isInitialized,
    hasPermission,
    fcmToken,
    requestPermission: requestNotificationPermission,
    initializeNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
  }
  return context;
};

