import { useEffect, useRef, useState } from 'react';
import type { HandLandmarkerResult } from '@mediapipe/tasks-vision';
import handImg from '../../../assets/images/hand.png';
import { TabBarHeader } from '../../../shared/ui/TabBar';
import { EmptyView, Spinner } from '../../../shared/ui/misc';
import { toast } from '../../../shared/lib/toast';
import { goBack, navigate } from '../../../shared/lib/router';
import type { FingerType, SelectedNailSet } from '../../../shared/api/types';
import { detectImage, detectVideo, loadHandLandmarker, setMode } from './handLandmarker';
import { drawNails, FINGERS, handFacing, loadSprites, nailPlacements, type TipSprite } from './nailGeometry';
import { fetchDefaultTryOnSet, loadTryOnSet } from './selection';

type Source = 'sample' | 'photo' | 'camera';
type Phase = 'choose' | 'loading' | 'live' | 'done' | 'error';
type Sprites = Partial<Record<FingerType, TipSprite>>;

const FINGER_LABEL: Record<FingerType, string> = {
  thumb: '엄지',
  index: '검지',
  middle: '중지',
  ring: '약지',
  pinky: '소지',
};
// 사진은 긴 변 1280px 이하로 줄여서 처리한다 (원본 iOS 앱은 800×800으로 줄여 모델에 넣었다)
const MAX_SIDE = 1280;

type Summary = { hands: number; back: number; palm: number };

function summarize(res: HandLandmarkerResult, w: number, h: number, mirror: boolean) {
  const summary: Summary = { hands: res.landmarks.length, back: 0, palm: 0 };
  const hands = res.landmarks.map((lms, i) => {
    const raw = lms.map(p => ({ x: p.x * w, y: p.y * h }));
    const facing = handFacing(raw, res.handedness[i]?.[0]?.categoryName);
    if (facing === 'palm') summary.palm++;
    else summary.back++;
    const pts = mirror ? raw.map(p => ({ x: w - p.x, y: p.y })) : raw;
    return { pts, facing };
  });
  return { summary, hands };
}

function guide(phase: Phase, s: Summary | null): string {
  if (phase === 'loading') return '손 인식 모델을 불러오는 중이에요 (처음 한 번, 약 20MB)';
  if (!s) return '';
  if (s.hands === 0) return '손을 찾지 못했어요. 손등이 보이게, 손가락을 펴서 다시 해 보세요.';
  if (s.back === 0) return '손바닥이 보여요. 손등이 화면을 향하게 하면 네일이 올라가요.';
  if (s.palm > 0) return '손등이 보이는 손에만 네일을 올렸어요.';
  return phase === 'live' ? '손등을 보여 주면 네일이 따라와요' : '네일을 올렸어요. 마음에 들면 저장해 보세요.';
}

