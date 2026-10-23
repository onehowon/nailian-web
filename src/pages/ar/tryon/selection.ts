import type { SelectedNailSet } from '../../../shared/api/types';

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
