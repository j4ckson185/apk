import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert, Vibration } from 'react-native';
import { OrdersContextType, Order } from '../types';
import { OrdersService } from '../services/firebase/orders';
import ifoodApi from '../services/ifood/api';
import { useAuth } from './AuthContext';

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

interface OrdersProviderProps {
  children: ReactNode;
}

export const OrdersProvider: React.FC<OrdersProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    // Configurar listener para pedidos em tempo real
    const unsubscribe = OrdersService.subscribeToOrders(
      user.deliveryId,
      (newOrders) => {
        // Verificar se há novos pedidos para notificar
        const newOrdersCount = newOrders.filter(order => 
          order.status === 'sent' && 
          !orders.find(existingOrder => existingOrder.id === order.id)
        ).length;

        if (newOrdersCount > 0 && orders.length > 0) {
          // Vibrar e mostrar alerta para novos pedidos
          Vibration.vibrate([0, 500, 200, 500]);
          Alert.alert(
            '🔔 Novo Pedido!',
            `Você tem ${newOrdersCount} novo(s) pedido(s) disponível(is)`,
            [{ text: 'OK' }]
          );
        }

        setOrders(newOrders);
        setLoading(false);
      },
      (error) => {
        console.error('Erro no listener de pedidos:', error);
        setLoading(false);
        Alert.alert('Erro', 'Erro ao carregar pedidos');
      }
    );

    return unsubscribe;
  }, [user]);

  const acceptOrder = async (orderId: string): Promise<void> => {
    try {
      setLoading(true);
      await OrdersService.acceptOrder(orderId);
      // O listener atualizará automaticamente a lista
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const dispatchOrder = async (orderId: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Primeiro despachar via API iFood
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await ifoodApi.dispatchOrder(order.orderId);
      }
      
      // Depois atualizar status no Firebase
      await OrdersService.dispatchOrder(orderId);
      
      // O listener atualizará automaticamente a lista
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeliveryCode = async (orderId: string, code: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Primeiro confirmar código via API iFood
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await ifoodApi.verifyDeliveryCode(order.orderId, code);
      }
      
      // Depois finalizar pedido no Firebase
      await OrdersService.finishOrder(orderId);
      
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const finishWithoutCode = async (orderId: string): Promise<void> => {
    try {
      setLoading(true);
      await OrdersService.finishOrder(orderId);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptAllOrders = async (): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);
      await OrdersService.acceptAllOrders(user.deliveryId);
      Alert.alert('Sucesso', 'Todos os pedidos foram aceitos!');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const value: OrdersContextType = {
    orders,
    loading,
    acceptOrder,
    dispatchOrder,
    confirmDeliveryCode,
    finishWithoutCode,
    acceptAllOrders
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = (): OrdersContextType => {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders deve ser usado dentro de um OrdersProvider');
  }
  return context;
};

