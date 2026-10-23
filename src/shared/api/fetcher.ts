// 원본 src/shared/api/fetcher.ts 와 같은 호출 방식({ endpoint, method, query, body }).
// 차이: 실제 네트워크 대신 브라우저 안의 가상 API(mockFetch)로 보낸다.
import { API_BASE_URL, mockFetch } from '../../mocks/server';
import { APIError } from './types';

type Query = Record<string, string | number | undefined>;

export default async function fetcher<T>({
  endpoint,
  method = 'GET',
  query,
  body,
}: {
  endpoint: string;
  method?: 'GET' | 'POST' | 'DELETE';
  query?: Query;
  body?: unknown;
}): Promise<T> {
  let url = `${API_BASE_URL}${endpoint}`;
  if (query) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => v !== undefined && qs.append(k, String(v)));
    url += `?${qs.toString()}`;
  }
  const res = await mockFetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (data.code < 200 || data.code >= 300) {
    throw new APIError(data.message || 'API 요청 실패', data.code);
  }
  return data as T;
}
