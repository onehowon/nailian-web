# Nailian 웹 체험판

> Nailian 웹 체험판 — 2025년 출시한 iOS 앱의 시안 탐색·선택·미리 보기 흐름을 재현했습니다. 현재 운영 서버가 종료돼 가상 API와 샘플 데이터로 동작합니다. 실시간 카메라 AR과 로그인은 제공하지 않습니다.

- 출시 앱 (출시 이력): https://apps.apple.com/kr/app/nailian/id6744244726
- 원본 팀 저장소 (구현 근거): https://github.com/Snail-official/Nailian-FE

원본 앱은 7인 팀이 React Native 0.76으로 만든 온디바이스 AI 네일 추천 iOS 앱입니다. 이 저장소는 원본 화면 코드를 읽고 색·글꼴·배치·문구를 옮겨 Vite + React(TypeScript)로 새로 만든 정적 웹 재현판입니다. React Native 코드를 웹으로 빌드한 것은 아닙니다.

## 재현 범위

| 화면 | 원본 위치 | 체험판 |
| --- | --- | --- |
| 메인 홈 (배너, 스타일별 추천 세트) | `src/pages/main_home` | `#/` |
| 네일 세트 피드 (스타일별 2열 목록) | `src/pages/nail_set/feed` | `#/feed/0` ~ `#/feed/2` |
| 네일 세트 상세 (보관함 저장, 비슷한 세트) | `src/pages/nail_set/detail` | `#/detail/1?style=0` |
| AR 체험: 손가락별 시안 선택, 필터, 손 이미지 위 미리 보기 | `src/pages/ar_experience` | `#/ar` |
| 네일 보관함 | `src/pages/nail_set/bookmark` | `#/my` (하단 '마이' 탭) |

넣지 않은 것

- 실시간 카메라 AR (`ar_camera`), 온디바이스 모델
- 로그인·온보딩 소셜 로그인, 마이페이지 프로필, 퍼스널 네일 진단, 이벤트 응모

## 원본과 다른 점

- 데이터: 운영 서버가 종료돼 가상 API와 샘플 데이터를 씁니다. 게스트 사용자 한 명으로 동작합니다.
- 네일팁 이미지: 원본 서버 이미지를 쓸 수 없어, 원본 저장소 에셋으로 만든 샘플 32종을 씁니다(아래 '샘플 데이터 출처').
- 손 위 미리 보기: 원본 좌표는 서버 팁 이미지에 맞춰져 있어, 샘플 팁에 맞게 손가락별 위치를 다시 잡았습니다.
- '내 손에 올려보기' 버튼: 원본은 카메라 AR 화면으로 넘어가지만, 체험판은 손 이미지 확대 보기를 띄우고 안내 토스트를 보여 줍니다.
- 상세 화면의 '손에 올려보기' 버튼: 체험판에서 추가했습니다. 고른 세트를 AR 체험 화면에 바로 채워 미리 볼 수 있습니다.
- '마이' 탭: 원본 마이페이지 대신 네일 보관함을 바로 엽니다.
- 홈 하단 유의사항 문구: 원본의 'AI 생성 이미지' 안내 대신 샘플 이미지 안내로 바꿨습니다.
- 바텀시트·필터 모달: `@gorhom/bottom-sheet` 대신 CSS로 다시 구현했습니다(접힘 20% / 펼침 93% 두 단계는 같음).

## 가상 API

- 원본은 개발 중 msw 핸들러(`src/mocks/handlers`)로 API를 흉내 냈습니다.
- 체험판은 같은 엔드포인트·같은 응답 구조(`{ code, message, data }`, `pageInfo` + `content` 페이지네이션)를 가진 핸들러를 브라우저 안에서 직접 실행합니다.
- `src/shared/api/fetcher.ts`가 네트워크 대신 `src/mocks/server.ts`의 `mockFetch`를 부릅니다. 실제 HTTP 요청은 나가지 않습니다.
- 응답마다 0.1~0.3초 지연을 넣어 로딩 표시를 확인할 수 있습니다.
- 페이지 번호는 원본 앱 클라이언트처럼 0부터 셉니다.
- 보관함에 저장한 세트는 이 브라우저의 localStorage에만 남습니다.

