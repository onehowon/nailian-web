// 샘플 네일팁 이미지 생성기
//
// 원본 저장소(Snail-official/Nailian-FE)의 nukki 에셋 4종을 바탕으로
// 색(8종)과 모양(5종)만 바꾼 파생 PNG 를 public/sample/nails/ 에 만든다.
// 결과물은 저장소에 커밋되어 있으므로 빌드에는 필요 없다. 다시 만들 때만 실행한다.
//
//   PUPPETEER_DIR=/path/to/node_modules/puppeteer-core CHROME_PATH=... node scripts/generate-sample-tips.mjs
//
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_DIR || 'puppeteer-core');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const catalog = JSON.parse(
  readFileSync(join(root, 'src/mocks/data/catalog.json'), 'utf8'),
);
const sources = Object.fromEntries(
  ['onecolor', 'french', 'gradient', 'art'].map(name => [
    name,
    'data:image/png;base64,' +
      readFileSync(join(root, `scripts/source-assets/${name}_nukki.png`)).toString('base64'),
  ]),
);

// 카탈로그 → 네일 목록 (src/mocks/data/nails.ts 와 같은 규칙)
const nails = [];
catalog.categories.forEach((category, ci) => {
  catalog.colors.forEach((color, ki) => {
    nails.push({
      category,
      color,
      shape: catalog.shapes[(ci * 3 + ki) % catalog.shapes.length],
      file: `${category.toLowerCase().replace('_', '')}-${color.toLowerCase()}.png`,
    });
  });
});

const outDir = join(root, 'public/sample/nails');
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, executablePath: CHROME });
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');

