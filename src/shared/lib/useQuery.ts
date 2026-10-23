import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiResponse, PaginatedResponse } from '../api/types';

/** react-query 대신 쓰는 아주 작은 조회 훅 */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fn()
      .then(d => alive && setData(d))
      .catch(e => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const refetch = useCallback(() => setTick(t => t + 1), []);
  return { data, error, loading, refetch };
}

/** useInfiniteQuery 흉내: 0부터 시작하는 page 로 다음 페이지를 이어 붙인다 */
export function useInfinite<T>(
  fetchPage: (page: number) => Promise<ApiResponse<PaginatedResponse<T>>>,
  deps: unknown[],
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingNext, setFetchingNext] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const next = useRef<number | undefined>(0);
  const gen = useRef(0);

  const load = useCallback(async (page: number, reset: boolean) => {
    const g = gen.current;
    try {
      const res = await fetchPage(page);
      if (g !== gen.current) return;
      const info = res.data!.pageInfo;
      setItems(prev => (reset ? res.data!.content : [...prev, ...res.data!.content]));
      next.current = info.currentPage < info.totalPages - 1 ? info.currentPage + 1 : undefined;
    } catch (e) {
      if (g === gen.current) setError(e as Error);
    } finally {
      if (g === gen.current) {
        setLoading(false);
        setFetchingNext(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    gen.current += 1;
    next.current = 0;
    setItems([]);
    setError(null);
    setLoading(true);
    load(0, true);
  }, [load]);

  const fetchNextPage = useCallback(() => {
    if (next.current === undefined || fetchingNext || loading) return;
    setFetchingNext(true);
    load(next.current, false);
  }, [fetchingNext, loading, load]);

  return { items, loading, fetchingNext, error, fetchNextPage, hasNextPage: next.current !== undefined };
}
