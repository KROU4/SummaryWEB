import { useCallback, useState } from 'react';
import { PASSWORD_HASH, isAuthenticated, setAuthenticated, sha256 } from '../lib/storage';

export function useAuth() {
  const [authenticated, setAuthState] = useState(() => isAuthenticated());
  const [error, setError] = useState('');

  const login = useCallback(async (password: string) => {
    if (!PASSWORD_HASH) {
      setError('Не настроен VITE_PASSWORD_SHA256.');
      return false;
    }

    const hash = await sha256(password);
    if (hash !== PASSWORD_HASH) {
      setError('Пароль не подошел.');
      return false;
    }

    setAuthenticated(true);
    setAuthState(true);
    setError('');
    return true;
  }, []);

  const logout = useCallback(() => {
    setAuthenticated(false);
    setAuthState(false);
  }, []);

  return { authenticated, error, login, logout };
}
