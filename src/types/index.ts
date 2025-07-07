// Tipos principais do aplicativo

export interface User {
  email: string;
  deliveryId: string;
  uid: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  observations?: string;
}

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  items: OrderItem[];
  paymentMethod: string;
  total: number;
  status: 'sent' | 'accepted' | 'dispatched' | 'concluded';
  deliveryId: string;
  createdAt: Date;
  updatedAt: Date;
  observations?: string;
}

export interface DeliveryLocation {
  deliveryId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  isActive: boolean;
}

export interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description?: string;
  type: 'store' | 'order' | 'user';
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  address: string;
  orderId?: string;
}

export interface Report {
  date: string;
  orders: Order[];
  totalOrders: number;
  totalValue: number;
}

export interface NotificationData {
  orderId: string;
  type: 'new_order' | 'order_update';
  title: string;
  body: string;
}

// Tipos de navegação
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Orders: undefined;
  Map: undefined;
  Route: undefined;
};

export type DrawerParamList = {
  MainTabs: undefined;
  Reports: undefined;
};

// Tipos de resposta da API iFood
export interface IFoodAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface IFoodErrorResponse {
  error: string;
  error_description?: string;
}

// Tipos de contexto
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface OrdersContextType {
  orders: Order[];
  loading: boolean;
  acceptOrder: (orderId: string) => Promise<void>;
  dispatchOrder: (orderId: string) => Promise<void>;
  confirmDeliveryCode: (orderId: string, code: string) => Promise<void>;
  finishWithoutCode: (orderId: string) => Promise<void>;
  acceptAllOrders: () => Promise<void>;
}

