# Nailian 웹 체험판

> Nailian 웹 체험판 — 2025년 출시한 iOS 앱의 시안 탐색·선택·미리 보기 흐름을 재현했습니다. 현재 운영 서버가 종료돼 가상 API와 샘플 데이터로 동작합니다. AR은 웹용으로 다시 구현했습니다(손 인식 MediaPipe, 원본 iOS 앱은 손톱 검출·분할 모델 사용). 로그인은 제공하지 않습니다.

- 웹 체험판 (현재 페이지): https://onehowon.github.io/nailian-web/
- 출시 앱 (출시 이력): https://apps.apple.com/kr/app/nailian/id6744244726
- 원본 BE 코드 (본인 담당): https://github.com/Snail-official/Nailian-BE
- 원본 FE 코드 (구현 근거): https://github.com/Snail-official/Nailian-FE

- 원본 앱은 7인 팀이 만든 온디바이스 AI 네일 추천 iOS 앱(React Native 0.76)입니다. 본인은 이 팀의 백엔드 리드였습니다.
- 이 웹 체험판은 본인이 원본 FE 화면 코드를 읽고 색·글꼴·배치·문구를 옮겨 Vite + React(TypeScript)로 다시 만든 정적 웹 재현판입니다. React Native 코드를 웹으로 빌드한 것은 아닙니다.

## 재현 범위

| 화면 | 원본 위치 | 체험판 |
| --- | --- | --- |
| 메인 홈 (배너, 스타일별 추천 세트) | `src/pages/main_home` | `#/` |
| 네일 세트 피드 (스타일별 2열 목록) | `src/pages/nail_set/feed` | `#/feed/0` ~ `#/feed/2` |
| 네일 세트 상세 (보관함 저장, 비슷한 세트) | `src/pages/nail_set/detail` | `#/detail/1?style=0` |
| AR 체험: 손가락별 시안 선택, 필터, 손 이미지 위 미리 보기 | `src/pages/ar_experience` | `#/ar` |
| 내 손에 올려보기: 사진·실시간 카메라·샘플 손 위에 네일팁 합성 (웹용으로 다시 구현) | `src/pages/ar_camera` (원본은 iOS 네이티브 모델) | `#/ar/try` |
| 네일 보관함 | `src/pages/nail_set/bookmark` | `#/my` (하단 '마이' 탭) |

넣지 않은 것

- 원본 iOS 앱의 손톱 검출·분할 모델 (비공개 저장소라 쓰지 않았고, 웹에서는 MediaPipe 손 인식으로 대신함)
- 로그인·온보딩 소셜 로그인, 마이페이지 프로필, 퍼스널 네일 진단, 이벤트 응모

## 원본과 다른 점

- 데이터: 운영 서버가 종료돼 가상 API와 샘플 데이터를 씁니다. 게스트 사용자 한 명으로 동작합니다.
- 네일팁 이미지: 원본 서버 이미지를 쓸 수 없어, 원본 저장소 에셋으로 만든 샘플 32종을 씁니다(아래 '샘플 데이터 출처').
- 손 위 미리 보기: 원본 좌표는 서버 팁 이미지에 맞춰져 있어, 샘플 팁에 맞게 손가락별 위치를 다시 잡았습니다.
- '내 손에 올려보기' 버튼: 원본처럼 AR 화면으로 넘어갑니다. 다만 AR 방식이 다릅니다(아래 '웹 AR').
- 상세 화면의 '손에 올려보기' 버튼: 체험판에서 추가했습니다. 고른 세트를 AR 체험 화면에 바로 채워 미리 볼 수 있습니다.
- '마이' 탭: 원본 마이페이지 대신 네일 보관함을 바로 엽니다.
- 홈 하단 유의사항 문구: 원본의 'AI 생성 이미지' 안내 대신 샘플 이미지 안내로 바꿨습니다.
- 바텀시트·필터 모달: `@gorhom/bottom-sheet` 대신 CSS로 다시 구현했습니다(접힘 20% / 펼침 93% 두 단계는 같음).

## 웹 AR ('내 손에 올려보기')

원본과 다른 점

- 원본 iOS 앱: 사진을 800×800으로 줄인 뒤 손톱 검출 모델(DetectionManager)과 BiSeNet 기반 손톱 분할 모델(SegmentationManager)로 손톱 영역을 직접 찾아 네일팁을 합성했습니다.
- 웹 체험판: 손톱 모델은 비공개 저장소라 쓰지 않았습니다. [MediaPipe Tasks Vision HandLandmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)(오픈소스, Apache-2.0)로 손 랜드마크 21점을 찾고, 손톱 자리를 계산으로 추정합니다.

