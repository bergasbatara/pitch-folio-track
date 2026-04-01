import { useCallback, useMemo, useState } from 'react';

type OptimisticAction = {
  apply: () => void;
  rollback?: () => void;
};

export function useAsyncStatus() {
  const [loadCount, setLoadCount] = useState(0);
  const [mutateCount, setMutateCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isLoading = useMemo(() => loadCount > 0, [loadCount]);
  const isMutating = useMemo(() => mutateCount > 0, [mutateCount]);

  const runLoad = useCallback(async <T,>(fn: () => Promise<T>) => {
    setLoadCount((count) => count + 1);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      throw err;
    } finally {
      setLoadCount((count) => Math.max(0, count - 1));
    }
  }, []);

  const runMutate = useCallback(async <T,>(fn: () => Promise<T>, optimistic?: OptimisticAction) => {
    setMutateCount((count) => count + 1);
    setError(null);
    optimistic?.apply();
    try {
      return await fn();
    } catch (err) {
      optimistic?.rollback?.();
      setError(err instanceof Error ? err.message : 'Request failed');
      throw err;
    } finally {
      setMutateCount((count) => Math.max(0, count - 1));
    }
  }, []);

  return {
    isLoading,
    isMutating,
    error,
    setError,
    runLoad,
    runMutate,
  };
}
