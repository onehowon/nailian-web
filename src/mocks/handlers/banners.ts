import type { MockHandler } from '../server';
import banners from '../data/banners';
import { createErrorResponse, createSuccessResponse } from '../utils/response';

export const bannerHandlers: MockHandler[] = [
  /** GET /banners/home — 홈 배너 조회 */
  {
    method: 'GET',
    path: '/banners/home',
    resolver: () => {
      if (!banners.length) return createErrorResponse('배너 데이터를 찾을 수 없습니다.', 404);
      return createSuccessResponse(banners, '홈 배너 조회 성공');
    },
  },
];
