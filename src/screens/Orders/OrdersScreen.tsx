import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { COLORS } from '../../config/app';
import { useOrders } from '../../contexts/OrdersContext';
import OrderCard from '../../components/orders/OrderCard';
import IFoodStatus from '../../components/common/IFoodStatus';
import NotificationStatus from '../../components/common/NotificationStatus';

const OrdersScreen: React.FC = () => {
  const { orders, loading, acceptAllOrders } = useOrders();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // O listener do Firebase já mantém os dados atualizados
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const sentOrders = orders.filter(order => order.status === 'sent');
  const hasOrdersToAccept = sentOrders.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📦 Pedidos</Text>
        {hasOrdersToAccept && (
          <TouchableOpacity 
            style={styles.acceptAllButton} 
            onPress={acceptAllOrders}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.acceptAllText}>✅ Aceitar Todos</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && orders.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Carregando pedidos...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Nenhum pedido disponível</Text>
            <Text style={styles.emptySubtitle}>
              Os pedidos aparecerão aqui quando estiverem disponíveis
            </Text>
          </View>
        ) : (
          <>
            {/* Estatísticas */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{orders.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{sentOrders.length}</Text>
                <Text style={styles.statLabel}>Novos</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {orders.filter(o => o.status === 'accepted').length}
                </Text>
                <Text style={styles.statLabel}>Aceitos</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {orders.filter(o => o.status === 'dispatched').length}
                </Text>
                <Text style={styles.statLabel}>Despachados</Text>
              </View>
            </View>

            {/* Status da API iFood */}
            <IFoodStatus />

            {/* Status das Notificações */}
            <NotificationStatus />

            {/* Lista de pedidos */}
            <View style={styles.ordersContainer}>
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  acceptAllButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  acceptAllText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  ordersContainer: {
    paddingBottom: 20,
  },
});

export default OrdersScreen;

