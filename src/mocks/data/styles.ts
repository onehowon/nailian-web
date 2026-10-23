// 원본 msw 핸들러의 styleMap (0: SIMPLE, 1: TREND, 2: WEDDING) 과 같은 순서.
export const STYLE_KEYS = ['SIMPLE', 'TREND', 'WEDDING'] as const;
export const STYLE_NAMES: Record<(typeof STYLE_KEYS)[number], string> = {
  SIMPLE: '심플',
  TREND: '트렌드',
  WEDDING: '웨딩',
};
