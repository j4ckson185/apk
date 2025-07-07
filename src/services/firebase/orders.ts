import { firebaseFirestore } from '../../config/firebase';
import { Order } from '../../types';
import { ORDER_STATUS } from '../../config/app';

export class OrdersService {
  private static COLLECTION_NAME = 'deliveryAssignments';

  // Listener para pedidos em tempo real
  static subscribeToOrders(
    deliveryId: string,
    callback: (orders: Order[]) => void,
    onError?: (error: Error) => void
  ) {
    try {
      return firebaseFirestore
        .collection(this.COLLECTION_NAME)
        .where('deliveryId', '==', deliveryId)
        .where('status', 'in', [
          ORDER_STATUS.SENT,
          ORDER_STATUS.ACCEPTED,
          ORDER_STATUS.DISPATCHED
        ])
        .orderBy('createdAt', 'desc')
        .onSnapshot(
          (snapshot) => {
            const orders: Order[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              orders.push({
                id: doc.id,
                orderId: data.orderId,
                customerId: data.customerId,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                address: data.address,
                items: data.items || [],
                paymentMethod: data.paymentMethod,
                total: data.total,
                status: data.status,
                deliveryId: data.deliveryId,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                observations: data.observations
              });
            });
            callback(orders);
          },
          (error) => {
            console.error('Erro ao buscar pedidos:', error);
            if (onError) {
              onError(new Error('Erro ao carregar pedidos'));
            }
          }
        );
    } catch (error) {
      console.error('Erro ao configurar listener:', error);
      if (onError) {
        onError(new Error('Erro ao configurar listener de pedidos'));
      }
      return () => {}; // Retorna função vazia se houver erro
    }
  }

  // Aceitar um pedido
  static async acceptOrder(orderId: string): Promise<void> {
    try {
      const orderRef = firebaseFirestore
        .collection(this.COLLECTION_NAME)
        .doc(orderId);

      await orderRef.update({
        status: ORDER_STATUS.ACCEPTED,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error);
      throw new Error('Erro ao aceitar pedido');
    }
  }

  // Aceitar todos os pedidos com status "sent"
  static async acceptAllOrders(deliveryId: string): Promise<void> {
    try {
      const snapshot = await firebaseFirestore
        .collection(this.COLLECTION_NAME)
        .where('deliveryId', '==', deliveryId)
        .where('status', '==', ORDER_STATUS.SENT)
        .get();

      const batch = firebaseFirestore.batch();
      
      snapshot.forEach((doc) => {
        batch.update(doc.ref, {
          status: ORDER_STATUS.ACCEPTED,
          updatedAt: new Date()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Erro ao aceitar todos os pedidos:', error);
      throw new Error('Erro ao aceitar todos os pedidos');
    }
  }

  // Despachar pedido (atualizar status para dispatched)
  static async dispatchOrder(orderId: string): Promise<void> {
    try {
      const orderRef = firebaseFirestore
        .collection(this.COLLECTION_NAME)
        .doc(orderId);

      await orderRef.update({
        status: ORDER_STATUS.DISPATCHED,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao despachar pedido:', error);
      throw new Error('Erro ao despachar pedido');
    }
  }

  // Finalizar pedido
  static async finishOrder(orderId: string): Promise<void> {
    try {
      const orderRef = firebaseFirestore
        .collection(this.COLLECTION_NAME)
        .doc(orderId);

      await orderRef.update({
        status: ORDER_STATUS.CONCLUDED,
        updatedAt: new Date(),
        concludedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      throw new Error('Erro ao finalizar pedido');
    }
  }

  // Buscar pedidos concluídos por período (para relatórios)
  static async getCompletedOrders(
    deliveryId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Order[]> {
    try {
      const snapshot = await firebaseFirestore
        .collection(this.COLLECTION_NAME)
        .where('deliveryId', '==', deliveryId)
        .where('status', '==', ORDER_STATUS.CONCLUDED)
        .where('concludedAt', '>=', startDate)
        .where('concludedAt', '<=', endDate)
        .orderBy('concludedAt', 'desc')
        .get();

      const orders: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          orderId: data.orderId,
          customerId: data.customerId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          address: data.address,
          items: data.items || [],
          paymentMethod: data.paymentMethod,
          total: data.total,
          status: data.status,
          deliveryId: data.deliveryId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          observations: data.observations
        });
      });

      return orders;
    } catch (error) {
      console.error('Erro ao buscar pedidos concluídos:', error);
      throw new Error('Erro ao buscar pedidos concluídos');
    }
  }

  // Buscar pedidos ativos com endereço (para rota)
  static async getActiveOrdersWithAddress(deliveryId: string): Promise<Order[]> {
    try {
      const snapshot = await firebaseFirestore
        .collection(this.COLLECTION_NAME)
        .where('deliveryId', '==', deliveryId)
        .where('status', 'in', [ORDER_STATUS.ACCEPTED, ORDER_STATUS.DISPATCHED])
        .get();

      const orders: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Só incluir pedidos que tenham coordenadas
        if (data.address?.coordinates?.lat && data.address?.coordinates?.lng) {
          orders.push({
            id: doc.id,
            orderId: data.orderId,
            customerId: data.customerId,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            address: data.address,
            items: data.items || [],
            paymentMethod: data.paymentMethod,
            total: data.total,
            status: data.status,
            deliveryId: data.deliveryId,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            observations: data.observations
          });
        }
      });

      return orders;
    } catch (error) {
      console.error('Erro ao buscar pedidos ativos:', error);
      throw new Error('Erro ao buscar pedidos ativos');
    }
  }
}

