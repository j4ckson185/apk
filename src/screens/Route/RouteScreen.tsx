import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { COLORS, STORE_LOCATION } from '../../config/app';
import { useOrders } from '../../contexts/OrdersContext';
import { RouteOptimizerService, RouteOptimizationResult } from '../../services/route/optimizer';
import { RoutePoint } from '../../types';

const RouteScreen: React.FC = () => {
  const { orders } = useOrders();
  const [routeInfo, setRouteInfo] = useState<RouteOptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Filtrar pedidos ativos
  const activeOrders = orders.filter(order => 
    order.status === 'accepted' || order.status === 'dispatched'
  );

  useEffect(() => {
    calculateRoute();
  }, [activeOrders]);

  const calculateRoute = async () => {
    if (!RouteOptimizerService.hasValidOrdersForRoute(activeOrders)) {
      setRouteInfo(null);
      return;
    }

    setLoading(true);
    try {
      const result = await RouteOptimizerService.getRouteInfo(activeOrders);
      setRouteInfo(result);
    } catch (error: any) {
      console.error('Erro ao calcular rota:', error);
      Alert.alert('Erro', 'Erro ao calcular rota otimizada');
    } finally {
      setLoading(false);
    }
  };

  const openInGoogleMaps = async () => {
    if (!RouteOptimizerService.hasValidOrdersForRoute(activeOrders)) {
      Alert.alert('Aviso', 'Nenhum pedido ativo com endereço encontrado');
      return;
    }

    try {
      await RouteOptimizerService.openRouteInGoogleMaps(activeOrders);
    } catch (error) {
      console.error('Erro ao abrir Google Maps:', error);
    }
  };

  const renderRoutePoint = (point: RoutePoint, index: number) => {
    const isStore = index === 0;
    const isLast = index === (routeInfo?.orderedPoints.length || 0) - 1;

    return (
      <View key={`${point.latitude}-${point.longitude}-${index}`} style={styles.routePoint}>
        <View style={styles.routePointLeft}>
          <View style={[
            styles.routeMarker,
            { backgroundColor: isStore ? COLORS.primary : COLORS.secondary }
          ]}>
            <Text style={styles.routeMarkerText}>
              {isStore ? '🏪' : index.toString()}
            </Text>
          </View>
          {!isLast && <View style={styles.routeLine} />}
        </View>
        
        <View style={styles.routePointContent}>
          <Text style={styles.routePointTitle}>
            {isStore ? 'Loja - Ponto de Partida' : `Entrega ${index}`}
          </Text>
          <Text style={styles.routePointAddress}>{point.address}</Text>
          {point.orderId && (
            <Text style={styles.routePointOrder}>Pedido #{point.orderId}</Text>
          )}
        </View>
      </View>
    );
  };

  const stats = RouteOptimizerService.getRouteStats(orders);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Rota Otimizada</Text>
        {routeInfo && (
          <TouchableOpacity style={styles.mapsButton} onPress={openInGoogleMaps}>
            <Text style={styles.mapsButtonText}>📍 Abrir no Maps</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Estatísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activeOrders}</Text>
            <Text style={styles.statLabel}>Entregas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {routeInfo ? RouteOptimizerService.formatDistance(routeInfo.totalDistance) : '-'}
            </Text>
            <Text style={styles.statLabel}>Distância</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {routeInfo ? RouteOptimizerService.formatTime(routeInfo.estimatedTime) : '-'}
            </Text>
            <Text style={styles.statLabel}>Tempo Est.</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Calculando rota otimizada...</Text>
          </View>
        ) : !routeInfo ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>Nenhuma rota disponível</Text>
            <Text style={styles.emptySubtitle}>
              {stats.activeOrders === 0 
                ? 'Aceite pedidos para gerar uma rota otimizada'
                : 'Aguardando endereços dos pedidos...'
              }
            </Text>
            
            {stats.totalOrders > 0 && (
              <View style={styles.emptyStats}>
                <Text style={styles.emptyStatsText}>
                  📦 {stats.totalOrders} pedido(s) total
                </Text>
                <Text style={styles.emptyStatsText}>
                  📍 {stats.ordersWithAddress} com endereço
                </Text>
                <Text style={styles.emptyStatsText}>
                  ✅ {stats.activeOrders} ativo(s)
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.routeContainer}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeTitle}>Sequência de Entregas</Text>
              <TouchableOpacity onPress={calculateRoute} style={styles.refreshButton}>
                <Text style={styles.refreshButtonText}>🔄 Recalcular</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.routeList}>
              {routeInfo.orderedPoints.map((point, index) => 
                renderRoutePoint(point, index)
              )}
            </View>

            <View style={styles.routeFooter}>
              <Text style={styles.routeFooterText}>
                💡 Rota otimizada pelo algoritmo de vizinho mais próximo
              </Text>
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
  mapsButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapsButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
    marginBottom: 20,
  },
  emptyStats: {
    alignItems: 'center',
    gap: 4,
  },
  emptyStatsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  routeContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeList: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  routePointLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  routeMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeMarkerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: COLORS.border,
  },
  routePointContent: {
    flex: 1,
    paddingVertical: 4,
  },
  routePointTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  routePointAddress: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  routePointOrder: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  routeFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  routeFooterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default RouteScreen;

