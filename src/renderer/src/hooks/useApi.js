import { useState, useEffect, useCallback } from 'react';

const DEFAULT_POLL_MS = 30000;

export function useApi(endpoint, options = {}) {
  const { intervalMs = DEFAULT_POLL_MS, refetchOnFocus = true } = options;
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

  useEffect(() => {
    if (!intervalMs) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refetch(true);
    }, intervalMs);
    return () => clearInterval(id);
  }, [refetch, intervalMs]);

  useEffect(() => {
    if (!refetchOnFocus) return;
    const onFocus = () => refetch(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch, refetchOnFocus]);

  return { data, loading, error, refetch };
}