export default function ARTryOn() {
  const [nailSet, setNailSet] = useState<SelectedNailSet | null>(() => {
    const s = loadTryOnSet();
    return s && FINGERS.some(f => s[f]) ? s : null;
  });
  // 링크로 바로 들어와 고른 팁이 없으면 샘플 세트로 채워 바로 체험할 수 있게 한다
  const [isDefault, setIsDefault] = useState(false);
  const [defaultFailed, setDefaultFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>('choose');
  const [source, setSource] = useState<Source | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);
  const run = useRef(0); // 진행 중인 처리 구분용 번호 (화면을 떠나거나 다시 시작하면 이전 처리는 버린다)
  const [coarse] = useState(() => window.matchMedia?.('(pointer: coarse)').matches ?? false);

  const stopCamera = () => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach(t => t.stop());
    stream.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (nailSet) return;
    let alive = true;
    fetchDefaultTryOnSet()
      .then(set => {
        if (!alive) return;
        setNailSet(set);
        setIsDefault(true);
      })
      .catch(() => {
        if (!alive) return;
        setDefaultFailed(true);
        toast.showToast('기본 시안을 불러오지 못했어요', { position: 'bottom' });
      });
    return () => {
      alive = false;
    };
  }, [nailSet]);

  useEffect(
    () => () => {
      run.current++;
      stopCamera();
    },
    [],
  );

  if (!nailSet) {
    return (
      <div className="screen">
        <TabBarHeader title="내 손에 올려보기" onBack={goBack} />
        <div className="center-fill">
          {defaultFailed ? (
            <EmptyView
              message="AR 체험 화면에서 손가락별 네일팁을 골라주세요."
              buttonText="네일 고르러 가기"
              onButtonPress={() => navigate('/ar')}
            />
          ) : (
            <Spinner />
          )}
        </div>
      </div>
    );
  }

  const fail = (id: number, msg: string, e?: unknown) => {
    if (id !== run.current) return;
    if (e) console.warn(e);
    stopCamera();
    setError(msg);
    setPhase('error');
  };

  /** 정지 이미지(샘플·업로드)를 캔버스에 그리고 손을 찾아 네일을 합성한다 */
  const processStill = async (img: HTMLImageElement, src: Source) => {
    const id = ++run.current;
    stopCamera();
    setSource(src);
    setSummary(null);
    setError('');
    setNotice('');
    setPhase('loading');
    try {
      const [lm, sprites] = await Promise.all([loadHandLandmarker(), loadSprites(nailSet)]);
      if (id !== run.current) return;
      await setMode(lm, 'IMAGE');
      const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * k);
      const h = Math.round(img.naturalHeight * k);
      const base = document.createElement('canvas');
      base.width = w;
      base.height = h;
      base.getContext('2d')!.drawImage(img, 0, 0, w, h);
      const res = detectImage(lm, base);
      if (id !== run.current) return;
      const canvas = canvasRef.current!;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(base, 0, 0);
      const { summary: s, hands } = summarize(res, w, h, false);
      hands.forEach(({ pts, facing }) => facing !== 'palm' && drawNails(ctx, nailPlacements(pts), sprites));
      setSummary(s);
      setPhase('done');
    } catch (e) {
      fail(id, '손 인식을 시작하지 못했어요. 새로고침 후 다시 해 보세요.', e);
    }
  };

  const loadImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지를 열 수 없습니다'));
      img.src = url;
    });

  const startSample = async () => {
    try {
      await processStill(await loadImage(handImg), 'sample');
    } catch (e) {
      fail(run.current, '샘플 손 이미지를 불러오지 못했어요.', e);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      await processStill(await loadImage(url), 'photo');
    } catch (err) {
      fail(++run.current, '이 사진은 열 수 없어요. JPG·PNG 사진으로 다시 해 보세요.', err);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const startCamera = async (fm = facingMode) => {
    const id = ++run.current;
    stopCamera();
    setSource('camera');
    setSummary(null);
    setError('');
    setNotice('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice('이 브라우저에서는 실시간 카메라를 쓸 수 없어요(HTTPS·카메라 지원 필요). 사진으로 해 보세요.');
      setSource(null);
      setPhase('choose');
      return;
    }
    setPhase('loading');
    try {
      const [lm, sprites, media] = await Promise.all([
        loadHandLandmarker(),
        loadSprites(nailSet),
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: fm }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        }),
      ]);
      if (id !== run.current) {
        media.getTracks().forEach(t => t.stop());
        return;
      }
      stream.current = media;
      const video = videoRef.current!;
      video.srcObject = media;
      await video.play();
      await setMode(lm, 'VIDEO');
      if (id !== run.current) return;
      const mirror = media.getVideoTracks()[0]?.getSettings().facingMode !== 'environment';
      setPhase('live');
      loop(id, lm, video, sprites, mirror);
    } catch (e) {
      if (id !== run.current) return;
      stopCamera();
      const name = (e as { name?: string })?.name;
      setNotice(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? '카메라 권한이 없어 실시간 카메라를 켤 수 없어요. 사진으로 해 보세요.'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
            ? '사용할 수 있는 카메라가 없어요. 사진으로 해 보세요.'
            : '실시간 카메라를 켜지 못했어요. 사진으로 해 보세요.',
      );
      if (e) console.warn(e);
      setSource(null);
      setPhase('choose');
    }
  };

  const loop = (
    id: number,
    lm: Awaited<ReturnType<typeof loadHandLandmarker>>,
    video: HTMLVideoElement,
    sprites: Sprites,
    mirror: boolean,
  ) => {
    let lastTime = -1;
    let lastKey = '';
    const tick = () => {
      if (id !== run.current) return;
      raf.current = requestAnimationFrame(tick);
      if (video.readyState < 2 || video.currentTime === lastTime) return;
      lastTime = video.currentTime;
      const w = video.videoWidth;
      const h = video.videoHeight;
      const canvas = canvasRef.current;
      if (!canvas || !w || !h) return;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const res = detectVideo(lm, video, performance.now());
      const ctx = canvas.getContext('2d')!;
      ctx.save();
      if (mirror) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();
      const { summary: s, hands } = summarize(res, w, h, mirror);
      hands.forEach(({ pts, facing }) => facing !== 'palm' && drawNails(ctx, nailPlacements(pts), sprites));
      const key = `${s.hands}/${s.back}/${s.palm}`;
      if (key !== lastKey) {
        lastKey = key;
        setSummary(s);
      }
    };
    tick();
  };

  /** 실시간 화면을 멈춰 지금 장면을 결과로 남긴다 */
  const capture = () => {
    run.current++;
    stopCamera();
    setPhase('done');
  };

  const save = () => {
    canvasRef.current?.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `nailian-ar-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/png');
  };

  const reset = () => {
    run.current++;
    stopCamera();
    setSource(null);
    setSummary(null);
    setError('');
    setPhase('choose');
  };

  const showCanvas = phase === 'live' || phase === 'done' || (phase === 'loading' && source !== 'camera');
  const message = phase === 'error' ? error : guide(phase, summary);

  return (
    <div className="screen tryon-screen">
      <TabBarHeader title="내 손에 올려보기" onBack={goBack} />
      <div className="scroll tryon-body">
        {isDefault && (
          <p className="tryon-default">
            기본 시안으로 시작했어요 ·{' '}
            <button className="tryon-link" onClick={() => navigate('/ar')}>
              바꾸기
            </button>
          </p>
        )}
        <div className="tryon-tips" aria-label="고른 네일팁">
          {FINGERS.map(f => (
            <div key={f} className="tryon-tip">
              {nailSet[f] ? <img src={nailSet[f]!.imageUrl} alt="" /> : <span className="tryon-tip-empty" />}
              <span>{FINGER_LABEL[f]}</span>
            </div>
          ))}
        </div>

        <div
          className="tryon-view"
          data-phase={phase}
          data-hands={summary?.hands ?? ''}
          data-back={summary?.back ?? ''}
          data-palm={summary?.palm ?? ''}
        >
          <canvas ref={canvasRef} className="tryon-canvas" hidden={!showCanvas} aria-label="네일 합성 결과" />
          <video ref={videoRef} className="tryon-video" playsInline muted />
          {phase === 'loading' && (
            <div className="tryon-loading">
              <Spinner />
            </div>
          )}
          {(phase === 'choose' || phase === 'error') && (
            <div className="tryon-choose">
              <p className="tryon-choose-title">어떤 손에 올려볼까요?</p>
              <button className="tryon-btn is-primary" onClick={startSample}>
                샘플 손으로 해보기
              </button>
              <button className="tryon-btn" onClick={() => fileRef.current?.click()}>
                내 손 사진 올리기
              </button>
              {coarse && (
                <button className="tryon-btn" onClick={() => captureRef.current?.click()}>
                  카메라로 찍어 올리기
                </button>
              )}
              <button className="tryon-btn" onClick={() => startCamera()}>
                실시간 카메라
              </button>
              {notice && (
                <p className="tryon-notice" role="alert">
                  {notice}
                </p>
              )}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <input ref={captureRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
        </div>

        {message && (
          <p className={`tryon-guide ${phase === 'error' ? 'is-error' : ''}`} role="status" aria-live="polite">
            {message}
          </p>
        )}

        <div className="tryon-actions">
          {phase === 'live' && (
            <>
              <button className="tryon-btn is-primary" onClick={capture}>
                이 장면 찍기
              </button>
              <button
                className="tryon-btn"
                onClick={() => {
                  const next = facingMode === 'environment' ? 'user' : 'environment';
                  setFacingMode(next);
                  startCamera(next);
                }}
              >
                카메라 전환
              </button>
            </>
          )}
          {phase === 'done' && (
            <button className="tryon-btn is-primary" onClick={save}>
              결과 이미지 저장
            </button>
          )}
          {(phase === 'live' || phase === 'done') && (
            <button className="tryon-btn" onClick={reset}>
              다른 손으로 해보기
            </button>
          )}
        </div>

        <ul className="tryon-notes">
          <li>사진과 카메라 화면은 이 브라우저 안에서만 처리되고, 서버로 보내지 않아요.</li>
          <li>손등이 보이게, 손가락을 펴고 찍으면 가장 자연스러워요.</li>
          <li>
            웹용으로 다시 만든 기능이에요. 손가락 마디 위치(MediaPipe 손 인식)로 손톱 자리를 추정해서, 원본 iOS
            앱(손톱 검출·분할 모델)보다 위치·크기가 덜 정확할 수 있어요.
          </li>
        </ul>
      </div>
    </div>
  );
}
