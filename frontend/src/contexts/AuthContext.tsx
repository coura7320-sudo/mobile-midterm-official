import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { User } from '../types';
import {
  authService,
  LoginPayload,
  RegisterPayload,
} from '../services/authService';
import { secureStorage } from '../utils/secureStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'RESTORE_SESSION'; payload: { user: User | null; token: string | null } }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: Boolean(action.payload.user && action.payload.token),
        isLoading: false,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    updates: Partial<Pick<User, 'fullName' | 'about' | 'avatarUrl'>>
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      try {
        const storedToken = await secureStorage.getToken();
        const storedUserRaw = await secureStorage.getUser();

        if (!storedToken) {
          if (isMounted) {
            dispatch({
              type: 'RESTORE_SESSION',
              payload: { user: null, token: null },
            });
          }
          return;
        }

        // Optimistically restore cached user if available, then verify with backend
        const cachedUser: User | null = storedUserRaw
          ? JSON.parse(storedUserRaw)
          : null;

        try {
          const { user } = await authService.getMe();
          await secureStorage.saveUser(JSON.stringify(user));
          if (isMounted) {
            dispatch({
              type: 'RESTORE_SESSION',
              payload: { user, token: storedToken },
            });
          }
        } catch (err: unknown) {
          // If backend returned 401, clear invalid token; if offline, fallback to cached user
          const status = (err as { status?: number })?.status;
          if (status === 401 || !cachedUser) {
            await secureStorage.removeToken();
            await secureStorage.removeUser();
            if (isMounted) {
              dispatch({
                type: 'RESTORE_SESSION',
                payload: { user: null, token: null },
              });
            }
          } else if (isMounted) {
            dispatch({
              type: 'RESTORE_SESSION',
              payload: { user: cachedUser, token: storedToken },
            });
          }
        }
      } catch {
        if (isMounted) {
          dispatch({
            type: 'RESTORE_SESSION',
            payload: { user: null, token: null },
          });
        }
      }
    }

    bootstrapSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    await secureStorage.saveToken(response.token);
    await secureStorage.saveUser(JSON.stringify(response.user));
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: { user: response.user, token: response.token },
    });
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    await secureStorage.saveToken(response.token);
    await secureStorage.saveUser(JSON.stringify(response.user));
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: { user: response.user, token: response.token },
    });
  }, []);

  const logout = useCallback(async () => {
    await secureStorage.removeToken();
    await secureStorage.removeUser();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<User, 'fullName' | 'about' | 'avatarUrl'>>) => {
      const { user } = await authService.updateProfile(updates);
      await secureStorage.saveUser(JSON.stringify(user));
      dispatch({ type: 'UPDATE_USER', payload: user });
    },
    []
  );

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      updateProfile,
    }),
    [state, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
