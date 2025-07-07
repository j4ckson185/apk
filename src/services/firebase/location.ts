import { firebaseFirestore } from '../../config/firebase';
import { DeliveryLocation } from '../../types';
import { LocationData } from '../location/gps';

export class LocationFirebaseService {
  private static COLLECTION_NAME = 'deliveryLocations';

  // Salvar localização do entregador
  static async saveLocation(
    deliveryId: string,
    locationData: LocationData
  ): Promise<void> {
    try {
      const deliveryLocation: DeliveryLocation = {
        deliveryId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: new Date(locationData.timestamp),
        isActive: true
      };

      // Usar o deliveryId como ID do documento para sobrescrever a localização anterior
      await firebaseFirestore
        .collection(this.COLLECTION_NAME)
        .doc(deliveryId)
        .set(deliveryLocation);

      console.log(`Localização salva para ${deliveryId}`);
    } catch (error) {
      console.error('Erro ao salvar localização:', error);
      throw new Error('Erro ao salvar localização no Firebase');
    }
  }

  // Marcar entregador como inativo
  static async setInactive(deliveryId: string): Promise<void> {
    try {
      await firebaseFirestore
        .collection(this.COLLECTION_NAME)
        .doc(deliveryId)
        .update({
          isActive: false,
          timestamp: new Date()
        });

      console.log(`Entregador ${deliveryId} marcado como inativo`);
    } catch (error) {
      console.error('Erro ao marcar como inativo:', error);
      throw new Error('Erro ao atualizar status no Firebase');
    }
  }

  // Obter localização de um entregador
  static async getDeliveryLocation(deliveryId: string): Promise<DeliveryLocation | null> {
    try {
      const doc = await firebaseFirestore
        .collection(this.COLLECTION_NAME)
        .doc(deliveryId)
        .get();

      if (doc.exists) {
        const data = doc.data();
        return {
          deliveryId: data!.deliveryId,
          latitude: data!.latitude,
          longitude: data!.longitude,
          timestamp: data!.timestamp.toDate(),
          isActive: data!.isActive
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      throw new Error('Erro ao obter localização do Firebase');
    }
  }

  // Obter localizações de todos os entregadores ativos
  static async getActiveDeliveries(): Promise<DeliveryLocation[]> {
    try {
      const snapshot = await firebaseFirestore
        .collection(this.COLLECTION_NAME)
        .where('isActive', '==', true)
        .get();

      const locations: DeliveryLocation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        locations.push({
          deliveryId: data.deliveryId,
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: data.timestamp.toDate(),
          isActive: data.isActive
        });
      });

      return locations;
    } catch (error) {
      console.error('Erro ao obter entregadores ativos:', error);
      throw new Error('Erro ao obter entregadores ativos');
    }
  }

  // Listener para mudanças na localização de um entregador
  static subscribeToDeliveryLocation(
    deliveryId: string,
    callback: (location: DeliveryLocation | null) => void,
    onError?: (error: Error) => void
  ) {
    try {
      return firebaseFirestore
        .collection(this.COLLECTION_NAME)
        .doc(deliveryId)
        .onSnapshot(
          (doc) => {
            if (doc.exists) {
              const data = doc.data();
              const location: DeliveryLocation = {
                deliveryId: data!.deliveryId,
                latitude: data!.latitude,
                longitude: data!.longitude,
                timestamp: data!.timestamp.toDate(),
                isActive: data!.isActive
              };
              callback(location);
            } else {
              callback(null);
            }
          },
          (error) => {
            console.error('Erro no listener de localização:', error);
            if (onError) {
              onError(new Error('Erro ao monitorar localização'));
            }
          }
        );
    } catch (error) {
      console.error('Erro ao configurar listener de localização:', error);
      if (onError) {
        onError(new Error('Erro ao configurar monitoramento de localização'));
      }
      return () => {}; // Retorna função vazia se houver erro
    }
  }

  // Limpar localizações antigas (mais de 24 horas)
  static async cleanOldLocations(): Promise<void> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const snapshot = await firebaseFirestore
        .collection(this.COLLECTION_NAME)
        .where('timestamp', '<', oneDayAgo)
        .get();

      const batch = firebaseFirestore.batch();
      
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`${snapshot.size} localizações antigas removidas`);
    } catch (error) {
      console.error('Erro ao limpar localizações antigas:', error);
    }
  }
}

