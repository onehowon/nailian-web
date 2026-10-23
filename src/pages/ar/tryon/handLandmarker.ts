import type { HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';

// MediaPipe Tasks Vision HandLandmarker (Apache-2.0).
// wasm 런타임과 hand_landmarker.task 모델은 public/mediapipe 에 함께 넣어 두어 외부 CDN 없이 동작한다.
// 라이브러리 코드(약 150KB)는 AR 화면에 들어올 때만 동적 import 로 불러온다.

const asset = (p: string) => new URL(`${import.meta.env.BASE_URL}mediapipe/${p}`, document.baseURI).href;

export type RunningMode = 'IMAGE' | 'VIDEO';

let loading: Promise<HandLandmarker> | null = null;
let mode: RunningMode = 'IMAGE';

export function loadHandLandmarker(): Promise<HandLandmarker> {
  if (!loading) {
    loading = (async () => {
      const { HandLandmarker } = await import('@mediapipe/tasks-vision');
      return quietInfoLogs(() =>
        HandLandmarker.createFromOptions(
          {
            wasmLoaderPath: asset('wasm/vision_wasm_internal.js'),
            wasmBinaryPath: asset('wasm/vision_wasm_internal.wasm'),
          },
          {
            // GPU 대리자는 브라우저·기기마다 편차가 커서 CPU(XNNPACK)로 고정한다.
            baseOptions: { modelAssetPath: asset('hand_landmarker.task'), delegate: 'CPU' },
            runningMode: 'IMAGE',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          },
        ),
      );
    })();
    mode = 'IMAGE';
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
}

export async function setMode(lm: HandLandmarker, next: RunningMode) {
  if (mode === next) return;
  await lm.setOptions({ runningMode: next });
  mode = next;
}

export function detectImage(lm: HandLandmarker, src: HTMLCanvasElement | HTMLImageElement): HandLandmarkerResult {
  return quietInfoLogsSync(() => lm.detect(src));
}

/**
 * wasm 런타임은 "INFO: Created TensorFlow Lite XNNPACK delegate" 같은 안내 로그를 stderr(console.error)로 낸다.
 * 오류가 아닌 INFO 로그만 console.info 로 돌리고, 나머지는 그대로 둔다.
 */
function isInfoLog(args: unknown[]) {
  return typeof args[0] === 'string' && /^(INFO:|I\d{4} )/.test(args[0]);
}
function withQuietConsole<T>(fn: () => T): [T | undefined, unknown, () => void] {
  const orig = console.error;
  console.error = (...args: unknown[]) => (isInfoLog(args) ? console.info(...args) : orig(...args));
  const restore = () => {
    console.error = orig;
  };
  try {
    return [fn(), undefined, restore];
  } catch (e) {
    return [undefined, e, restore];
  }
}
async function quietInfoLogs<T>(fn: () => Promise<T>): Promise<T> {
  const [p, err, restore] = withQuietConsole(fn);
  try {
    if (err) throw err;
    return await (p as Promise<T>);
  } finally {
    restore();
  }
}
function quietInfoLogsSync<T>(fn: () => T): T {
  const [v, err, restore] = withQuietConsole(fn);
  restore();
  if (err) throw err;
  return v as T;
}

export function detectVideo(lm: HandLandmarker, video: HTMLVideoElement, ts: number): HandLandmarkerResult {
  return quietInfoLogsSync(() => lm.detectForVideo(video, ts));
}
