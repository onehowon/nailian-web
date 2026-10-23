// 원본 src/shared/api/types.ts · src/mocks/data/types.ts 의 구조를 그대로 옮겼다.

export type Category = 'ONE_COLOR' | 'FRENCH' | 'GRADIENT' | 'ART';
export type Color =
  | 'WHITE'
  | 'BLACK'
  | 'BEIGE'
  | 'PINK'
  | 'YELLOW'
  | 'GREEN'
  | 'BLUE'
  | 'SILVER';
export type Shape = 'SQUARE' | 'ROUND' | 'ALMOND' | 'BALLERINA' | 'STILETTO';

export interface INail {
  id: number;
  imageUrl: string;
  category: Category;
  color: Color;
  shape: Shape;
}

export interface IUser {
  id: number;
  nickname?: string;
  onboardingProgress: number;
}

export interface INailSet {
  id: number;
  user?: IUser;
  thumb: INail;
  index: INail;
  middle: INail;
  ring: INail;
  pinky: INail;
  style: string[];
}

export interface IBanner {
  id: number;
  imageUrl: string;
  link: string;
}

/** 공통 API 응답 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

/** 페이지네이션 응답 */
export interface PaginatedResponse<T> {
  pageInfo: {
    currentPage: number;
    totalElements: number;
    totalPages: number;
  };
  content: T[];
}

export type FingerType = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';

/** 화면에서 쓰는 네일 세트 (손가락별 이미지 URL만) */
/** 손가락 하나의 팁. 원본 응답은 imageUrl 만 주며, 체험판은 미리 보기용으로 id·shape 를 덧붙인다. */
export interface FingerTip {
  imageUrl: string;
  id?: number;
  shape?: Shape;
}

export interface NailSetSummary {
  id: number;
  thumb: FingerTip;
  index: FingerTip;
  middle: FingerTip;
  ring: FingerTip;
  pinky: FingerTip;
}

export interface NailTipItem {
  id: number;
  imageUrl: string;
  shape: Shape;
}

export interface StyleGroup {
  style: { id: number; name: string };
  nailSets: NailSetSummary[];
}

/** AR 체험 화면에서 고른 손가락별 네일팁 */
export type SelectedNailSet = Partial<Record<FingerType, NailTipItem>>;

export class APIError extends Error {
  constructor(
    message: string,
    public code: number,
  ) {
    super(message);
  }
}
