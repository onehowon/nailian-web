import { useRoute } from './shared/lib/router';
import { ToastHost } from './shared/ui/misc';
import MainHome from './pages/MainHome';
import NailSetFeed from './pages/NailSetFeed';
import NailSetDetail from './pages/NailSetDetail';
import ARExperience from './pages/ar/ARExperience';
import Bookmark from './pages/Bookmark';

const APP_STORE = 'https://apps.apple.com/kr/app/nailian/id6744244726';
const REPO = 'https://github.com/Snail-official/Nailian-FE';

function Screen() {
  const { pathname, params } = useRoute();
  const seg = pathname.split('/').filter(Boolean);
  if (seg[0] === 'feed') return <NailSetFeed key={pathname} styleId={Number(seg[1]) || 0} />;
  if (seg[0] === 'detail') {
    const id = Number(seg[1]);
    return (
      <NailSetDetail
        key={`${pathname}?${params}`}
        nailSetId={id}
        styleId={Number(params.get('style') ?? NaN)}
        bookmarkMode={params.get('from') === 'bookmark'}
      />
    );
  }
  if (seg[0] === 'ar') {
    const set = Number(params.get('set'));
    return <ARExperience key={`ar-${set || ''}`} presetId={set || undefined} />;
  }
  if (seg[0] === 'my') return <Bookmark />;
  return <MainHome />;
}

export default function App() {
  return (
    <div className="page">
      <header className="notice" role="note">
        <p className="notice-text">
          Nailian 웹 체험판 — 2025년 출시한 iOS 앱의 시안 탐색·선택·미리 보기 흐름을 재현했습니다.
          현재 운영 서버가 종료돼 가상 API와 샘플 데이터로 동작합니다. 실시간 카메라 AR과 로그인은
          제공하지 않습니다.
        </p>
        <nav className="notice-links" aria-label="관련 링크">
          <a href="./" aria-current="page">
            웹 체험판 <span>(현재 페이지)</span>
          </a>
          <span aria-hidden="true">·</span>
          <a href={APP_STORE} target="_blank" rel="noopener noreferrer">
            출시 앱 <span>(출시 이력)</span>
          </a>
          <span aria-hidden="true">·</span>
          <a href={REPO} target="_blank" rel="noopener noreferrer">
            원본 FE 코드 <span>(구현 근거)</span>
          </a>
        </nav>
      </header>
      <main className="stage">
        <div className="phone">
          <div className="app">
            <Screen />
            <ToastHost />
          </div>
        </div>
      </main>
    </div>
  );
}
