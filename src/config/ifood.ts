// Configuração da API iFood
export const IFOOD_CONFIG = {
  merchantId: '2733980',
  merchantUUID: 'cbf5929d-2eb9-49d0-aaca-ea9dcfdb387a',
  clientId: '0ab88bb0-0d63-4010-a0b6-a0bc25eea198',
  clientSecret: 'hzuj6prosxn02zbm8v34lyob00rb1klxkpivb1wuzxyp2fd2ivj95t697wonsyb7vtiesrltuc4f3h8kevdby77vn3yapx7s3yv',
  baseUrl: 'https://merchant-api.ifood.com.br'
};

// Endpoints da API
export const IFOOD_ENDPOINTS = {
  auth: '/authentication/v1.0/oauth/token',
  dispatch: (orderId: string) => `/order/v1.0/orders/${orderId}/dispatch`,
  verifyCode: (orderId: string) => `/order/v1.0/orders/${orderId}/verifyDeliveryCode`
};

// Headers padrão
export const IFOOD_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Headers para autenticação
export const IFOOD_AUTH_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

