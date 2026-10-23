import type { SelectedNailSet } from '../../../shared/api/types';
import { fetchNailSetDetail } from '../../../shared/api/endpoints';

// AR 체험 화면에서 고른 손가락별 팁을 '내 손에 올려보기' 화면으로 넘긴다.
// 새로고침해도 남도록 sessionStorage 에 두되, 막힌 환경이면 메모리 값만 쓴다.
const KEY = 'nailian:tryon-set';
let memory: SelectedNailSet | null = null;

export function saveTryOnSet(set: SelectedNailSet) {
  memory = set;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(set));
  } catch {
    /* 저장소를 못 쓰면 메모리 값만 쓴다 */
  }
}

export function loadTryOnSet(): SelectedNailSet | null {
  if (memory) return memory;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SelectedNailSet) : null;
  } catch {
    return null;
  }
}

/** 링크로 바로 들어와 고른 팁이 없을 때 채우는 기본 시안 (샘플 세트) */
export const DEFAULT_SET_ID = 9;

export async function fetchDefaultTryOnSet(): Promise<SelectedNailSet> {
  const d = (await fetchNailSetDetail(DEFAULT_SET_ID)).data!;
  const set: SelectedNailSet = {};
  (['thumb', 'index', 'middle', 'ring', 'pinky'] as const).forEach(f => {
    const t = d[f];
    if (t.id) set[f] = { id: t.id, imageUrl: t.imageUrl, shape: t.shape ?? 'ROUND' };
  });
  return set;
}