for (const nail of nails) {
  const src = sources[nail.category.toLowerCase().replace('_', '')];
  const dataUrl = await page.evaluate(
    async ({ src, category, color, shape }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const S = 192;

      // 1) 원본의 불투명 영역(네일 바운딩 박스) 측정
      const probe = document.createElement('canvas');
      probe.width = S;
      probe.height = S;
      const pctx = probe.getContext('2d');
      pctx.drawImage(img, 0, 0);
      const { data } = pctx.getImageData(0, 0, S, S);
      let x0 = S, y0 = S, x1 = 0, y1 = 0;
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++)
          if (data[(y * S + x) * 4 + 3] > 20) {
            x0 = Math.min(x0, x); y0 = Math.min(y0, y);
            x1 = Math.max(x1, x); y1 = Math.max(y1, y);
          }

      // 2) 모양별로 가로 폭을 살짝 넓혀 그린 뒤 마스크
      const widen = { SQUARE: 1.14, ROUND: 1.1, ALMOND: 1.04, BALLERINA: 1, STILETTO: 1.04 }[shape];
      const cx = (x0 + x1) / 2;
      const w = (x1 - x0) * widen;
      const h = y1 - y0;
      const bx = cx - w / 2;

      const c = document.createElement('canvas');
      c.width = S;
      c.height = S;
      const ctx = c.getContext('2d');

      const tint = {
        WHITE: null,
        BLACK: '#4a4a4a',
        BEIGE: '#F3DEC2',
        PINK: '#FFA9C6',
        YELLOW: '#FFEC6E',
        GREEN: '#BDEB86',
        BLUE: '#A9C3FF',
        SILVER: '#D9DCE2',
      }[color];

      // 아트(리본) 블랙은 반전해서 리본이 보이게, 나머지는 회색조 위에 색을 곱한다.
      const invertArt = category === 'ART' && color === 'BLACK';
      ctx.filter = invertArt
        ? 'grayscale(1) invert(1) brightness(0.32) contrast(1.1)'
        : category === 'FRENCH'
          ? 'grayscale(1) brightness(1.04)'
          : 'grayscale(1) brightness(1.1)';
      ctx.save();
      ctx.translate(cx, 0);
      ctx.scale(widen, 1);
      ctx.translate(-cx, 0);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      ctx.filter = 'none';

      // 프렌치: 끝(팁) 20%는 흰색으로 남기고 몸통만 칠한다. 화이트 프렌치는 누드 바탕.
      const bodyTint =
        category === 'FRENCH' && color === 'WHITE'
          ? '#F2D6CC'
          : color === 'WHITE'
            ? '#F6F4F2'
            : tint;
      if (bodyTint && !invertArt) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = bodyTint;
        const top = category === 'FRENCH' ? y0 + (y1 - y0) * 0.21 : 0;
        // 원컬러·블랙은 두 번 곱해 채도를 올린다
        const passes = category === 'ONE_COLOR' || color === 'BLACK' ? 2 : 1;
        for (let i = 0; i < passes; i++) ctx.fillRect(0, top, S, S - top);
        if (category === 'FRENCH') {
          // 팁 경계를 살짝 부드럽게
          const g = ctx.createLinearGradient(0, top - 3, 0, top + 3);
          g.addColorStop(0, 'rgba(255,255,255,1)');
          g.addColorStop(1, bodyTint);
          ctx.fillStyle = g;
          ctx.fillRect(0, top - 3, S, 6);
        }
      }
      if (color === 'SILVER') {
        // 은은한 광택 하이라이트
        ctx.globalCompositeOperation = 'screen';
        const g = ctx.createLinearGradient(bx, 0, bx + w, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
        g.addColorStop(0.5, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, S, S);
      }

      // 3) 원래 알파(가로로 넓힌 것) 와 모양 마스크를 함께 적용
      //    원컬러 원본은 반투명(최대 알파 122)이라 알파를 0~255 로 다시 늘린다.
      let maxA = 0;
      for (let k = 3; k < data.length; k += 4) maxA = Math.max(maxA, data[k]);
      const m = document.createElement('canvas');
      m.width = S;
      m.height = S;
      const mctx = m.getContext('2d');
      mctx.translate(cx, 0);
      mctx.scale(widen, 1);
      mctx.translate(-cx, 0);
      mctx.drawImage(img, 0, 0);
      const md = mctx.getImageData(0, 0, S, S);
      for (let k = 3; k < md.data.length; k += 4)
        md.data[k] = Math.min(255, Math.round((md.data[k] * 255) / maxA));
      mctx.putImageData(md, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(m, 0, 0);

      const path = new Path2D();
      const bottomR = w / 2; // 큐티클 쪽은 둥글게
      const L = bx, R = bx + w, T = y0, B = y1;
      const by = B - bottomR * 0.9;
      if (shape === 'SQUARE') {
        path.moveTo(L, T + 4);
        path.quadraticCurveTo(L, T, L + 4, T);
        path.lineTo(R - 4, T);
        path.quadraticCurveTo(R, T, R, T + 4);
      } else if (shape === 'ROUND') {
        path.moveTo(L, T + w * 0.5);
        path.bezierCurveTo(L, T - w * 0.12, R, T - w * 0.12, R, T + w * 0.5);
      } else if (shape === 'ALMOND') {
        path.moveTo(L, T + h * 0.45);
        path.bezierCurveTo(L, T + h * 0.12, cx - w * 0.18, T, cx, T);
        path.bezierCurveTo(cx + w * 0.18, T, R, T + h * 0.12, R, T + h * 0.45);
      } else if (shape === 'STILETTO') {
        path.moveTo(L, T + h * 0.55);
        path.bezierCurveTo(L + w * 0.05, T + h * 0.25, cx - w * 0.06, T + h * 0.04, cx, T);
        path.bezierCurveTo(cx + w * 0.06, T + h * 0.04, R - w * 0.05, T + h * 0.25, R, T + h * 0.55);
      } else {
        // BALLERINA: 원본 nukki 모양 그대로
        path.rect(0, 0, S, S);
      }
      if (shape !== 'BALLERINA') {
        path.lineTo(R, by);
        path.bezierCurveTo(R, B + 2, L, B + 2, L, by);
        path.closePath();
      }
      ctx.fillStyle = '#000';
      ctx.fill(path);

      return c.toDataURL('image/png');
    },
    { src, category: nail.category, color: nail.color, shape: nail.shape },
  );
  writeFileSync(join(outDir, nail.file), Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('wrote', nail.file, nail.shape);
}

await browser.close();
