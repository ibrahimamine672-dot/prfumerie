import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

function loadUser() {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      return { token, user: JSON.parse(user) };
    }
  } catch {}
  return { token: null, user: null };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadUser);

  const login = useCallback((token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuth({ token, user });
  }, []);

  const updateUser = useCallback((updates) => {
    setAuth(prev => {
      const updatedUser = { ...prev.user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { ...prev, user: updatedUser };
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({ token: null, user: null });
  }, []);

  const isAdmin = auth.user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ ...auth, isAdmin, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
