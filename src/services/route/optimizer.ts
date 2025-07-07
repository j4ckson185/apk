import { Linking, Alert } from 'react-native';
import { Order, RoutePoint } from '../../types';
import { STORE_LOCATION } from '../../config/app';
import { LocationService } from '../location/gps';

export interface RouteOptimizationResult {
  totalDistance: number;
  estimatedTime: number;
  orderedPoints: RoutePoint[];
  googleMapsUrl: string;
}

export class RouteOptimizerService {
  // Calcular distância entre dois pontos usando fórmula de Haversine
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    return LocationService.calculateDistance(lat1, lon1, lat2, lon2);
  }

  // Converter pedidos em pontos de rota
  private static convertOrdersToRoutePoints(orders: Order[]): RoutePoint[] {
    return orders
      .filter(order => order.address.coordinates)
      .map(order => ({
        latitude: order.address.coordinates!.lat,
        longitude: order.address.coordinates!.lng,
        address: `${order.address.street}, ${order.address.number} - ${order.address.neighborhood}`,
        orderId: order.orderId
      }));
  }

  // Algoritmo simples de otimização de rota (nearest neighbor)
  private static optimizeRoute(points: RoutePoint[], startPoint: RoutePoint): RoutePoint[] {
    if (points.length === 0) return [];
    if (points.length === 1) return points;

    const optimizedRoute: RoutePoint[] = [];
    const remainingPoints = [...points];
    let currentPoint = startPoint;

    while (remainingPoints.length > 0) {
      // Encontrar o ponto mais próximo
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(
        currentPoint.latitude,
        currentPoint.longitude,
        remainingPoints[0].latitude,
        remainingPoints[0].longitude
      );

      for (let i = 1; i < remainingPoints.length; i++) {
        const distance = this.calculateDistance(
          currentPoint.latitude,
          currentPoint.longitude,
          remainingPoints[i].latitude,
          remainingPoints[i].longitude
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      // Adicionar o ponto mais próximo à rota
      const nearestPoint = remainingPoints.splice(nearestIndex, 1)[0];
      optimizedRoute.push(nearestPoint);
      currentPoint = nearestPoint;
    }

    return optimizedRoute;
  }

  // Calcular distância total da rota
  private static calculateTotalDistance(route: RoutePoint[], startPoint: RoutePoint): number {
    if (route.length === 0) return 0;

    let totalDistance = 0;
    let currentPoint = startPoint;

    for (const point of route) {
      totalDistance += this.calculateDistance(
        currentPoint.latitude,
        currentPoint.longitude,
        point.latitude,
        point.longitude
      );
      currentPoint = point;
    }

    return totalDistance;
  }

  // Estimar tempo de viagem (baseado em velocidade média de 30 km/h)
  private static estimateTime(distanceInMeters: number): number {
    const averageSpeedKmh = 30;
    const distanceInKm = distanceInMeters / 1000;
    const timeInHours = distanceInKm / averageSpeedKmh;
    return Math.round(timeInHours * 60); // retorna em minutos
  }

  // Gerar URL do Google Maps
  private static generateGoogleMapsUrl(route: RoutePoint[], startPoint: RoutePoint): string {
    if (route.length === 0) {
      return `https://www.google.com/maps/dir/${startPoint.latitude},${startPoint.longitude}`;
    }

    // Construir URL com origem, destinos intermediários e destino final
    const origin = `${startPoint.latitude},${startPoint.longitude}`;
    const destinations = route.map(point => `${point.latitude},${point.longitude}`).join('/');
    
    return `https://www.google.com/maps/dir/${origin}/${destinations}?dir_action=navigate`;
  }

  // Otimizar rota para pedidos ativos
  static async optimizeOrdersRoute(orders: Order[]): Promise<RouteOptimizationResult> {
    try {
      // Filtrar apenas pedidos com coordenadas
      const validOrders = orders.filter(order => 
        order.address.coordinates && 
        (order.status === 'accepted' || order.status === 'dispatched')
      );

      if (validOrders.length === 0) {
        throw new Error('Nenhum pedido ativo com endereço encontrado');
      }

      // Converter pedidos em pontos de rota
      const routePoints = this.convertOrdersToRoutePoints(validOrders);

      // Ponto de partida (loja)
      const startPoint: RoutePoint = {
        latitude: STORE_LOCATION.lat,
        longitude: STORE_LOCATION.lng,
        address: STORE_LOCATION.address
      };

      // Otimizar rota
      const optimizedRoute = this.optimizeRoute(routePoints, startPoint);

      // Calcular distância total
      const totalDistance = this.calculateTotalDistance(optimizedRoute, startPoint);

      // Estimar tempo
      const estimatedTime = this.estimateTime(totalDistance);

      // Gerar URL do Google Maps
      const googleMapsUrl = this.generateGoogleMapsUrl(optimizedRoute, startPoint);

      return {
        totalDistance,
        estimatedTime,
        orderedPoints: [startPoint, ...optimizedRoute],
        googleMapsUrl
      };
    } catch (error) {
      console.error('Erro ao otimizar rota:', error);
      throw error;
    }
  }

  // Abrir rota no Google Maps
  static async openRouteInGoogleMaps(orders: Order[]): Promise<void> {
    try {
      const result = await this.optimizeOrdersRoute(orders);
      
      // Verificar se o Google Maps pode ser aberto
      const canOpen = await Linking.canOpenURL(result.googleMapsUrl);
      
      if (canOpen) {
        await Linking.openURL(result.googleMapsUrl);
      } else {
        // Fallback para URL web do Google Maps
        const webUrl = result.googleMapsUrl.replace('dir_action=navigate', '');
        await Linking.openURL(webUrl);
      }
    } catch (error: any) {
      console.error('Erro ao abrir rota:', error);
      Alert.alert('Erro', error.message || 'Erro ao abrir rota no Google Maps');
    }
  }

  // Obter informações da rota sem abrir o Google Maps
  static async getRouteInfo(orders: Order[]): Promise<RouteOptimizationResult | null> {
    try {
      return await this.optimizeOrdersRoute(orders);
    } catch (error) {
      console.error('Erro ao obter informações da rota:', error);
      return null;
    }
  }

  // Formatar distância para exibição
  static formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  }

  // Formatar tempo para exibição
  static formatTime(timeInMinutes: number): string {
    if (timeInMinutes < 60) {
      return `${timeInMinutes}min`;
    } else {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  }

  // Verificar se há pedidos suficientes para rota
  static hasValidOrdersForRoute(orders: Order[]): boolean {
    return orders.some(order => 
      order.address.coordinates && 
      (order.status === 'accepted' || order.status === 'dispatched')
    );
  }

  // Obter estatísticas da rota
  static getRouteStats(orders: Order[]): {
    totalOrders: number;
    ordersWithAddress: number;
    activeOrders: number;
  } {
    const totalOrders = orders.length;
    const ordersWithAddress = orders.filter(order => order.address.coordinates).length;
    const activeOrders = orders.filter(order => 
      order.address.coordinates && 
      (order.status === 'accepted' || order.status === 'dispatched')
    ).length;

    return {
      totalOrders,
      ordersWithAddress,
      activeOrders
    };
  }
}

