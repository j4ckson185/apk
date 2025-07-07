import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { LOCATION_CONFIG } from '../../config/app';
import { DeliveryLocation } from '../../types';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export class LocationService {
  private static watchId: number | null = null;
  private static isTracking = false;
  private static lastLocation: LocationData | null = null;
  private static locationCallback: ((location: LocationData) => void) | null = null;

  // Solicitar permissões de localização
  static async requestLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        return (
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted' ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === 'granted'
        );
      }
      
      // Para iOS, as permissões são solicitadas automaticamente
      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissões de localização:', error);
      return false;
    }
  }

  // Verificar se as permissões estão concedidas
  static async checkLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const fineLocation = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const coarseLocation = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );

        return fineLocation || coarseLocation;
      }
      
      return true; // iOS
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }

  // Obter localização atual uma vez
  static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          
          this.lastLocation = location;
          resolve(location);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          reject(new Error('Erro ao obter localização atual'));
        },
        LOCATION_CONFIG
      );
    });
  }

  // Iniciar rastreamento contínuo
  static async startTracking(callback: (location: LocationData) => void): Promise<boolean> {
    try {
      // Verificar permissões
      const hasPermission = await this.checkLocationPermission();
      if (!hasPermission) {
        const granted = await this.requestLocationPermission();
        if (!granted) {
          Alert.alert(
            'Permissão Necessária',
            'O aplicativo precisa de acesso à localização para funcionar corretamente.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }

      // Se já está rastreando, parar primeiro
      if (this.isTracking) {
        this.stopTracking();
      }

      this.locationCallback = callback;
      this.isTracking = true;

      this.watchId = Geolocation.watchPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          this.lastLocation = location;
          
          if (this.locationCallback) {
            this.locationCallback(location);
          }
        },
        (error) => {
          console.error('Erro no rastreamento GPS:', error);
          Alert.alert('Erro GPS', 'Erro ao rastrear localização');
        },
        {
          ...LOCATION_CONFIG,
          interval: 10000, // Atualizar a cada 10 segundos
          fastestInterval: 5000, // Mínimo de 5 segundos entre atualizações
        }
      );

      console.log('Rastreamento GPS iniciado');
      return true;
    } catch (error) {
      console.error('Erro ao iniciar rastreamento:', error);
      return false;
    }
  }

  // Parar rastreamento
  static stopTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    this.isTracking = false;
    this.locationCallback = null;
    console.log('Rastreamento GPS parado');
  }

  // Verificar se está rastreando
  static isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  // Obter última localização conhecida
  static getLastKnownLocation(): LocationData | null {
    return this.lastLocation;
  }

  // Calcular distância entre dois pontos (em metros)
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Verificar se a localização mudou significativamente
  static hasLocationChanged(
    newLocation: LocationData,
    oldLocation: LocationData | null,
    threshold: number = 10 // metros
  ): boolean {
    if (!oldLocation) return true;

    const distance = this.calculateDistance(
      newLocation.latitude,
      newLocation.longitude,
      oldLocation.latitude,
      oldLocation.longitude
    );

    return distance >= threshold;
  }
}

