import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { Order } from '../../types';
import { COLORS, ORDER_STATUS } from '../../config/app';
import { useOrders } from '../../contexts/OrdersContext';

interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const [showModal, setShowModal] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const { acceptOrder, dispatchOrder, confirmDeliveryCode, finishWithoutCode } = useOrders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case ORDER_STATUS.SENT:
        return COLORS.warning;
      case ORDER_STATUS.ACCEPTED:
        return COLORS.primary;
      case ORDER_STATUS.DISPATCHED:
        return COLORS.secondary;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case ORDER_STATUS.SENT:
        return 'Enviado';
      case ORDER_STATUS.ACCEPTED:
        return 'Aceito';
      case ORDER_STATUS.DISPATCHED:
        return 'Despachado';
      default:
        return status;
    }
  };

  const handleAccept = () => {
    Alert.alert(
      'Aceitar Pedido',
      `Deseja aceitar o pedido #${order.orderId}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aceitar', onPress: () => acceptOrder(order.id) }
      ]
    );
  };

  const handleDispatch = () => {
    Alert.alert(
      'Despachar Pedido',
      `Deseja despachar o pedido #${order.orderId}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Despachar', onPress: () => dispatchOrder(order.id) }
      ]
    );
  };

  const handleConfirmCode = () => {
    Alert.prompt(
      'Código de Entrega',
      'Digite o código de 4 dígitos:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: (code) => {
            if (code && code.length === 4) {
              confirmDeliveryCode(order.id, code);
            } else {
              Alert.alert('Erro', 'Código deve ter 4 dígitos');
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleFinishWithoutCode = () => {
    Alert.alert(
      'Finalizar Sem Código',
      `Deseja finalizar o pedido #${order.orderId} sem código?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Finalizar', onPress: () => finishWithoutCode(order.id) }
      ]
    );
  };

  const renderActionButtons = () => {
    switch (order.status) {
      case ORDER_STATUS.SENT:
        return (
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.buttonText}>✅ Aceitar Pedido</Text>
          </TouchableOpacity>
        );
      
      case ORDER_STATUS.ACCEPTED:
        return (
          <TouchableOpacity style={styles.dispatchButton} onPress={handleDispatch}>
            <Text style={styles.buttonText}>🚀 Despachar Pedido</Text>
          </TouchableOpacity>
        );
      
      case ORDER_STATUS.DISPATCHED:
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.codeButton} onPress={handleConfirmCode}>
              <Text style={styles.buttonText}>🔢 Código</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishButton} onPress={handleFinishWithoutCode}>
              <Text style={styles.buttonText}>✅ Finalizar</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };

  const formatAddress = () => {
    const addr = order.address;
    return `${addr.street}, ${addr.number}${addr.complement ? `, ${addr.complement}` : ''} - ${addr.neighborhood}, ${addr.city}/${addr.state}`;
  };

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={() => setShowModal(true)}>
        <View style={styles.header}>
          <Text style={styles.orderId}>#{order.orderId}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.customerName}>👤 {order.customerName}</Text>
          <Text style={styles.address} numberOfLines={2}>📍 {formatAddress()}</Text>
          
          <View style={styles.orderInfo}>
            <Text style={styles.itemsCount}>📦 {order.items.length} item(s)</Text>
            <Text style={styles.payment}>💳 {order.paymentMethod}</Text>
            <Text style={styles.total}>💰 R$ {order.total.toFixed(2)}</Text>
          </View>

          {order.observations && (
            <Text style={styles.observations} numberOfLines={2}>
              💬 {order.observations}
            </Text>
          )}
        </View>

        {renderActionButtons()}
      </TouchableOpacity>

      {/* Modal de detalhes */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalhes do Pedido</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Informações Gerais</Text>
              <Text style={styles.detailText}>Pedido: #{order.orderId}</Text>
              <Text style={styles.detailText}>Cliente: {order.customerName}</Text>
              {order.customerPhone && (
                <Text style={styles.detailText}>Telefone: {order.customerPhone}</Text>
              )}
              <Text style={styles.detailText}>Status: {getStatusText(order.status)}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Endereço de Entrega</Text>
              <Text style={styles.detailText}>{formatAddress()}</Text>
              {order.address.zipCode && (
                <Text style={styles.detailText}>CEP: {order.address.zipCode}</Text>
              )}
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Itens do Pedido</Text>
              {order.items.map((item, index) => (
                <View key={index} style={styles.itemContainer}>
                  <Text style={styles.itemName}>{item.quantity}x {item.name}</Text>
                  <Text style={styles.itemPrice}>R$ {item.price.toFixed(2)}</Text>
                  {item.observations && (
                    <Text style={styles.itemObservations}>Obs: {item.observations}</Text>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Pagamento</Text>
              <Text style={styles.detailText}>Método: {order.paymentMethod}</Text>
              <Text style={styles.totalText}>Total: R$ {order.total.toFixed(2)}</Text>
            </View>

            {order.observations && (
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Observações</Text>
                <Text style={styles.detailText}>{order.observations}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            {renderActionButtons()}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    marginBottom: 16,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemsCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  payment: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  total: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  observations: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  acceptButton: {
    backgroundColor: COLORS.secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dispatchButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  codeButton: {
    flex: 1,
    backgroundColor: COLORS.warning,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  finishButton: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  itemContainer: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  itemObservations: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default OrderCard;

