import type { IBanner } from '../../shared/api/types';

const base = import.meta.env.BASE_URL;

// 원본 배너는 운영 서버 이미지라 쓸 수 없어 샘플 배너 2장으로 대체했다.
// '#/' 로 시작하는 링크는 체험판 안 화면으로 이동한다.
const banners: IBanner[] = [
  { id: 1, imageUrl: `${base}sample/banners/banner-1.svg`, link: '#/ar' },
  { id: 2, imageUrl: `${base}sample/banners/banner-2.svg`, link: '#/feed/1' },
];

export default banners;
