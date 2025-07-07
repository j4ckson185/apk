// Configurações gerais do aplicativo

// Localização da loja
export const STORE_LOCATION = {
  lat: -5.7480,
  lng: -35.2560,
  address: 'Rua Serra do Mar, 1216, Potengi',
  city: 'Natal',
  state: 'RN'
};

// Mapeamento de email para delivery ID
export const EMAIL_TO_DELIVERY_ID: { [key: string]: string } = {
  'jackson_division@hotmail.com': 'jackson',
  'narlisonmedeiros04@gmail.com': 'narlison', 
  'rafaeljudson.profissional@gmail.com': 'rafael',
  'matheusmoura175@gmail.com': 'matheus',
  'boazd3@gmail.com': 'boaz',
  'andrade88210@gmail.com': 'gabriel',
  'rivanilsonotaviano@gmail.com': 'rivanilson'
};

// Emails autorizados
export const AUTHORIZED_EMAILS = Object.keys(EMAIL_TO_DELIVERY_ID);

// Cores do tema
export const COLORS = {
  primary: '#8b5cf6',
  secondary: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb'
};

// Status dos pedidos
export const ORDER_STATUS = {
  SENT: 'sent',
  ACCEPTED: 'accepted',
  DISPATCHED: 'dispatched',
  CONCLUDED: 'concluded'
} as const;

// Configurações de localização
export const LOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
  distanceFilter: 10 // metros
};

// Configurações de notificação
export const NOTIFICATION_CONFIG = {
  sound: true,
  vibration: true,
  badge: true
};

