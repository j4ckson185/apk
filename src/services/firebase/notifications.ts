import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationData } from '../../types';
import { NOTIFICATION_CONFIG } from '../../config/app';

export class NotificationService {
  private static fcmToken: string | null = null;
  private static isInitialized = false;

  // Inicializar serviço de notificações
  static async initialize(): Promise<boolean> {
    try {
      // Verificar se as notificações estão habilitadas
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Permissão de notificação negada');
        return false;
      }

      // Obter token FCM
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      // Salvar token no storage
      await AsyncStorage.setItem('fcm_token', token);
      
      console.log('FCM Token:', token);

      // Configurar listeners
      this.setupListeners();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
      return false;
    }
  }

  // Configurar listeners de notificação
  private static setupListeners(): void {
    // Listener para quando o app está em primeiro plano
    messaging().onMessage(async (remoteMessage) => {
      console.log('Notificação recebida em primeiro plano:', remoteMessage);
      
      if (remoteMessage.notification) {
        this.showLocalNotification(remoteMessage);
      }
    });

    // Listener para quando o app é aberto via notificação
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('App aberto via notificação:', remoteMessage);
      this.handleNotificationAction(remoteMessage);
    });

    // Verificar se o app foi aberto via notificação (app estava fechado)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App aberto via notificação (estava fechado):', remoteMessage);
          this.handleNotificationAction(remoteMessage);
        }
      });

    // Listener para mudanças no token
    messaging().onTokenRefresh((token) => {
      console.log('Token FCM atualizado:', token);
      this.fcmToken = token;
      AsyncStorage.setItem('fcm_token', token);
    });
  }

  // Mostrar notificação local quando app está em primeiro plano
  private static showLocalNotification(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    const { notification } = remoteMessage;
    
    if (notification) {
      Alert.alert(
        notification.title || 'Nova Notificação',
        notification.body || '',
        [
          { text: 'OK', onPress: () => this.handleNotificationAction(remoteMessage) }
        ]
      );
    }
  }

  // Tratar ação da notificação
  private static handleNotificationAction(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    const data = remoteMessage.data;
    
    if (data?.type === 'new_order') {
      // Navegar para tela de pedidos
      console.log('Navegando para pedidos devido a nova notificação');
      // Aqui você pode usar navigation para navegar
    } else if (data?.type === 'order_update') {
      // Tratar atualização de pedido
      console.log('Atualização de pedido recebida');
    }
  }

  // Obter token FCM atual
  static async getFCMToken(): Promise<string | null> {
    if (this.fcmToken) {
      return this.fcmToken;
    }

    try {
      // Tentar obter do storage
      const storedToken = await AsyncStorage.getItem('fcm_token');
      if (storedToken) {
        this.fcmToken = storedToken;
        return storedToken;
      }

      // Obter novo token
      const token = await messaging().getToken();
      this.fcmToken = token;
      await AsyncStorage.setItem('fcm_token', token);
      
      return token;
    } catch (error) {
      console.error('Erro ao obter token FCM:', error);
      return null;
    }
  }

  // Verificar se as notificações estão habilitadas
  static async checkPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().hasPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.error('Erro ao verificar permissão de notificação:', error);
      return false;
    }
  }

  // Solicitar permissão de notificação
  static async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return false;
    }
  }

  // Inscrever-se em tópico
  static async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Inscrito no tópico: ${topic}`);
    } catch (error) {
      console.error('Erro ao se inscrever no tópico:', error);
    }
  }

  // Desinscrever-se de tópico
  static async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Desinscrito do tópico: ${topic}`);
    } catch (error) {
      console.error('Erro ao se desinscrever do tópico:', error);
    }
  }

  // Inscrever-se em tópicos específicos do entregador
  static async subscribeToDeliveryTopics(deliveryId: string): Promise<void> {
    try {
      // Tópico geral para todos os entregadores
      await this.subscribeToTopic('all_deliveries');
      
      // Tópico específico para este entregador
      await this.subscribeToTopic(`delivery_${deliveryId}`);
      
      console.log(`Inscrito nos tópicos de entrega para ${deliveryId}`);
    } catch (error) {
      console.error('Erro ao se inscrever nos tópicos de entrega:', error);
    }
  }

  // Desinscrever-se de tópicos do entregador
  static async unsubscribeFromDeliveryTopics(deliveryId: string): Promise<void> {
    try {
      await this.unsubscribeFromTopic('all_deliveries');
      await this.unsubscribeFromTopic(`delivery_${deliveryId}`);
      
      console.log(`Desinscrito dos tópicos de entrega para ${deliveryId}`);
    } catch (error) {
      console.error('Erro ao se desinscrever dos tópicos de entrega:', error);
    }
  }

  // Verificar se o serviço está inicializado
  static isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // Limpar dados de notificação
  static async clearNotificationData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('fcm_token');
      this.fcmToken = null;
      this.isInitialized = false;
      console.log('Dados de notificação limpos');
    } catch (error) {
      console.error('Erro ao limpar dados de notificação:', error);
    }
  }
}

