import { useEffect, useState, useCallback } from 'react';
import { api, errorMessage } from '../services/api';
export function useData(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [key, setKey] = useState(0);
  const retry = useCallback(() => setKey((k) => k + 1), []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api
      .get(path)
      .then((r) => {
        if (alive) setData(r.data.data);
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [path, key]);
  return { data, error, loading, retry };
}
