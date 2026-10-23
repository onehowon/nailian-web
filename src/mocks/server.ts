// 가상 API 서버
//
// 원본 앱은 개발 중 msw(src/mocks/handlers) 로 API 를 흉내 냈다. 운영 서버가 종료돼
// 체험판은 같은 엔드포인트·같은 응답 구조를 가진 핸들러를 브라우저 안에서 직접 돌린다.
// fetcher 가 네트워크 대신 mockFetch 를 호출하며, 실제 HTTP 요청은 나가지 않는다.
import { nailHandlers } from './handlers/nails';
import { bannerHandlers } from './handlers/banners';
import { userHandlers } from './handlers/users';
import { createErrorResponse } from './utils/response';

export const API_BASE_URL = 'https://api.nailian.mock';

export interface MockRequest {
  method: string;
  url: URL;
  params: Record<string, string>;
  body: unknown;
}

export interface MockHandler {
  method: 'GET' | 'POST' | 'DELETE';
  path: string; // '/nail-sets/:nailSetId'
  resolver: (req: MockRequest) => Response | Promise<Response>;
}

const handlers: MockHandler[] = [...userHandlers, ...bannerHandlers, ...nailHandlers];

function match(path: string, pattern: string): Record<string, string> | null {
  const a = path.replace(/\/+$/, '').split('/');
  const b = pattern.split('/');
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < b.length; i++) {
    if (b[i].startsWith(':')) params[b[i].slice(1)] = decodeURIComponent(a[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function mockFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(input, API_BASE_URL);
  const method = (init.method || 'GET').toUpperCase();
  const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;

  // 네트워크 지연 흉내 (로딩 표시 확인용)
  await sleep(120 + Math.random() * 160);

  for (const h of handlers) {
    if (h.method !== method) continue;
    const params = match(url.pathname, h.path);
    if (params) {
      try {
        return await h.resolver({ method, url, params, body });
      } catch {
        return createErrorResponse('서버 오류가 발생했습니다.', 500);
      }
    }
  }
  return createErrorResponse(`가상 API에 없는 경로입니다: ${method} ${url.pathname}`, 404);
}
