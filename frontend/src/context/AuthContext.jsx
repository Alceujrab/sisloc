import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

// Estado inicial
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
};

// Actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_ERROR: 'SET_ERROR',
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        loading: false,
      };
    
    default:
      return state;
  }
}

// Context
const AuthContext = createContext();

// Provider
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar token ao inicializar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data.data.user,
            token,
          },
        });
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    checkAuth();
  }, []);

  // Login
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await api.post('/auth/login', credentials);
      const { user, token } = response.data.data;

      // Salvar token
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });

      toast.success(`Bem-vindo(a), ${user.name}!`);
      return { success: true };

    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR });
      
      const message = error.response?.data?.message || 'Erro ao fazer login';
      toast.error(message);
      
      return { 
        success: false, 
        message 
      };
    }
  };

  // Registro
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data.data;

      // Salvar token
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });

      toast.success('Conta criada com sucesso!');
      return { success: true };

    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR });
      
      const message = error.response?.data?.message || 'Erro ao criar conta';
      toast.error(message);
      
      return { 
        success: false, 
        message,
        errors: error.response?.data?.errors 
      };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    toast.success('Logout realizado com sucesso');
  };

  // Recarregar dados do usuário (/auth/me)
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const updated = response.data?.data?.user;
      if (updated) {
        dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updated });
      }
      return { success: true, user: updated };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Não foi possível atualizar o usuário' };
    }
  };

  // Atualizar perfil
  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      const updatedUser = response.data.data.user;

      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: updatedUser,
      });

      toast.success('Perfil atualizado com sucesso!');
      return { success: true };

    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao atualizar perfil';
      toast.error(message);
      
      return { 
        success: false, 
        message,
        errors: error.response?.data?.errors 
      };
    }
  };

  // Alterar senha
  const changePassword = async (passwordData) => {
    try {
      await api.post('/auth/change-password', passwordData);
      toast.success('Senha alterada com sucesso!');
      return { success: true };

    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao alterar senha';
      toast.error(message);
      
      return { 
        success: false, 
        message,
        errors: error.response?.data?.errors 
      };
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
  refreshUser,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}
