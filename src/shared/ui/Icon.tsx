import home from '../../assets/icons/ic_home.svg?raw';
import ar from '../../assets/icons/ic_ar.svg?raw';
import my from '../../assets/icons/ic_my.svg?raw';
import arrowLeft from '../../assets/icons/ic_arrow_left.svg?raw';
import arrowRight from '../../assets/icons/ic_arrow_right.svg?raw';
import filter from '../../assets/icons/ic_filter.svg?raw';
import plus from '../../assets/icons/ic_plus.svg?raw';
import check from '../../assets/icons/ic_check.svg?raw';
import del from '../../assets/icons/ic_delete.svg?raw';
import group from '../../assets/icons/ic_group.svg?raw';
import trash from '../../assets/icons/ic_trash.svg?raw';
import logo from '../../assets/icons/logo.svg?raw';

// 원본 저장소의 SVG 아이콘을 그대로 쓴다. 크기는 CSS 로 맞추고 색은 currentColor 를 따른다.
const ICONS = { home, ar, my, arrowLeft, arrowRight, filter, plus, check, del, group, trash, logo };
export type IconName = keyof typeof ICONS;

const cleaned = Object.fromEntries(
  Object.entries(ICONS).map(([k, svg]) => [
    k,
    svg.replace(/<svg([^>]*?)\swidth="[^"]*"\sheight="[^"]*"/, '<svg$1'),
  ]),
) as Record<IconName, string>;

export default function Icon({
  name,
  size,
  width,
  height,
  color,
  className,
}: {
  name: IconName;
  size?: number;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`icon ${className ?? ''}`}
      aria-hidden="true"
      style={{ width: width ?? size, height: height ?? size, color }}
      dangerouslySetInnerHTML={{ __html: cleaned[name] }}
    />
  );
}
