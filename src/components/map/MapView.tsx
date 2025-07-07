import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { STORE_LOCATION, COLORS } from '../../config/app';
import { MapMarker, Order } from '../../types';

interface MapComponentProps {
  orders: Order[];
  userLocation?: { latitude: number; longitude: number } | null;
  onMapReady?: () => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  orders, 
  userLocation, 
  onMapReady 
}) => {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  // Configuração inicial da região do mapa
  const initialRegion = {
    latitude: STORE_LOCATION.lat,
    longitude: STORE_LOCATION.lng,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    if (mapReady && onMapReady) {
      onMapReady();
    }
  }, [mapReady, onMapReady]);

  // Centralizar mapa na localização do usuário
  const centerOnUser = () => {
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

  // Centralizar mapa na loja
  const centerOnStore = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: STORE_LOCATION.lat,
        longitude: STORE_LOCATION.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  // Mostrar todos os marcadores
  const showAllMarkers = () => {
    if (mapRef.current) {
      const coordinates = [
        { latitude: STORE_LOCATION.lat, longitude: STORE_LOCATION.lng }
      ];

      // Adicionar coordenadas dos pedidos
      orders.forEach(order => {
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
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={false} // Vamos usar nosso próprio marcador
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        onMapReady={() => setMapReady(true)}
        mapType="standard"
      >
        {/* Marcador da loja */}
        <Marker
          coordinate={{
            latitude: STORE_LOCATION.lat,
            longitude: STORE_LOCATION.lng
          }}
          title="🏪 Cabana Delivery"
          description={STORE_LOCATION.address}
          pinColor={COLORS.primary}
        />

        {/* Marcadores dos pedidos */}
        {orders.map((order) => {
          if (!order.address.coordinates) return null;
          
          return (
            <Marker
              key={order.id}
              coordinate={{
                latitude: order.address.coordinates.lat,
                longitude: order.address.coordinates.lng
              }}
              title={`📦 Pedido #${order.orderId}`}
              description={`${order.customerName} - ${order.address.street}, ${order.address.number}`}
            >
              <View style={[styles.orderMarker, { backgroundColor: getOrderMarkerColor(order.status) }]}>
                <Text style={styles.orderMarkerText}>{order.orderId.slice(-2)}</Text>
              </View>
            </Marker>
          );
        })}

        {/* Marcador do usuário */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="📍 Sua Localização"
            description="Localização atual do entregador"
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
};

// Função para obter cor do marcador baseado no status
const getOrderMarkerColor = (status: string) => {
  switch (status) {
    case 'sent':
      return COLORS.warning;
    case 'accepted':
      return COLORS.primary;
    case 'dispatched':
      return COLORS.secondary;
    default:
      return COLORS.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  orderMarker: {
    width: 30,
    height: 30,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  orderMarkerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
});

export default MapComponent;

