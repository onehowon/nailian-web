import nails from './data/nails';
import nailSets from './data/nailSets';
import users from './data/users';
import type { INailSet } from '../shared/api/types';

// 사용자 보관함(저장·직접 만든 세트)은 이 브라우저에만 남긴다. 저장소를 못 쓰면 메모리로만 동작.
const KEY = 'nailian-web:user-nail-sets';

type Stored = { id: number; nails: number[]; sourceId?: number };

function load(): Stored[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored[]) : [];
  } catch {
    return [];
  }
}

let stored = load();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    /* 저장 실패 시 메모리만 사용 */
  }
}

const byId = (id: number) => nails.find(n => n.id === id)!;

export function userNailSets(): INailSet[] {
  return stored.map(s => {
    const [thumb, index, middle, ring, pinky] = s.nails.map(byId);
    return { id: s.id, user: users[0], thumb, index, middle, ring, pinky, style: [] };
  });
}

export function allNailSets(): INailSet[] {
  return [...nailSets, ...userNailSets()];
}

export function addUserNailSet(nailIds: number[], sourceId?: number): INailSet {
  const id = Math.max(1000, ...stored.map(s => s.id)) + 1;
  stored = [{ id, nails: nailIds, sourceId }, ...stored];
  persist();
  return userNailSets().find(s => s.id === id)!;
}

export function findStored(pred: (s: Stored) => boolean) {
  return stored.find(pred);
}

export function removeUserNailSet(id: number): boolean {
  const before = stored.length;
  stored = stored.filter(s => s.id !== id);
  persist();
  return stored.length !== before;
}
