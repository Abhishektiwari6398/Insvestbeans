/**
 * useSubscription.ts
 *
 * Hook jo backend /subscriptions/my se subscription status fetch karta hai.
 * AuthContext mein subscription nahi hai — yeh hook woh gap fill karta hai.
 *
 * Usage:
 *   const { isSubscriber, loading: subLoading } = useSubscription();
 *
 * Place this file at: src/hooks/useSubscription.ts
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/controllers/AuthContext';
import api from '@/api/axios';

interface SubscriptionState {
  isSubscriber: boolean;
  plan: string | null;
  loading: boolean;
}

// Module-level cache taaki ek hi session mein baar baar API call na ho
let _cache: { isSubscriber: boolean; plan: string | null } | null = null;
let _fetchPromise: Promise<{ isSubscriber: boolean; plan: string | null }> | null = null;

export function useSubscription(): SubscriptionState {
  const { user, isAdmin } = useAuth();

  const [state, setState] = useState<SubscriptionState>({
    isSubscriber: isAdmin, // admin ko turant true
    plan: null,
    loading: !isAdmin && !!user, // admin/guest ke liye loading nahi
  });

  const fetchSub = useCallback(async () => {
    // Admin — koi fetch nahi
    if (isAdmin) {
      setState({ isSubscriber: true, plan: 'admin', loading: false });
      return;
    }

    // Guest — koi fetch nahi
    if (!user) {
      setState({ isSubscriber: false, plan: null, loading: false });
      _cache = null;
      return;
    }

    // Cache hit
    if (_cache !== null) {
      setState({ ..._cache, loading: false });
      return;
    }

    // Agar pehle se fetch chal rahi hai to uska wait karo
    if (_fetchPromise) {
      const result = await _fetchPromise;
      setState({ ...result, loading: false });
      return;
    }

    // Nayi fetch
    _fetchPromise = api
      .get('/subscriptions/my')
      .then(({ data }) => {
        const subs: any[] = data.subscriptions || [];
        const activeSub = subs.find((s) => s.status === 'active');
        const result = {
          isSubscriber: !!activeSub,
          plan: activeSub?.plan ?? null,
        };
        _cache = result;
        return result;
      })
      .catch(() => ({ isSubscriber: false, plan: null }))
      .finally(() => {
        _fetchPromise = null;
      });

    const result = await _fetchPromise;
    setState({ ...result, loading: false });
  }, [user, isAdmin]);

  useEffect(() => {
    fetchSub();
  }, [fetchSub]);

  // User logout pe cache clear karo
  useEffect(() => {
    if (!user) {
      _cache = null;
    }
  }, [user]);

  return state;
}

// Cache manually clear karna ho to (e.g. payment success ke baad)
export function clearSubscriptionCache() {
  _cache = null;
}