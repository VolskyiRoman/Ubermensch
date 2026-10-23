import { useFocusEffect } from 'expo-router';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

type QueryState<T> = { data: T | undefined; error: Error | undefined };

/** Bulk writes emit one change event per row; reload once they settle. */
const CHANGE_DEBOUNCE_MS = 50;

/**
 * Runs a loader and keeps its result fresh: reruns when the screen gains focus,
 * when any table changes, and when `deps` change.
 */
export function useDbQuery<T>(loader: () => T | Promise<T>, deps: unknown[]): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({ data: undefined, error: undefined });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useFocusEffect(reload);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = addDatabaseChangeListener(() => {
      clearTimeout(timer);
      timer = setTimeout(reload, CHANGE_DEBOUNCE_MS);
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(loader)
      .then(
        (data) => !cancelled && setState({ data, error: undefined }),
        (error: Error) => !cancelled && setState((prev) => ({ data: prev.data, error })),
      );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);

  return state;
}
