// 원본 src/entities/*/api.ts 의 함수 이름·엔드포인트를 그대로 따른다.
import fetcher from './fetcher';
import type {
  ApiResponse,
  IBanner,
  NailSetSummary,
  NailTipItem,
  PaginatedResponse,
  SelectedNailSet,
  StyleGroup,
} from './types';

export const fetchUserProfile = () =>
  fetcher<ApiResponse<{ nickname: string }>>({ endpoint: '/users/me' });

export const fetchHomeBanners = () =>
  fetcher<ApiResponse<IBanner[]>>({ endpoint: '/banners/home' });

export const fetchRecommendedNailSets = (limit = 10) =>
  fetcher<ApiResponse<StyleGroup[]>>({
    endpoint: '/nail-sets/recommendations',
    query: { limit },
  });

export const fetchNailSetFeed = (styleId: number, page = 0, size = 10) =>
  fetcher<ApiResponse<PaginatedResponse<NailSetSummary>>>({
    endpoint: '/nail-sets/feed',
    query: { style: styleId, page, size },
  });

export const fetchNailSetDetail = (nailSetId: number) =>
  fetcher<ApiResponse<NailSetSummary>>({ endpoint: `/nail-sets/${nailSetId}` });

export const fetchSimilarNailSets = (nailSetId: number, styleId: number, page = 0, size = 10) =>
  fetcher<ApiResponse<PaginatedResponse<NailSetSummary>>>({
    endpoint: `/nail-sets/${nailSetId}/similar`,
    query: { style: styleId, page, size },
  });

export const fetchUserNailSets = (page = 0, size = 10) =>
  fetcher<ApiResponse<PaginatedResponse<NailSetSummary>>>({
    endpoint: '/users/me/nail-sets',
    query: { page, size },
  });

export const saveUserNailSet = (nailSetId: number) =>
  fetcher<ApiResponse<NailSetSummary>>({
    endpoint: '/users/me/nail-sets/save',
    method: 'POST',
    body: { nailSetId },
  });

export const createUserNailSet = (set: Required<SelectedNailSet>) =>
  fetcher<ApiResponse<NailSetSummary>>({
    endpoint: '/users/me/nail-sets',
    method: 'POST',
    body: {
      thumb: { id: set.thumb.id },
      index: { id: set.index.id },
      middle: { id: set.middle.id },
      ring: { id: set.ring.id },
      pinky: { id: set.pinky.id },
    },
  });

export const deleteUserNailSet = (nailSetId: number) =>
  fetcher<ApiResponse<null>>({
    endpoint: `/users/me/nail-sets/${nailSetId}`,
    method: 'DELETE',
  });

export const fetchNails = (params: {
  page: number;
  size: number;
  category?: string;
  color?: string;
  shape?: string;
  random?: number;
}) =>
  fetcher<ApiResponse<PaginatedResponse<NailTipItem>>>({
    endpoint: '/nails',
    query: params,
  });