| 메서드 | 경로 | 내용 |
| --- | --- | --- |
| GET | `/users/me` | 내 정보 (게스트) |
| GET | `/banners/home` | 홈 배너 |
| GET | `/nail-sets/recommendations` | 스타일별 추천 세트 |
| GET | `/nail-sets/feed?style=` | 스타일 피드 |
| GET | `/nail-sets/:id` | 세트 상세 |
| GET | `/nail-sets/:id/similar?style=` | 비슷한 세트 |
| GET | `/nails?category=&color=&shape=` | 네일팁 목록 (필터) |
| GET | `/users/me/nail-sets` | 보관함 |
| POST | `/users/me/nail-sets` | 직접 조합한 세트 저장 |
| POST | `/users/me/nail-sets/save` | 기존 세트 저장 |
| DELETE | `/users/me/nail-sets/:id` | 보관함에서 삭제 |

## 샘플 데이터 출처

모든 이미지·아이콘은 원본 팀 저장소 [Snail-official/Nailian-FE](https://github.com/Snail-official/Nailian-FE)의 `src/shared/assets`에서 가져왔습니다.

- 손 이미지 `hand.png`, 필터 이미지(`*_nukki.png`, `img_square·round·almond·ballet·still.png`), SVG 아이콘·로고: 원본 그대로 사용 (손 이미지만 용량을 줄이려고 474×740으로 축소)
- 네일팁 32종 (`public/sample/nails`): 원본 nukki 에셋 4종(원컬러·프렌치·그라데이션·아트)을 색 8종·모양 5종으로 바꾼 파생 이미지. `scripts/generate-sample-tips.mjs`로 만들었고, 원본 4종은 `scripts/source-assets`에 있습니다.
- 네일 세트 24개 (스타일별 8개), 홈 배너 2장: 체험판용으로 새로 구성한 샘플
- 글꼴: 원본과 같은 Pretendard (Medium·SemiBold·Bold, KS X 1001 서브셋 woff2)

## 실행

```bash
npm install
npm run dev       # 개발 서버
npm run build     # dist/ 생성
npm run preview   # 빌드 결과 미리 보기
```

- `vite.config.ts`의 `base`가 `'./'`(상대 경로)라서 같은 빌드가 루트 도메인과 GitHub Pages 하위 경로(`/nailian-web/`) 모두에서 동작합니다.
- 화면 이동은 해시 라우팅(`#/feed/0` 등)이라 새로고침이나 직접 링크에도 서버 설정이 필요 없습니다.
- 절대 경로가 필요하면 `BASE_PATH=/nailian-web/ npm run build`.

네일팁 이미지를 다시 만들 때만 (Chrome과 puppeteer-core 필요):

```bash
PUPPETEER_DIR=/path/to/node_modules/puppeteer-core node scripts/generate-sample-tips.mjs
```

## 배포

GitHub Pages

```bash
gh repo create <계정>/nailian-web --public --source=. --push
npm run build
npx gh-pages@6.2.0 -d dist
# 저장소 Settings → Pages → Branch: gh-pages / (root)
# 주소: https://<계정>.github.io/nailian-web/
```

Vercel

```bash
npx vercel@latest          # 첫 실행 때 프로젝트 연결 (Framework: Vite, Output: dist)
npx vercel@latest --prod
```

## 구조

```
src/
  App.tsx              안내문 + 휴대폰 프레임 + 화면 전환
  pages/               MainHome, NailSetFeed, NailSetDetail, Bookmark, ar/(ARExperience, FilterModal, NailOverlay)
  shared/api/          fetcher, 엔드포인트 함수, 타입 (원본 entities/*/api.ts 대응)
  shared/ui/           TabBar, NailSet 썸네일, 아이콘, 토스트
  mocks/               가상 API 서버·핸들러·샘플 데이터
  assets/              원본 저장소에서 가져온 이미지·아이콘·글꼴
```
