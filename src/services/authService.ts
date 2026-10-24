/**
 * RepoStock Pro - Servicio de Autenticación Frontend
 * Gestiona el inicio y cierre de sesión comunicándose con el backend PHP / MySQL.
 */

export interface AuthUser {
  id: number;
  username: string;
  nombreCompleto: string;
  email: string | null;
  rol: 'ADMIN' | 'SUPERVISOR' | 'REPOSITOR' | string;
  idRepositor?: number | null;
}

export interface LoginResult {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
}

interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  token?: string;
  user?: T;
}

const STORAGE_KEY_USER = 'repostock_auth_user';
const STORAGE_KEY_TOKEN = 'repostock_auth_token';

function getCandidateEndpoints(): string[] {
  const candidates: string[] = [];

  // 1. Si está en Apache bajo /RepoStock/
  if (typeof window !== 'undefined' && window.location.pathname.includes('/RepoStock')) {
    candidates.push('/RepoStock/backend-php/api/login.php');
  }

  // 2. Si está en Vite dev server (con proxy configurado en vite.config.ts)
  candidates.push('/backend-php/api/login.php');

  // 3. Resolución relativa
  try {
    candidates.push(new URL('../backend-php/api/login.php', document.baseURI).toString());
    candidates.push(new URL('backend-php/api/login.php', document.baseURI).toString());
  } catch {
    // Ignore URL resolution errors
  }

  // 4. Ruta absoluta directa por defecto en Apache XAMPP
  candidates.push('http://localhost/RepoStock/backend-php/api/login.php');

  return Array.from(new Set(candidates));
}

export const AuthService = {
  /**
   * Intenta iniciar sesión contra el endpoint PHP con hash BCRYPT en MySQL
   */
  async login(username: string, password: string): Promise<LoginResult> {
    const endpoints = getCandidateEndpoints();
    let lastError = 'No se pudo conectar con el servidor de autenticación.';

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const text = await response.text();
        let payload: ApiResponse<AuthUser>;
        try {
          payload = text ? JSON.parse(text) : { status: 'error', message: 'Respuesta vacía' };
        } catch {
          lastError = `Respuesta inválida del servidor (HTTP ${response.status}).`;
          continue;
        }

        if (response.ok && payload.status === 'success' && payload.user) {
          const user: AuthUser = payload.user;
          const token = payload.token || '';

          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
          if (token) {
            localStorage.setItem(STORAGE_KEY_TOKEN, token);
          }

          return {
            success: true,
            message: payload.message || 'Inicio de sesión exitoso',
            user,
            token,
          };
        }

        if (payload.message) {
          return {
            success: false,
            message: payload.message,
          };
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    return {
      success: false,
      message: lastError,
    };
  },

  /**
   * Cierra la sesión activa y elimina datos de almacenamiento local
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  },

  /**
   * Obtiene el usuario autenticado actualmente almacenado
   */
  getCurrentUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER);
      return data ? (JSON.parse(data) as AuthUser) : null;
    } catch {
      return null;
    }
  },

  /**
   * Obtiene el token de autenticación
   */
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  },

  /**
   * Verifica si existe una sesión activa
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },
};
