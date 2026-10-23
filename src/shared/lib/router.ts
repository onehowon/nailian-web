import { useSyncExternalStore } from 'react';

// 해시 라우팅: GitHub Pages 하위 경로에서도 새로고침·직접 링크가 깨지지 않는다.
// 앱 안에서 이동한 깊이를 history.state 에 적어 두고, 뒤로가기는 그 깊이가 있을 때만 history.back().

function current() {
  return window.location.hash.replace(/^#/, '') || '/';
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  window.addEventListener('popstate', cb);
  return () => {
    window.removeEventListener('hashchange', cb);
    window.removeEventListener('popstate', cb);
  };
}

function emit() {
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function useRoute() {
  const path = useSyncExternalStore(subscribe, current);
  const [pathname, search = ''] = path.split('?');
  return { pathname, params: new URLSearchParams(search) };
}

const depth = () => (window.history.state?.depth as number | undefined) ?? 0;

export function navigate(to: string) {
  window.history.pushState({ depth: depth() + 1 }, '', `#${to}`);
  emit();
}

export function replace(to: string) {
  window.history.replaceState({ depth: depth() }, '', `#${to}`);
  emit();
}

export function goBack() {
  if (depth() > 0) window.history.back();
  else replace('/');
}
