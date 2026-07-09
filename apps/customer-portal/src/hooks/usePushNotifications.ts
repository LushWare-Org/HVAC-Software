import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
} from '../lib/push';
import { useAuth } from '../contexts/AuthContext';

export type PushState = 'unsupported' | 'default' | 'granted' | 'denied';

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<PushState>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    isPushSupported().then((ok) => {
      setSupported(ok);
      if (!ok) { setState('unsupported'); return; }
      setState((Notification.permission as PushState) ?? 'default');
    });
  }, []);

  // After login, check if already subscribed and re-register if needed
  useEffect(() => {
    if (!isAuthenticated || !supported) return;
    getPushSubscription().then((sub) => setSubscribed(!!sub));
  }, [isAuthenticated, supported]);

  const subscribe = useCallback(async () => {
    if (!supported || loading) return;
    setLoading(true);
    try {
      const sub = await subscribeToPush();
      if (sub) {
        setSubscribed(true);
        setState('granted');
      } else {
        setState((Notification.permission as PushState));
      }
    } catch (err) {
      console.error('[Push] Subscribe failed:', err);
    } finally {
      setLoading(false);
    }
  }, [supported, loading]);

  const unsubscribe = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
    } catch (err) {
      console.error('[Push] Unsubscribe failed:', err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return { supported, state, subscribed, loading, subscribe, unsubscribe };
}