동작

- 입력 세 가지
  - 샘플 손으로 해보기: 원본 에셋 `hand.png` 사용. 카메라·사진 없이 바로 체험
  - 내 손 사진 올리기: 파일 선택. 휴대폰(터치 기기)에서는 '카메라로 찍어 올리기' 버튼이 따로 보임 (`accept="image/*" capture`)
  - 실시간 카메라: `getUserMedia`. 지원하지 않거나 권한을 거부하면 안내 후 사진 방식으로 돌아감. '이 장면 찍기'로 멈춰서 저장
- 손톱 위치 계산 (`src/pages/ar/tryon/nailGeometry.ts`)
  - 손가락 끝(TIP 4·8·12·16·20)과 바로 아래 마디(엄지 IP 3, 나머지 DIP 7·11·15·19)를 잇는 방향 = 손톱 방향(각도)
  - 끝마디 길이(TIP~DIP)와 손가락 간격(검지~소지 뿌리 마디 거리 ÷ 3)의 평균으로 손톱 폭 결정
  - 큐티클은 TIP에서 끝마디 길이의 50%(엄지 62%) 아래로 잡고, 팁 이미지를 회전·확대해 캔버스에 그림
- 손등/손바닥 판정: 손목→검지 뿌리, 손목→소지 뿌리 벡터의 외적 부호와 모델의 왼손/오른손 결과를 함께 봅니다. 손바닥으로 판정된 손에는 네일을 올리지 않고 안내 문구를 띄웁니다.
- 결과 이미지 저장: 캔버스를 PNG로 내려받습니다.
- 사진·카메라 화면은 브라우저 안에서만 처리하고 서버로 보내지 않습니다.

정확도 한계

- 손톱 모양·경계를 직접 찾지 않으므로 위치·크기는 근사치입니다. 손등이 보이고 손가락을 편 자세에서 가장 자연스럽습니다.
- 손가락이 카메라 쪽으로 많이 굽거나 겹치면 각도·길이가 틀어집니다. 엄지는 옆모습으로 찍히는 경우가 많아 오차가 큽니다.
- 손톱 가림(occlusion)·피부 경계 처리가 없어 팁이 손가락 끝 밖으로 조금 나올 수 있습니다(샘플 팁이 연장 팁 모양이라 의도에 가깝습니다).
- 손등/손바닥 판정은 모델의 왼손/오른손 결과에 기대므로, 손 옆면·주먹 등에서는 틀릴 수 있습니다.

모델·용량·라이선스

| 파일 (`public/mediapipe`) | 용량 | 출처 | 라이선스 |
| --- | --- | --- | --- |
| `wasm/vision_wasm_internal.wasm` + `.js` | 11.8MB (gzip 약 3.4MB) + 0.3MB | npm `@mediapipe/tasks-vision@1.0.1` 의 `wasm/` | Apache-2.0 |
| `hand_landmarker.task` (float16) | 7.8MB | Google MediaPipe 공개 모델 (`mediapipe-models/hand_landmarker/float16/1`) | Apache-2.0 |
| JS 라이브러리 (`vision_bundle`) | 143KB (gzip 43KB) | npm `@mediapipe/tasks-vision@1.0.1` (버전 고정) | Apache-2.0 |

- 외부 CDN을 쓰지 않습니다. wasm·모델을 `public/mediapipe`에 넣어 두고 상대 경로(`./mediapipe/…`)로 불러오므로 GitHub Pages 하위 경로에서도 그대로 동작합니다.
- 라이브러리·wasm·모델은 '내 손에 올려보기'에서 처음 손을 인식할 때만 받습니다(약 20MB, 이후 브라우저 캐시). 다른 화면 초기 로딩에는 영향이 없습니다.
- SIMD 지원 wasm만 넣었습니다(Chrome 91+, Safari 16.4+, Firefox 89+). 이보다 오래된 브라우저에서는 손 인식이 시작되지 않고 오류 안내가 뜹니다.
- 출처·해시: `public/mediapipe/NOTICE.txt`

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
  pages/ar/tryon/      내 손에 올려보기: ARTryOn 화면, MediaPipe 로더, 손톱 위치 계산·합성
  shared/api/          fetcher, 엔드포인트 함수, 타입 (원본 entities/*/api.ts 대응)
  shared/ui/           TabBar, NailSet 썸네일, 아이콘, 토스트
  mocks/               가상 API 서버·핸들러·샘플 데이터
  assets/              원본 저장소에서 가져온 이미지·아이콘·글꼴
public/
  sample/              샘플 네일팁·배너
  mediapipe/           MediaPipe wasm·손 인식 모델 (Apache-2.0)
```
