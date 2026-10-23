import { useEffect, useRef, useState } from 'react';
import Icon from '../../shared/ui/Icon';
import { TabBarHeader } from '../../shared/ui/TabBar';
import { EmptyView, Spinner } from '../../shared/ui/misc';
import { useInfinite } from '../../shared/lib/useQuery';
import { goBack } from '../../shared/lib/router';
import { toast } from '../../shared/lib/toast';
import { createUserNailSet, fetchNailSetDetail, fetchNails } from '../../shared/api/endpoints';
import { APIError, type FingerType, type NailTipItem, type SelectedNailSet } from '../../shared/api/types';
import NailOverlay from './NailOverlay';
import FilterModal, { type FilterValues } from './FilterModal';

// 원본 NailSelection 의 FINGER_MAP: 버튼은 소지 → 엄지 순서
const FINGER_MAP: { index: number; type: FingerType }[] = [
  { index: 0, type: 'pinky' },
  { index: 1, type: 'ring' },
  { index: 2, type: 'middle' },
  { index: 3, type: 'index' },
  { index: 4, type: 'thumb' },
];
const FINGER_LABEL: Record<FingerType, string> = {
  pinky: '소지',
  ring: '약지',
  middle: '중지',
  index: '검지',
  thumb: '엄지',
};

const isComplete = (s: SelectedNailSet): s is Required<SelectedNailSet> =>
  FINGER_MAP.every(f => !!s[f.type]);

// 원본 pages/ar_experience: 시안을 손가락별로 골라 손 이미지 위에서 미리 본다.
export default function ARExperience({ presetId }: { presetId?: number }) {
  const [nailSet, setNailSet] = useState<SelectedNailSet>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [lightbox, setLightbox] = useState(false);

  // 웹 체험판 추가: 상세 화면의 '손에 올려보기'로 들어오면 그 세트를 미리 채운다
  useEffect(() => {
    if (!presetId) return;
    fetchNailSetDetail(presetId)
      .then(res => {
        const d = res.data!;
        const next: SelectedNailSet = {};
        FINGER_MAP.forEach(({ type }) => {
          const t = d[type];
          if (t.id) next[type] = { id: t.id, imageUrl: t.imageUrl, shape: t.shape ?? 'ROUND' };
        });
        setNailSet(next);
      })
      .catch(() => toast.showToast('세트를 불러오지 못했습니다', { position: 'bottom' }));
  }, [presetId]);

  const nails = useInfinite(
    page =>
      fetchNails({
        page,
        size: 24,
        ...filters,
        random: Object.keys(filters).length ? 0 : 1,
      }),
    [filters.category, filters.color, filters.shape],
  );

  const handleFingerButton = (index: number) => {
    if (selected === index) {
      setSelected(null);
      return;
    }
    setSelected(index);
    setExpanded(true);
  };

  const handleDelete = (index: number) => {
    const type = FINGER_MAP[index].type;
    setNailSet(prev => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
    setSelected(null);
  };

  const handleNailItem = (item: NailTipItem) => {
    if (selected === null) {
      toast.showToast('먼저 위에서 손가락을 선택해주세요', { position: 'bottom' });
      return;
    }
    const type = FINGER_MAP[selected].type;
    setNailSet(prev => ({ ...prev, [type]: item }));
    const nextIdx = selected + 1;
    setSelected(nextIdx < FINGER_MAP.length ? nextIdx : null);
  };

  const handleSave = async () => {
    if (!isComplete(nailSet)) {
      toast.showToast('아트가 완성되어야 저장 가능합니다', { position: 'bottom' });
      return;
    }
    try {
      await createUserNailSet(nailSet);
      toast.showToast('보관함에 저장되었습니다', { position: 'bottom' });
    } catch (e) {
      if (e instanceof APIError && e.code === 409)
        toast.showToast('이미 저장된 아트입니다', { position: 'bottom' });
      else toast.showToast('저장에 실패했습니다', { position: 'bottom' });
    }
  };

  const handleArButton = () => {
    if (!isComplete(nailSet)) {
      toast.showToast('모든 손가락에 네일팁을 선택해주세요', { position: 'bottom' });
      return;
    }
    // 원본은 여기서 실시간 카메라 AR(ARCameraPage)로 넘어간다. 웹 체험판은 손 이미지 확대 보기로 대신한다.
    setLightbox(true);
    toast.showToast('실시간 카메라 AR은 iOS 앱에서만 제공돼요', { position: 'bottom' });
  };

  return (
    <div className="screen ar-screen">
      <TabBarHeader
        title=""
        onBack={goBack}
        rightContent={
          <button className="icon-btn" onClick={handleSave} aria-label="보관함에 저장">
            <Icon name="group" size={19} color="var(--gray600)" />
          </button>
        }
      />

      <div className="ar-main">
        <div className="ar-title">
          <h1>먼저, 나만의 아트를 만들어보세요</h1>
          <p>원하는 시안들을 골라 조합할 수 있어요</p>
        </div>
        <div className="ar-hand">
          <NailOverlay nailSet={nailSet} onPress={() => setLightbox(true)} />
        </div>
        <div className="ar-button-wrap">
          <button className="ar-button" onClick={handleArButton}>
            <Icon name="ar" size={26} color="var(--white)" />
            <span>내 손에 올려보기</span>
          </button>
        </div>
      </div>

      {/* 바텀시트 (원본 snapPoints 20% / 93%) */}
      {expanded && <div className="sheet-backdrop" onClick={() => setExpanded(false)} />}
      <BottomSheet expanded={expanded} onExpandedChange={setExpanded}>
        <div className="sel" onClick={() => setSelected(null)}>
          <div className="sel-fixed">
            <div className="nail-buttons">
              {FINGER_MAP.map(({ index, type }) => (
                <NailAddButton
                  key={type}
                  label={FINGER_LABEL[type]}
                  isSelected={selected === index}
                  imageUrl={nailSet[type]?.imageUrl}
                  onPress={() => handleFingerButton(index)}
                  onDelete={() => handleDelete(index)}
                />
              ))}
            </div>
            <div className="filter-row">
              <button
                className="filter-button"
                onClick={e => {
                  e.stopPropagation();
                  setFilterOpen(true);
                }}
              >
                <Icon name="filter" size={20} />
                <span>필터</span>
                {Object.keys(filters).length > 0 && <i className="filter-dot" />}
              </button>
            </div>
          </div>
          <div
            className="nail-grid-scroll"
            onScroll={e => {
              const el = e.currentTarget;
              if (el.scrollTop + el.clientHeight >= el.scrollHeight * 0.8) nails.fetchNextPage();
            }}
          >
            {nails.loading && nails.items.length === 0 ? (
              <div className="center-pad">
                <Spinner />
              </div>
            ) : nails.items.length === 0 ? (
              <div className="center-pad">
                <EmptyView
                  message="조건에 맞는 네일이 없어요."
                  buttonText="필터 초기화"
                  onButtonPress={() => setFilters({})}
                />
              </div>
            ) : (
              <div className="nail-grid">
                {nails.items.map(item => (
                  <button
                    key={item.id}
                    className="nail-item"
                    onClick={e => {
                      e.stopPropagation();
                      handleNailItem(item);
                    }}
                    aria-label={`네일팁 ${item.id}`}
                  >
                    <img src={item.imageUrl} alt="" draggable={false} />
                  </button>
                ))}
              </div>
            )}
            {nails.fetchingNext && (
              <div className="center-pad">
                <Spinner />
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      <FilterModal
        visible={filterOpen}
        initialValues={filters}
        onClose={() => setFilterOpen(false)}
        onApply={v => {
          setFilterOpen(false);
          setFilters(v);
        }}
      />

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(false)} role="dialog" aria-label="손 이미지 크게 보기">
          <div className="lightbox-inner">
            <NailOverlay nailSet={nailSet} maxScale={2} />
          </div>
          <p className="lightbox-hint">화면을 누르면 닫혀요</p>
        </div>
      )}
    </div>
  );
}

