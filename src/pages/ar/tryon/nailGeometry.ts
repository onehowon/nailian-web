import type { FingerType, SelectedNailSet } from '../../../shared/api/types';

// 손 랜드마크 21점으로 손톱 위치·방향·크기를 근사한다.
// 원본 iOS 앱은 손톱 검출 + 분할 모델로 손톱 영역 자체를 찾았지만, 웹 체험판은 손가락 마디 위치만 쓰므로
// 손톱 모양·크기는 마디 간 거리로 추정한 값이다.

export type Pt = { x: number; y: number };

// [손가락 끝(TIP), 바로 아래 마디(DIP, 엄지는 IP)]
const FINGER_LM: Record<FingerType, [number, number]> = {
  thumb: [4, 3],
  index: [8, 7],
  middle: [12, 11],
  ring: [16, 15],
  pinky: [20, 19],
};
export const FINGERS: FingerType[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];

// 손톱 폭 / 손가락 간격(검지~소지 뿌리 마디 거리의 1/3) 비율
const WIDTH_K: Record<FingerType, number> = {
  thumb: 0.66,
  index: 0.7,
  middle: 0.72,
  ring: 0.66,
  pinky: 0.54,
};
// 손톱 폭 / 끝마디 길이(TIP~DIP) 비율 — 손가락이 앞으로 기울어 짧아 보이면 이 값이 작아진다
const WIDTH_BY_LEN: Record<FingerType, number> = {
  thumb: 0.5,
  index: 0.52,
  middle: 0.52,
  ring: 0.5,
  pinky: 0.48,
};
// 큐티클 위치: TIP 에서 DIP 쪽으로 끝마디 길이의 몇 배만큼 내려온 곳 (엄지는 TIP 랜드마크가 손톱 끝보다 바깥에 잡힌다)
const CUTICLE_AT: Record<FingerType, number> = { thumb: 0.62, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5 };

export type NailPlacement = {
  finger: FingerType;
  /** 큐티클(손톱 뿌리) 중심, px */
  base: Pt;
  /** 손가락 끝 방향 각도(라디안, 화면 위쪽 = 0, 시계 방향 +) */
  angle: number;
  /** 손톱 폭, px */
  width: number;
  /** 끝마디 길이, px (팁 길이 상한에 쓴다) */
  segment: number;
};

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

export function nailPlacements(lm: Pt[]): NailPlacement[] {
  const spacing = dist(lm[5], lm[17]) / 3;
  return FINGERS.map(finger => {
    const [ti, di] = FINGER_LM[finger];
    const tip = lm[ti];
    const dip = lm[di];
    const vx = tip.x - dip.x;
    const vy = tip.y - dip.y;
    const segment = Math.hypot(vx, vy);
    // 간격 기준 폭과 마디 길이 기준 폭의 평균. 둘 중 하나가 크게 틀어져도 나머지가 잡아 준다.
    const width = (WIDTH_K[finger] * spacing + WIDTH_BY_LEN[finger] * segment) / 2;
    return {
      finger,
      base: { x: tip.x - vx * CUTICLE_AT[finger], y: tip.y - vy * CUTICLE_AT[finger] },
      angle: Math.atan2(vx, -vy),
      width,
      segment,
    };
  });
}

/**
 * 손등/손바닥 판정. 손목(0)→검지 뿌리(5), 손목→소지 뿌리(17) 벡터의 외적 부호(화면 좌표)와
 * 모델이 낸 왼손/오른손 라벨을 함께 본다. 라벨과 외적 부호가 같은 입력에서 함께 뒤집히므로
 * 입력 이미지가 좌우 반전돼 있어도 결과는 같다.
 */
export function handFacing(lm: Pt[], label: string | undefined): 'back' | 'palm' | 'unknown' {
  const w = lm[0];
  const i = lm[5];
  const p = lm[17];
  const cross = (i.x - w.x) * (p.y - w.y) - (i.y - w.y) * (p.x - w.x);
  if (label === 'Left') return cross < 0 ? 'back' : 'palm';
  if (label === 'Right') return cross > 0 ? 'back' : 'palm';
  return 'unknown';
}

/** 네일팁 PNG 에서 불투명한 영역만 잘라 쓴다 (샘플 팁은 192×192 가운데에 세로로 놓여 있다) */
export type TipSprite = { img: HTMLImageElement; sx: number; sy: number; sw: number; sh: number };

const spriteCache = new Map<string, Promise<TipSprite>>();

export function loadTipSprite(url: string): Promise<TipSprite> {
  let p = spriteCache.get(url);
  if (!p) {
    p = new Promise<TipSprite>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
        let x0 = width;
        let y0 = height;
        let x1 = -1;
        let y1 = -1;
        for (let y = 0; y < height; y++)
          for (let x = 0; x < width; x++)
            if (data[(y * width + x) * 4 + 3] > 16) {
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              if (y > y1) y1 = y;
            }
        if (x1 < 0) resolve({ img, sx: 0, sy: 0, sw: width, sh: height });
        else resolve({ img, sx: x0, sy: y0, sw: x1 - x0 + 1, sh: y1 - y0 + 1 });
      };
      img.onerror = () => reject(new Error(`팁 이미지를 불러오지 못했습니다: ${url}`));
      img.src = url;
    });
    spriteCache.set(url, p);
    p.catch(() => spriteCache.delete(url));
  }
  return p;
}

export async function loadSprites(set: SelectedNailSet) {
  const out: Partial<Record<FingerType, TipSprite>> = {};
  await Promise.all(
    FINGERS.map(async f => {
      const n = set[f];
      if (n) out[f] = await loadTipSprite(n.imageUrl);
    }),
  );
  return out;
}

// 팁 PNG 는 실제 손톱보다 길쭉한 연장 팁이라, 세로를 조금 줄이고 끝마디 길이로 상한을 둔다
const TIP_SQUASH = 0.8;
const MAX_LEN_BY_SEGMENT = 1.05;

export function drawNails(
  ctx: CanvasRenderingContext2D,
  placements: NailPlacement[],
  sprites: Partial<Record<FingerType, TipSprite>>,
) {
  for (const p of placements) {
    const s = sprites[p.finger];
    if (!s) continue;
    const w = p.width;
    const h = Math.min((w * s.sh * TIP_SQUASH) / s.sw, p.segment * MAX_LEN_BY_SEGMENT);
    ctx.save();
    ctx.translate(p.base.x, p.base.y);
    ctx.rotate(p.angle);
    ctx.shadowColor = 'rgba(60, 30, 30, 0.28)';
    ctx.shadowBlur = Math.max(1, w * 0.06);
    ctx.shadowOffsetY = Math.max(0.5, w * 0.02);
    ctx.globalAlpha = 0.97;
    ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, -w / 2, -h, w, h);
    ctx.restore();
  }
}
