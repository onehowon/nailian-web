// 원본 shared/lib/toast 처럼 어디서든 부르는 토스트
type ToastOptions = { position?: 'top' | 'bottom'; iconType?: 'check' | 'warn' };
export type ToastState = { id: number; message: string } & ToastOptions;

type Listener = (t: ToastState | null) => void;
const listeners = new Set<Listener>();
let seq = 0;
let timer: number | undefined;

export const toast = {
  showToast(message: string, options: ToastOptions = {}) {
    const t = { id: ++seq, message, position: options.position ?? 'top', iconType: options.iconType };
    listeners.forEach(l => l(t));
    window.clearTimeout(timer);
    timer = window.setTimeout(() => listeners.forEach(l => l(null)), 2200);
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