function NailAddButton({
  label,
  isSelected,
  imageUrl,
  onPress,
  onDelete,
}: {
  label: string;
  isSelected: boolean;
  imageUrl?: string;
  onPress: () => void;
  onDelete: () => void;
}) {
  const hasImage = !!imageUrl;
  const cls = [
    'nail-add',
    isSelected ? 'is-selected' : '',
    hasImage ? 'has-image' : '',
  ].join(' ');
  return (
    <div className="nail-add-wrap">
      <button
        className={cls}
        aria-label={`${label} 네일 ${hasImage ? '변경' : '선택'}`}
        aria-pressed={isSelected}
        onClick={e => {
          e.stopPropagation();
          onPress();
        }}
      >
        {hasImage ? (
          <img src={imageUrl} alt="" className={isSelected ? 'is-dim' : ''} draggable={false} />
        ) : isSelected ? (
          <Icon name="check" size={18} color="var(--gray900)" />
        ) : (
          <Icon name="plus" size={12} />
        )}
      </button>
      {hasImage && isSelected && (
        <button
          className="nail-add-delete"
          aria-label={`${label} 네일 지우기`}
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Icon name="del" size={20} />
        </button>
      )}
    </div>
  );
}

/** 접힘(20%) / 펼침(93%) 두 단계 바텀시트. 손잡이를 누르거나 끌어서 바꾼다. */
function BottomSheet({
  expanded,
  onExpandedChange,
  children,
}: {
  expanded: boolean;
  onExpandedChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; moved: boolean } | null>(null);
  const [dy, setDy] = useState(0);

  return (
    <div
      ref={sheet}
      className={`sheet ${expanded ? 'is-expanded' : ''} ${drag.current ? 'is-dragging' : ''}`}
      style={dy ? { transform: `translateY(calc(var(--sheet-y) + ${dy}px))` } : undefined}
    >
      <div
        className="sheet-handle"
        role="button"
        tabIndex={0}
        aria-label={expanded ? '시안 목록 접기' : '시안 목록 펼치기'}
        aria-expanded={expanded}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExpandedChange(!expanded);
          }
        }}
        onPointerDown={e => {
          drag.current = { y: e.clientY, moved: false };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={e => {
          if (!drag.current) return;
          const d = e.clientY - drag.current.y;
          if (Math.abs(d) > 4) drag.current.moved = true;
          setDy(d);
        }}
        onPointerUp={e => {
          const d = drag.current ? e.clientY - drag.current.y : 0;
          const moved = drag.current?.moved;
          drag.current = null;
          setDy(0);
          if (!moved) onExpandedChange(!expanded);
          else if (d < -40) onExpandedChange(true);
          else if (d > 40) onExpandedChange(false);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDy(0);
        }}
      >
        <span className="sheet-indicator" />
      </div>
      <div className="sheet-body">{children}</div>
    </div>
  );
}
