import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { COLORS } from '../../config/app';
import { useOrders } from '../../contexts/OrdersContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface DailyStats {
  date: string;
  totalOrders: number;
  completedOrders: number;
  revenue: number;
}

interface WeeklyStats {
  week: string;
  totalOrders: number;
  completedOrders: number;
  averageTime: number;
}

const ReportsScreen: React.FC = () => {
  const { orders } = useOrders();
  const { user } = useAuth();
  const { currentLocation, isTracking } = useLocation();
  const { hasPermission, fcmToken } = useNotifications();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Calcular estatísticas
  const calculateStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    let filteredOrders = orders;
    
    switch (selectedPeriod) {
      case 'today':
        filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= today;
        });
        break;
      case 'week':
        filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= weekAgo;
        });
        break;
      case 'month':
        filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= monthAgo;
        });
        break;
    }

    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(order => order.status === 'finished').length;
    const acceptedOrders = filteredOrders.filter(order => order.status === 'accepted').length;
    const dispatchedOrders = filteredOrders.filter(order => order.status === 'dispatched').length;
    const sentOrders = filteredOrders.filter(order => order.status === 'sent').length;

    // Calcular receita estimada (assumindo R$ 5 por entrega)
    const estimatedRevenue = completedOrders * 5;

    // Calcular tempo médio de entrega
    const completedOrdersWithTime = filteredOrders.filter(order => 
      order.status === 'finished' && order.finishedAt && order.acceptedAt
    );
    
    let averageDeliveryTime = 0;
    if (completedOrdersWithTime.length > 0) {
      const totalTime = completedOrdersWithTime.reduce((sum, order) => {
        const startTime = new Date(order.acceptedAt!).getTime();
        const endTime = new Date(order.finishedAt!).getTime();
        return sum + (endTime - startTime);
      }, 0);
      averageDeliveryTime = Math.round(totalTime / completedOrdersWithTime.length / (1000 * 60)); // em minutos
    }

    return {
      totalOrders,
      completedOrders,
      acceptedOrders,
      dispatchedOrders,
      sentOrders,
      estimatedRevenue,
      averageDeliveryTime,
      completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
    };
  };

  const stats = calculateStats();

  const periodButtons = [
    { key: 'today', label: 'Hoje' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mês' }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return COLORS.warning;
      case 'accepted': return COLORS.primary;
      case 'dispatched': return COLORS.secondary;
      case 'finished': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Relatórios</Text>
        <Text style={styles.subtitle}>Estatísticas de entregas</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Seletor de período */}
        <View style={styles.periodSelector}>
          {periodButtons.map((button) => (
            <TouchableOpacity
              key={button.key}
              style={[
                styles.periodButton,
                selectedPeriod === button.key && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(button.key as any)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === button.key && styles.periodButtonTextActive
              ]}>
                {button.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Estatísticas principais */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total de Pedidos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>
              {stats.completedOrders}
            </Text>
            <Text style={styles.statLabel}>Concluídos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.secondary }]}>
              {stats.completionRate}%
            </Text>
            <Text style={styles.statLabel}>Taxa de Conclusão</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>
              {formatCurrency(stats.estimatedRevenue)}
            </Text>
            <Text style={styles.statLabel}>Receita Estimada</Text>
          </View>
        </View>

        {/* Distribuição por status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribuição por Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor('sent') }]} />
              <Text style={styles.statusLabel}>Novos: {stats.sentOrders}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor('accepted') }]} />
              <Text style={styles.statusLabel}>Aceitos: {stats.acceptedOrders}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor('dispatched') }]} />
              <Text style={styles.statusLabel}>Despachados: {stats.dispatchedOrders}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor('finished') }]} />
              <Text style={styles.statusLabel}>Finalizados: {stats.completedOrders}</Text>
            </View>
          </View>
        </View>

        {/* Informações do sistema */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status do Sistema</Text>
          <View style={styles.systemInfo}>
            <View style={styles.systemItem}>
              <Text style={styles.systemLabel}>GPS:</Text>
              <Text style={[styles.systemValue, { color: isTracking ? COLORS.success : COLORS.error }]}>
                {isTracking ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
            <View style={styles.systemItem}>
              <Text style={styles.systemLabel}>Notificações:</Text>
              <Text style={[styles.systemValue, { color: hasPermission ? COLORS.success : COLORS.error }]}>
                {hasPermission ? 'Habilitadas' : 'Desabilitadas'}
              </Text>
            </View>
            <View style={styles.systemItem}>
              <Text style={styles.systemLabel}>Localização:</Text>
              <Text style={styles.systemValue}>
                {currentLocation ? 'Disponível' : 'Indisponível'}
              </Text>
            </View>
            <View style={styles.systemItem}>
              <Text style={styles.systemLabel}>Token FCM:</Text>
              <Text style={styles.systemValue}>
                {fcmToken ? 'Configurado' : 'Não configurado'}
              </Text>
            </View>
          </View>
        </View>

        {/* Informações do usuário */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Entregador</Text>
          <View style={styles.userInfo}>
            <View style={styles.userItem}>
              <Text style={styles.userLabel}>Nome:</Text>
              <Text style={styles.userValue}>{user?.name || 'N/A'}</Text>
            </View>
            <View style={styles.userItem}>
              <Text style={styles.userLabel}>Email:</Text>
              <Text style={styles.userValue}>{user?.email || 'N/A'}</Text>
            </View>
            <View style={styles.userItem}>
              <Text style={styles.userLabel}>ID de Entrega:</Text>
              <Text style={styles.userValue}>{user?.deliveryId || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Performance */}
        {stats.averageDeliveryTime > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.performanceContainer}>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceNumber}>{stats.averageDeliveryTime}</Text>
                <Text style={styles.performanceLabel}>Tempo Médio (min)</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceNumber}>
                  {stats.completedOrders > 0 ? Math.round(stats.estimatedRevenue / stats.completedOrders * 100) / 100 : 0}
                </Text>
                <Text style={styles.performanceLabel}>Receita por Entrega</Text>
              </View>
            </View>
          </View>
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
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
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
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  statusContainer: {
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  systemInfo: {
    gap: 8,
  },
  systemItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  systemLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  systemValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userInfo: {
    gap: 8,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  userValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  performanceContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  performanceItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  performanceNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default ReportsScreen;

