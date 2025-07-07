import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IFOOD_CONFIG, IFOOD_ENDPOINTS, IFOOD_HEADERS, IFOOD_AUTH_HEADERS } from '../../config/ifood';
import { IFoodAuthResponse, IFoodErrorResponse } from '../../types';

class IFoodApiService {
  private api: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: IFOOD_CONFIG.baseUrl,
      timeout: 30000,
    });

    // Interceptor para adicionar token automaticamente
    this.api.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      if (this.accessToken && !config.url?.includes('/authentication/')) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Interceptor para tratar erros
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado, limpar e tentar novamente
          await this.clearToken();
          throw new Error('Token expirado. Tente novamente.');
        }
        throw error;
      }
    );
  }

  // Garantir que temos um token válido
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  // Autenticação OAuth
  private async authenticate(): Promise<void> {
    try {
      // Tentar carregar token do storage primeiro
      const storedToken = await AsyncStorage.getItem('ifood_token');
      const storedExpiry = await AsyncStorage.getItem('ifood_token_expiry');
      
      if (storedToken && storedExpiry) {
        const expiryDate = new Date(storedExpiry);
        if (new Date() < expiryDate) {
          this.accessToken = storedToken;
          this.tokenExpiry = expiryDate;
          return;
        }
      }

      // Fazer nova autenticação
      const authData = new URLSearchParams({
        grantType: 'client_credentials',
        clientId: IFOOD_CONFIG.clientId,
        clientSecret: IFOOD_CONFIG.clientSecret
      });

      const response = await axios.post<IFoodAuthResponse>(
        `${IFOOD_CONFIG.baseUrl}${IFOOD_ENDPOINTS.auth}`,
        authData.toString(),
        {
          headers: IFOOD_AUTH_HEADERS,
          timeout: 30000
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));

      // Salvar no storage
      await AsyncStorage.setItem('ifood_token', this.accessToken);
      await AsyncStorage.setItem('ifood_token_expiry', this.tokenExpiry.toISOString());

      console.log('Autenticação iFood realizada com sucesso');
    } catch (error: any) {
      console.error('Erro na autenticação iFood:', error);
      
      if (error.response?.data) {
        const errorData: IFoodErrorResponse = error.response.data;
        throw new Error(`Erro de autenticação: ${errorData.error_description || errorData.error}`);
      }
      
      throw new Error('Erro ao autenticar com iFood');
    }
  }

  // Limpar token
  private async clearToken(): Promise<void> {
    this.accessToken = null;
    this.tokenExpiry = null;
    await AsyncStorage.removeItem('ifood_token');
    await AsyncStorage.removeItem('ifood_token_expiry');
  }

  // Despachar pedido
  async dispatchOrder(orderId: string): Promise<void> {
    try {
      await this.ensureValidToken();

      const response = await this.api.post(
        IFOOD_ENDPOINTS.dispatch(orderId),
        {},
        {
          headers: IFOOD_HEADERS
        }
      );

      console.log(`Pedido ${orderId} despachado com sucesso`);
    } catch (error: any) {
      console.error('Erro ao despachar pedido:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Pedido não encontrado no iFood');
      } else if (error.response?.status === 400) {
        throw new Error('Pedido não pode ser despachado no momento');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Erro ao despachar pedido no iFood');
    }
  }

  // Confirmar código de entrega
  async verifyDeliveryCode(orderId: string, code: string): Promise<void> {
    try {
      await this.ensureValidToken();

      const response = await this.api.post(
        IFOOD_ENDPOINTS.verifyCode(orderId),
        { code },
        {
          headers: IFOOD_HEADERS
        }
      );

      console.log(`Código de entrega confirmado para pedido ${orderId}`);
    } catch (error: any) {
      console.error('Erro ao confirmar código:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Código inválido');
      } else if (error.response?.status === 404) {
        throw new Error('Pedido não encontrado');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Erro ao confirmar código de entrega');
    }
  }

  // Verificar status da conexão
  async checkConnection(): Promise<boolean> {
    try {
      await this.ensureValidToken();
      return true;
    } catch (error) {
      console.error('Erro na conexão com iFood:', error);
      return false;
    }
  }

  // Obter informações do token
  getTokenInfo(): { hasToken: boolean; expiresAt: Date | null } {
    return {
      hasToken: !!this.accessToken,
      expiresAt: this.tokenExpiry
    };
  }
}

// Instância singleton
export const ifoodApi = new IFoodApiService();
export default ifoodApi;

