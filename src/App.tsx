import { useRoute } from './shared/lib/router';
import { ToastHost } from './shared/ui/misc';
import MainHome from './pages/MainHome';
import NailSetFeed from './pages/NailSetFeed';
import NailSetDetail from './pages/NailSetDetail';
import ARExperience from './pages/ar/ARExperience';
import Bookmark from './pages/Bookmark';
import ARTryOn from './pages/ar/tryon/ARTryOn';

const APP_STORE = 'https://apps.apple.com/kr/app/nailian/id6744244726';
const REPO_FE = 'https://github.com/Snail-official/Nailian-FE';
const REPO_BE = 'https://github.com/Snail-official/Nailian-BE';

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
  if (seg[0] === 'ar' && seg[1] === 'try') return <ARTryOn />;
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
          현재 운영 서버가 종료돼 가상 API와 샘플 데이터로 동작합니다. AR은 웹용으로 다시 구현했습니다(손
          인식 MediaPipe, 원본 iOS 앱은 손톱 검출·분할 모델 사용). 로그인은 제공하지 않습니다.
        </p>
        <p className="notice-credit">원본 앱: 7인 팀 · 웹 체험판: 성원호 재구현(Claude Code)</p>
        <nav className="notice-links" aria-label="관련 링크">
          <a href="./" aria-current="page">
            웹 체험판 <span>(현재 페이지)</span>
          </a>
          <span aria-hidden="true">·</span>
          <a href={APP_STORE} target="_blank" rel="noopener noreferrer">
            출시 앱 <span>(설치 가능 · 서버 종료로 현재 동작 안 함)</span>
          </a>
          <span aria-hidden="true">·</span>
          <a href={REPO_BE} target="_blank" rel="noopener noreferrer">
            원본 BE 코드 <span>(백엔드 개발 참여)</span>
          </a>
          <span aria-hidden="true">·</span>
          <a href={REPO_FE} target="_blank" rel="noopener noreferrer">
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
