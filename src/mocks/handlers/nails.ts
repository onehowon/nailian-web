// 원본 src/mocks/handlers/nails.ts 의 엔드포인트·필터·응답 형태를 옮긴 핸들러.
// (토큰 검증은 로그인이 없는 체험판이라 생략)
import type { MockHandler } from '../server';
import type { INail, INailSet } from '../../shared/api/types';
import nails from '../data/nails';
import nailSets from '../data/nailSets';
import { STYLE_KEYS, STYLE_NAMES } from '../data/styles';
import createPaginatedResponse from '../utils/pagination';
import { createErrorResponse, createSuccessResponse } from '../utils/response';
import {
  addUserNailSet,
  allNailSets,
  findStored,
  removeUserNailSet,
  userNailSets,
} from '../store';

// 원본 응답은 손가락별 { imageUrl } 이다. 체험판은 '손에 올려보기'를 위해 id·shape 를 덧붙인다.
const tip = (n: INail) => ({ imageUrl: n.imageUrl, id: n.id, shape: n.shape });
const summary = (s: INailSet) => ({
  id: s.id,
  thumb: tip(s.thumb),
  index: tip(s.index),
  middle: tip(s.middle),
  ring: tip(s.ring),
  pinky: tip(s.pinky),
});

const num = (v: string | null, d: number) => (v === null || v === '' ? d : Number(v));

// 페이지 로드마다 한 번 섞어 두는 '랜덤' 정렬 (필터가 없을 때 원본도 random=1 로 요청)
const shuffled = (() => {
  const arr = [...nails];
  let seed = Date.now() % 2147483647;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
})();

