import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert
} from 'react-native';
import MapView from 'react-native-maps';
import { COLORS, STORE_LOCATION } from '../../config/app';
import { useOrders } from '../../contexts/OrdersContext';
import { useLocation } from '../../contexts/LocationContext';
import MapComponent from '../../components/map/MapView';
import MapControls from '../../components/map/MapControls';

const MapScreen: React.FC = () => {
  const { orders } = useOrders();
  const { currentLocation, isTracking } = useLocation();
  const mapRef = useRef<MapView>(null);

  // Filtrar apenas pedidos aceitos e despachados para o mapa
  const activeOrders = orders.filter(order => 
    (order.status === 'accepted' || order.status === 'dispatched') && 
    order.address.coordinates
  );

  // Converter LocationData para formato do mapa
  const userLocation = currentLocation ? {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude
  } : null;

  const handleCenterUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    } else {
      Alert.alert('Localização', 'Localização do usuário não disponível');
    }
  };

  const handleCenterStore = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: STORE_LOCATION.lat,
        longitude: STORE_LOCATION.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const handleShowAll = () => {
    if (mapRef.current) {
      const coordinates = [
        { latitude: STORE_LOCATION.lat, longitude: STORE_LOCATION.lng }
      ];

      // Adicionar coordenadas dos pedidos ativos
      activeOrders.forEach(order => {
        if (order.address.coordinates) {
          coordinates.push({
            latitude: order.address.coordinates.lat,
            longitude: order.address.coordinates.lng
          });
        }
      });

      // Adicionar localização do usuário
      if (userLocation) {
        coordinates.push(userLocation);
      }

      if (coordinates.length > 1) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      } else {
        handleCenterStore();
      }
    }
  };

  const handleRotateLeft = () => {
    // Implementar rotação do mapa se necessário
    Alert.alert('Rotação', 'Funcionalidade de rotação em desenvolvimento');
  };

  const handleRotateRight = () => {
    // Implementar rotação do mapa se necessário
    Alert.alert('Rotação', 'Funcionalidade de rotação em desenvolvimento');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Mapa</Text>
        <View style={styles.headerRight}>
          <View style={styles.stats}>
            <Text style={styles.statsText}>
              {activeOrders.length} pedido(s) ativo(s)
            </Text>
          </View>
          <View style={[styles.trackingStatus, { backgroundColor: isTracking ? COLORS.secondary : COLORS.error }]}>
            <Text style={styles.trackingText}>
              {isTracking ? '📍 GPS Ativo' : '📍 GPS Inativo'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.mapContainer}>
        <MapComponent
          orders={activeOrders}
          userLocation={userLocation}
        />
        
        <MapControls
          onCenterUser={handleCenterUser}
          onCenterStore={handleCenterStore}
          onShowAll={handleShowAll}
          onRotateLeft={handleRotateLeft}
          onRotateRight={handleRotateRight}
          hasUserLocation={!!userLocation}
        />
      </View>
      
      <View style={styles.footer}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            📍 Loja: {STORE_LOCATION.address}, {STORE_LOCATION.city}/{STORE_LOCATION.state}
          </Text>
        </View>
        
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>Loja</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.legendText}>Novo</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>Aceito</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.secondary }]} />
            <Text style={styles.legendText}>Despachado</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4285F4' }]} />
            <Text style={styles.legendText}>Você</Text>
          </View>
        </View>
      </View>
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
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  stats: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trackingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trackingText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  footer: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
  },
  locationInfo: {
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 2,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});

export default MapScreen;

