import catalog from './catalog.json';
import type { Category, Color, INail, Shape } from '../../shared/api/types';

// 샘플 네일팁 32종 = 카테고리 4 × 색상 8. 모양은 카테고리·색상마다 돌려 가며 배정한다.
// 이미지(public/sample/nails)는 scripts/generate-sample-tips.mjs 가 같은 규칙으로 만든다.
const base = import.meta.env.BASE_URL;

export const fileNameOf = (category: Category, color: Color) =>
  `${category.toLowerCase().replace('_', '')}-${color.toLowerCase()}.png`;

const nails: INail[] = [];
(catalog.categories as Category[]).forEach((category, ci) => {
  (catalog.colors as Color[]).forEach((color, ki) => {
    nails.push({
      id: ci * catalog.colors.length + ki + 1,
      category,
      color,
      shape: catalog.shapes[(ci * 3 + ki) % catalog.shapes.length] as Shape,
      imageUrl: `${base}sample/nails/${fileNameOf(category, color)}`,
    });
  });
});

const CATEGORY_CODE: Record<string, Category> = {
  O: 'ONE_COLOR',
  F: 'FRENCH',
  G: 'GRADIENT',
  A: 'ART',
};

/** 'A:pink' → 아트·핑크 네일팁 */
export function nailByCode(code: string): INail {
  const [c, color] = code.split(':');
  const found = nails.find(
    n => n.category === CATEGORY_CODE[c] && n.color === color.toUpperCase(),
  );
  if (!found) throw new Error(`unknown nail code ${code}`);
  return found;
}

export default nails;
