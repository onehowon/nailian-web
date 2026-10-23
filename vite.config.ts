import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 상대 경로('./')로 빌드하면 GitHub Pages 하위 경로(/nailian-web/)와 루트 도메인 둘 다 동작한다.
// 화면 이동은 해시 라우팅(#/feed/0 등)이라 서버 설정 없이 새로고침해도 깨지지 않는다.
// 필요하면 BASE_PATH=/nailian-web/ npm run build 처럼 절대 경로로 바꿀 수 있다.
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  plugins: [react()],
  build: { assetsInlineLimit: 0 },
});
