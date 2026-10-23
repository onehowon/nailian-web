import type { NailSetSummary } from '../api/types';

// 원본 features/nail-set/ui/NailSet: 다섯 손가락 팁을 겹쳐 늘어놓은 썸네일 (160×108 / 331×204)
const DEFAULT_NAILS = [
  { name: 'thumb', width: 80, height: 78, x: -23, y: 6.3 },
  { name: 'index', width: 65, height: 64, x: 12, y: 18 },
  { name: 'middle', width: 65, height: 64, x: 37, y: 18 },
  { name: 'ring', width: 65, height: 64, x: 62, y: 18 },
  { name: 'pinky', width: 65, height: 64, x: 87, y: 18 },
] as const;

export default function NailSet({
  nailImages,
  size = 'small',
  onPress,
}: {
  nailImages: NailSetSummary;
  size?: 'small' | 'large';
  onPress?: () => void;
}) {
  const f = size === 'large' ? 2.06875 : 1;
  const Tag = onPress ? 'button' : 'div';
  return (
    <Tag
      className={`nailset nailset-${size}`}
      onClick={onPress}
      aria-label={onPress ? `네일 세트 ${nailImages.id} 보기` : undefined}
    >
      <div className="nailset-inner">
        {DEFAULT_NAILS.map(n => (
          <img
            key={n.name}
            src={nailImages[n.name].imageUrl}
            alt=""
            draggable={false}
            style={{
              left: Math.round(n.x * f),
              top: Math.round(n.y * f),
              width: Math.round(n.width * f),
              height: Math.round(n.height * f),
            }}
          />
        ))}
      </div>
    </Tag>
  );
}
