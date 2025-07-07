import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { LocationService, LocationData } from '../services/location/gps';
import { LocationFirebaseService } from '../services/firebase/location';
import { useAuth } from './AuthContext';

interface LocationContextType {
  currentLocation: LocationData | null;
  isTracking: boolean;
  hasPermission: boolean;
  startTracking: () => Promise<boolean>;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<LocationData | null>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Verificar permissões ao inicializar
    checkPermissions();

    // Listener para mudanças no estado do app
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user && isTracking) {
        // App voltou ao primeiro plano, retomar rastreamento se necessário
        startLocationTracking();
      } else if (nextAppState === 'background' && user) {
        // App foi para segundo plano, continuar rastreamento em background
        // (o rastreamento continua automaticamente)
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      LocationService.stopTracking();
    };
  }, []);

  useEffect(() => {
    // Iniciar rastreamento automaticamente quando usuário faz login
    if (user && hasPermission) {
      startLocationTracking();
    } else if (!user) {
      // Parar rastreamento quando usuário faz logout
      stopLocationTracking();
    }
  }, [user, hasPermission]);

  const checkPermissions = async () => {
    try {
      const permission = await LocationService.checkLocationPermission();
      setHasPermission(permission);
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      setHasPermission(false);
    }
  };

  const startLocationTracking = async (): Promise<boolean> => {
    try {
      if (!user) {
        console.log('Usuário não logado, não iniciando rastreamento');
        return false;
      }

      const success = await LocationService.startTracking((location) => {
        setCurrentLocation(location);
        
        // Salvar localização no Firebase apenas se mudou significativamente
        const lastLocation = LocationService.getLastKnownLocation();
        if (LocationService.hasLocationChanged(location, lastLocation, 10)) {
          LocationFirebaseService.saveLocation(user.deliveryId, location)
            .catch(error => console.error('Erro ao salvar localização:', error));
        }
      });

      if (success) {
        setIsTracking(true);
        setHasPermission(true);
        console.log('Rastreamento iniciado com sucesso');
      } else {
        setHasPermission(false);
      }

      return success;
    } catch (error) {
      console.error('Erro ao iniciar rastreamento:', error);
      return false;
    }
  };

  const stopLocationTracking = () => {
    LocationService.stopTracking();
    setIsTracking(false);
    
    // Marcar como inativo no Firebase
    if (user) {
      LocationFirebaseService.setInactive(user.deliveryId)
        .catch(error => console.error('Erro ao marcar como inativo:', error));
    }
    
    console.log('Rastreamento parado');
  };

  const getCurrentLocationOnce = async (): Promise<LocationData | null> => {
    try {
      if (!hasPermission) {
        const granted = await LocationService.requestLocationPermission();
        if (!granted) {
          return null;
        }
        setHasPermission(true);
      }

      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
      return location;
    } catch (error) {
      console.error('Erro ao obter localização atual:', error);
      return null;
    }
  };

  const value: LocationContextType = {
    currentLocation,
    isTracking,
    hasPermission,
    startTracking: startLocationTracking,
    stopTracking: stopLocationTracking,
    getCurrentLocation: getCurrentLocationOnce
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation deve ser usado dentro de um LocationProvider');
  }
  return context;
};

