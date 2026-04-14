import { useState, useEffect, useCallback } from 'react';

export function useApi(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback((silent) => {
    if (!silent) setLoading(true);
    return window.api.invoke(`/api${endpoint}`)
      .then(d => { setData(d); setLoading(false); return d; })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [endpoint]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