export const nailHandlers: MockHandler[] = [
  /** GET /nails — 네일팁 목록 (색상·모양·카테고리 필터 + 페이지네이션) */
  {
    method: 'GET',
    path: '/nails',
    resolver: ({ url }) => {
      const q = url.searchParams;
      const color = q.get('color');
      const shape = q.get('shape');
      const category = q.get('category');
      let list = q.get('random') === '1' ? [...shuffled] : [...nails];
      if (color) list = list.filter(n => n.color.toLowerCase() === color.toLowerCase());
      if (shape) list = list.filter(n => n.shape.toLowerCase() === shape.toLowerCase());
      if (category)
        list = list.filter(n => n.category.toLowerCase() === category.toLowerCase());
      const simplified = list.map(({ id, imageUrl, shape: s }) => ({ id, imageUrl, shape: s }));
      return createSuccessResponse(
        createPaginatedResponse(simplified, num(q.get('page'), 0), num(q.get('size'), 10)),
        '네일 목록 조회 성공',
      );
    },
  },

  /** GET /nail-sets/recommendations — 스타일별 추천 네일 세트 */
  {
    method: 'GET',
    path: '/nail-sets/recommendations',
    resolver: ({ url }) => {
      const limit = num(url.searchParams.get('limit'), 10);
      const data = STYLE_KEYS.map((key, id) => ({
        style: { id, name: STYLE_NAMES[key] },
        nailSets: nailSets
          .filter(s => s.style.includes(key) && !s.user)
          .slice(0, limit)
          .map(summary),
      }));
      return createSuccessResponse(data, '추천 네일 세트 조회 성공');
    },
  },

  /** GET /nail-sets/feed?style= — 특정 스타일 피드 */
  {
    method: 'GET',
    path: '/nail-sets/feed',
    resolver: ({ url }) => {
      const q = url.searchParams;
      const styleId = Number(q.get('style'));
      if (Number.isNaN(styleId)) return createErrorResponse('올바른 스타일 ID를 지정해야 합니다.', 400);
      const key = STYLE_KEYS[styleId];
      if (!key) return createErrorResponse('존재하지 않는 스타일입니다.', 404);
      const list = nailSets.filter(s => s.style.includes(key) && !s.user).map(summary);
      return createSuccessResponse(
        createPaginatedResponse(list, num(q.get('page'), 0), num(q.get('size'), 9)),
        '네일 세트 피드 조회 성공',
      );
    },
  },

  /** GET /nail-sets/:nailSetId — 상세 */
  {
    method: 'GET',
    path: '/nail-sets/:nailSetId',
    resolver: ({ params }) => {
      const set = allNailSets().find(s => String(s.id) === params.nailSetId);
      if (!set) return createErrorResponse('해당 네일 세트를 찾을 수 없습니다.', 404);
      return createSuccessResponse(summary(set), '네일 세트 조회 성공');
    },
  },

  /** GET /nail-sets/:nailSetId/similar?style= — 비슷한 세트 */
  {
    method: 'GET',
    path: '/nail-sets/:nailSetId/similar',
    resolver: ({ params, url }) => {
      const q = url.searchParams;
      const styleId = Number(q.get('style'));
      const key = STYLE_KEYS[styleId];
      if (!key) return createErrorResponse('존재하지 않는 스타일입니다.', 404);
      const list = nailSets
        .filter(s => s.style.includes(key) && String(s.id) !== params.nailSetId && !s.user)
        .map(summary);
      return createSuccessResponse(
        createPaginatedResponse(list, num(q.get('page'), 0), num(q.get('size'), 9)),
        '유사한 네일 세트 조회 성공',
      );
    },
  },

  /** GET /users/me/nail-sets — 내 보관함 */
  {
    method: 'GET',
    path: '/users/me/nail-sets',
    resolver: ({ url }) => {
      const q = url.searchParams;
      return createSuccessResponse(
        createPaginatedResponse(userNailSets().map(summary), num(q.get('page'), 0), num(q.get('size'), 10)),
        '사용자의 네일 세트 조회 성공',
      );
    },
  },

  /** POST /users/me/nail-sets — 직접 조합한 세트를 보관함에 저장 */
  {
    method: 'POST',
    path: '/users/me/nail-sets',
    resolver: ({ body }) => {
      const b = body as Record<string, { id: number } | undefined>;
      const fingers = ['thumb', 'index', 'middle', 'ring', 'pinky'];
      if (!b || fingers.some(f => !b[f]))
        return createErrorResponse('모든 손가락에 대한 네일 정보를 제공해야 합니다.', 400);
      const ids = fingers.map(f => b[f]!.id);
      if (ids.some(id => !nails.find(n => n.id === id)))
        return createErrorResponse('유효하지 않은 네일 ID가 포함되어 있습니다.', 400);
      if (findStored(s => s.nails.join() === ids.join()))
        return createErrorResponse('이미 저장된 아트입니다.', 409);
      const created = addUserNailSet(ids);
      return createSuccessResponse(summary(created), '네일 세트가 성공적으로 생성되었습니다.', 201);
    },
  },

  /** POST /users/me/nail-sets/save — 기존 세트를 보관함에 저장 */
  {
    method: 'POST',
    path: '/users/me/nail-sets/save',
    resolver: ({ body }) => {
      const { nailSetId } = (body ?? {}) as { nailSetId?: number };
      const set = nailSets.find(s => s.id === nailSetId);
      if (!set) return createErrorResponse('해당 네일 세트를 찾을 수 없습니다.', 404);
      if (findStored(s => s.sourceId === set.id))
        return createErrorResponse('이미 저장된 네일입니다.', 409);
      const ids = [set.thumb, set.index, set.middle, set.ring, set.pinky].map(n => n.id);
      const saved = addUserNailSet(ids, set.id);
      return createSuccessResponse(summary(saved), '보관함 저장 성공');
    },
  },

  /** DELETE /users/me/nail-sets/:nailSetId — 보관함에서 삭제 */
  {
    method: 'DELETE',
    path: '/users/me/nail-sets/:nailSetId',
    resolver: ({ params }) => {
      if (!removeUserNailSet(Number(params.nailSetId)))
        return createErrorResponse('해당 네일 세트를 찾을 수 없습니다.', 404);
      return createSuccessResponse(null, '삭제 성공');
    },
  },
];
