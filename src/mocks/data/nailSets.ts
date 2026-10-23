import type { INailSet } from '../../shared/api/types';
import { nailByCode } from './nails';

// 샘플 네일 세트 24개 (스타일별 8개). 손가락 순서: 엄지·검지·중지·약지·소지.
// O=원컬러 F=프렌치 G=그라데이션 A=아트
const SETS: Record<string, string[][]> = {
  SIMPLE: [
    ['O:pink', 'O:pink', 'O:pink', 'O:pink', 'O:pink'],
    ['O:beige', 'O:beige', 'O:beige', 'F:white', 'O:beige'],
    ['F:white', 'F:white', 'F:white', 'F:white', 'F:white'],
    ['O:silver', 'G:silver', 'O:silver', 'G:silver', 'O:silver'],
    ['O:blue', 'F:blue', 'O:blue', 'F:blue', 'O:blue'],
    ['O:black', 'O:black', 'O:black', 'O:white', 'O:black'],
    ['G:beige', 'G:beige', 'G:beige', 'G:beige', 'G:beige'],
    ['O:green', 'G:green', 'O:green', 'G:green', 'O:green'],
  ],
  TREND: [
    ['O:pink', 'A:pink', 'O:pink', 'A:pink', 'O:pink'],
    ['O:black', 'A:black', 'O:silver', 'A:black', 'O:black'],
    ['G:blue', 'A:blue', 'G:blue', 'A:blue', 'G:blue'],
    ['O:yellow', 'A:yellow', 'O:white', 'A:yellow', 'O:yellow'],
    ['F:green', 'A:green', 'F:green', 'A:green', 'F:green'],
    ['G:silver', 'A:silver', 'O:black', 'A:silver', 'G:silver'],
    ['G:pink', 'A:white', 'G:pink', 'A:pink', 'G:pink'],
    ['F:beige', 'A:beige', 'F:beige', 'A:beige', 'F:beige'],
  ],
  WEDDING: [
    ['F:white', 'F:white', 'F:white', 'A:white', 'F:white'],
    ['F:pink', 'F:pink', 'F:pink', 'F:pink', 'F:pink'],
    ['F:beige', 'A:beige', 'F:beige', 'A:beige', 'F:beige'],
    ['O:white', 'G:white', 'O:white', 'G:white', 'O:white'],
    ['F:silver', 'A:silver', 'F:silver', 'A:silver', 'F:silver'],
    ['G:white', 'A:white', 'G:white', 'A:white', 'G:white'],
    ['G:pink', 'F:white', 'G:pink', 'F:white', 'G:pink'],
    ['G:beige', 'A:white', 'G:beige', 'A:white', 'G:beige'],
  ],
};

const nailSets: INailSet[] = [];
Object.entries(SETS).forEach(([style, sets]) => {
  sets.forEach(codes => {
    const [thumb, index, middle, ring, pinky] = codes.map(nailByCode);
    nailSets.push({
      id: nailSets.length + 1,
      thumb,
      index,
      middle,
      ring,
      pinky,
      style: [style],
    });
  });
});

export default nailSets;
