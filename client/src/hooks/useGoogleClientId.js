import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';

const STORAGE_KEY = 'google_client_id';

const getInitialClientId = () => {
  const fromEnv = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  if (fromEnv) {
    return fromEnv.trim();
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored ? stored.trim() : '';
};

export const useGoogleClientId = () => {
  const [clientId, setClientId] = useState(() => {
    try {
      return getInitialClientId();
    } catch (error) {
      return '';
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (clientId) {
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    axiosInstance
      .get('users/google-config/')
      .then((response) => {
        if (!active) {
          return;
        }
        const fetched = response?.data?.client_id;
        if (fetched && typeof fetched === 'string') {
          const trimmed = fetched.trim();
          if (trimmed) {
            setClientId(trimmed);
            window.localStorage.setItem(STORAGE_KEY, trimmed);
          }
        }
      })
      .catch(() => {
        if (active) {
          setError('Unable to load Google configuration automatically.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [clientId]);

  const updateClientId = useCallback(async (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      setError('A Google OAuth Client ID is required.');
      return '';
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('users/google-config/', { client_id: trimmed });
      const saved = (response?.data?.client_id || '').trim() || trimmed;
      setClientId(saved);
      window.localStorage.setItem(STORAGE_KEY, saved);
      return saved;
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Unable to store Google Client ID. Try again later.';
      setError(detail);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { clientId, updateClientId, loading, error };
};

export default useGoogleClientId;
