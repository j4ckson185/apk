import { firebaseAuth } from '../../config/firebase';
import { EMAIL_TO_DELIVERY_ID, AUTHORIZED_EMAILS } from '../../config/app';
import { User } from '../../types';

export class AuthService {
  // Fazer login com email e senha
  static async signIn(email: string, password: string): Promise<User> {
    try {
      // Verificar se o email está autorizado
      if (!AUTHORIZED_EMAILS.includes(email)) {
        throw new Error('Usuário não autorizado para este aplicativo');
      }

      // Fazer login no Firebase
      const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
      
      if (!userCredential.user) {
        throw new Error('Erro ao fazer login');
      }

      // Obter o deliveryId correspondente
      const deliveryId = EMAIL_TO_DELIVERY_ID[email];
      
      if (!deliveryId) {
        throw new Error('Usuário não encontrado no sistema');
      }

      const user: User = {
        email: userCredential.user.email!,
        deliveryId,
        uid: userCredential.user.uid
      };

      return user;
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw new Error(error.message || 'Erro ao fazer login');
    }
  }

  // Fazer logout
  static async signOut(): Promise<void> {
    try {
      await firebaseAuth.signOut();
    } catch (error: any) {
      console.error('Erro no logout:', error);
      throw new Error('Erro ao fazer logout');
    }
  }

  // Obter usuário atual
  static getCurrentUser(): User | null {
    const currentUser = firebaseAuth.currentUser;
    
    if (!currentUser || !currentUser.email) {
      return null;
    }

    const deliveryId = EMAIL_TO_DELIVERY_ID[currentUser.email];
    
    if (!deliveryId) {
      return null;
    }

    return {
      email: currentUser.email,
      deliveryId,
      uid: currentUser.uid
    };
  }

  // Verificar se o usuário está logado
  static isAuthenticated(): boolean {
    return firebaseAuth.currentUser !== null;
  }

  // Listener para mudanças no estado de autenticação
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return firebaseAuth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const deliveryId = EMAIL_TO_DELIVERY_ID[firebaseUser.email];
        
        if (deliveryId) {
          const user: User = {
            email: firebaseUser.email,
            deliveryId,
            uid: firebaseUser.uid
          };
          callback(user);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
}

