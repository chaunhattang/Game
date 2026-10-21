import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
const Auth = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get('/auth/me')
      .then((r) => setUser(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return <Auth.Provider value={{ user, setUser, loading }}>{children}</Auth.Provider>;
}
export const useAuth = () => useContext(Auth);
