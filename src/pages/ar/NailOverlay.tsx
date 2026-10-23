import { useLayoutEffect, useRef, useState } from 'react';
import handImg from '../../assets/images/hand.png';
import type { FingerType, SelectedNailSet } from '../../shared/api/types';

// 원본 pages/ar_experience/ui/NailOverlay: 고정된 손 이미지(237×370) 위에 손가락별 네일팁을 겹친다.
// 원본 좌표는 운영 서버의 팁 이미지에 맞춰져 있었다. 체험판 샘플 팁(192×192, 팁이 가운데 세로로 놓임)에
// 맞춰 손가락 끝 위치를 다시 잡았다. 값은 237×370 기준 px.
const STAGE_W = 237;
const STAGE_H = 370;

// 샘플 팁 PNG 안에서 네일이 차지하는 영역 (192px 기준)
const TIP_BOX = { x0: 68, x1: 123, y1: 155, size: 192 };
const TIP_W = (TIP_BOX.x1 - TIP_BOX.x0) / TIP_BOX.size;
// 팁 길이가 실제 손톱보다 길어 세로로 조금 줄여 붙인다
const TIP_SQUASH = 0.8;

// cx: 손톱 중심 x, bottom: 큐티클 위치 y, width: 손톱 폭, rotation: 기울기(도)
export const NAIL_POSITIONS: Record<FingerType, { cx: number; bottom: number; width: number; rotation: number }> = {
  pinky: { cx: 28.5, bottom: 118, width: 13.5, rotation: -4 },
  ring: { cx: 70.5, bottom: 66, width: 18.5, rotation: -2 },
  middle: { cx: 116.8, bottom: 43, width: 22, rotation: 0 },
  index: { cx: 160.2, bottom: 61, width: 19.5, rotation: 2 },
  thumb: { cx: 223.3, bottom: 185, width: 15.5, rotation: 14 },
};

const FINGERS: FingerType[] = ['pinky', 'ring', 'middle', 'index', 'thumb'];

function Stage({ nailSet }: { nailSet: SelectedNailSet }) {
  return (
    <div className="hand-stage" style={{ width: STAGE_W, height: STAGE_H }}>
      <img className="hand-img" src={handImg} alt="손 이미지" draggable={false} />
      {FINGERS.map(f => {
        const nail = nailSet[f];
        if (!nail) return null;
        const p = NAIL_POSITIONS[f];
        const imgW = p.width / TIP_W;
        const left = p.cx - imgW / 2;
        const imgH = imgW * TIP_SQUASH;
        const top = p.bottom - imgH * (TIP_BOX.y1 / TIP_BOX.size);
        return (
          <img
            key={f}
            className="nail-tip"
            src={nail.imageUrl}
            alt=""
            draggable={false}
            style={{
              left,
              top,
              width: imgW,
              height: imgH,
              transform: `rotate(${p.rotation}deg)`,
              transformOrigin: `50% ${(TIP_BOX.y1 / TIP_BOX.size) * 100}%`,
            }}
          />
        );
      })}
    </div>
  );
}

/** 가용 영역에 맞춰 237×370 무대를 비율 그대로 줄이거나 키운다 */
export default function NailOverlay({
  nailSet,
  maxScale = 1,
  onPress,
}: {
  nailSet: SelectedNailSet;
  maxScale?: number;
  onPress?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      setK(Math.max(0.3, Math.min(maxScale, width / STAGE_W, height / STAGE_H)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxScale]);

  return (
    <div className="hand-fit" ref={ref}>
      <button
        className="hand-scaled"
        style={{ width: STAGE_W * k, height: STAGE_H * k }}
        onClick={onPress}
        aria-label="손 이미지 크게 보기"
      >
        <div style={{ transform: `scale(${k})`, transformOrigin: '0 0' }}>
          <Stage nailSet={nailSet} />
        </div>
      </button>
    </div>
  );
}
