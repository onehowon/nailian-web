import { useState } from 'react';
import Icon from '../shared/ui/Icon';
import NailSet from '../shared/ui/NailSet';
import { TabBarHeader } from '../shared/ui/TabBar';
import { Spinner } from '../shared/ui/misc';
import { useInfinite, useQuery } from '../shared/lib/useQuery';
import { goBack, navigate, replace } from '../shared/lib/router';
import { toast } from '../shared/lib/toast';
import {
  deleteUserNailSet,
  fetchNailSetDetail,
  fetchSimilarNailSets,
  fetchUserNailSets,
  saveUserNailSet,
} from '../shared/api/endpoints';
import { APIError } from '../shared/api/types';
import { STYLE_KEYS, STYLE_NAMES } from '../mocks/data/styles';

// 원본 pages/nail_set/detail
export default function NailSetDetail({
  nailSetId,
  styleId,
  bookmarkMode,
}: {
  nailSetId: number;
  styleId: number;
  bookmarkMode: boolean;
}) {
  const styleName = `${STYLE_NAMES[STYLE_KEYS[styleId]] ?? '추천 '}네일`;
  const detail = useQuery(() => fetchNailSetDetail(nailSetId), [nailSetId]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const similar = useInfinite(
    page =>
      bookmarkMode ? fetchUserNailSets(page, 10) : fetchSimilarNailSets(nailSetId, styleId, page, 10),
    [nailSetId, styleId, bookmarkMode],
  );
  const similarSets = bookmarkMode
    ? similar.items.filter(s => s.id !== nailSetId)
    : similar.items;

  const handleSave = async () => {
    try {
      await saveUserNailSet(nailSetId);
      toast.showToast('보관함에 저장되었습니다.', { iconType: 'check' });
    } catch (e) {
      if (e instanceof APIError && e.code === 409) toast.showToast('이미 저장된 네일입니다.');
      else toast.showToast('보관함 저장에 실패했습니다', { iconType: 'warn' });
    }
  };

  const handleDelete = async () => {
    setConfirmOpen(false);
    try {
      await deleteUserNailSet(nailSetId);
      toast.showToast('삭제되었습니다', { position: 'bottom' });
      goBack();
    } catch {
      toast.showToast('보관함에서 삭제 중 오류가 발생했습니다', { iconType: 'warn' });
    }
  };

  if (detail.loading) {
    return (
      <div className="screen center-fill">
        <Spinner />
      </div>
    );
  }
  if (detail.error || !detail.data?.data) {
    return (
      <div className="screen">
        <TabBarHeader title="" onBack={goBack} />
        <div className="center-fill error-text">
          {detail.error?.message ?? '데이터를 불러오는데 실패했습니다.'}
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <TabBarHeader
        title={bookmarkMode ? '아트 상세' : `${styleName} 상세`}
        onBack={goBack}
        rightContent={
          bookmarkMode ? (
            <button className="icon-btn" aria-label="보관함에서 삭제" onClick={() => setConfirmOpen(true)}>
              <Icon name="trash" size={24} color="var(--gray600)" />
            </button>
          ) : null
        }
      />
      <div
        className="scroll detail-scroll"
        onScroll={e => {
          const el = e.currentTarget;
          if (el.scrollTop + el.clientHeight > el.scrollHeight - 40) similar.fetchNextPage();
        }}
      >
        <div className="detail-display">
          <NailSet nailImages={detail.data.data} size="large" />
        </div>

        <div className="detail-buttons">
          {!bookmarkMode && (
            <button className="bookmark-btn" onClick={handleSave}>
              <Icon name="group" size={15} color="var(--white)" />
              <span>보관함에 저장</span>
            </button>
          )}
          {/* 웹 체험판 추가: 이 세트를 AR 체험(손 위 미리 보기)으로 바로 가져간다 */}
          <button
            className="tryon-btn"
            onClick={() => navigate(`/ar?set=${nailSetId}`)}
          >
            <Icon name="ar" size={18} color="var(--purple500)" />
            <span>손에 올려보기</span>
          </button>
        </div>

        <section className="similar">
          <h2 className="similar-title">
            {bookmarkMode ? '보관함에 있는 다른 아트' : '선택한 네일과 비슷한'}
          </h2>
          {similar.loading && similarSets.length === 0 ? (
            <div className="similar-empty">
              <Spinner size="small" />
            </div>
          ) : similar.error && similarSets.length === 0 ? (
            <div className="similar-empty error-text">{similar.error.message}</div>
          ) : similarSets.length === 0 ? (
            <div className="similar-empty gray-text">
              {bookmarkMode ? '보관함에 다른 네일 세트가 없습니다.' : '유사한 네일 세트가 없습니다.'}
            </div>
          ) : (
            <div className="similar-grid">
              {similarSets.map(s => (
                <NailSet
                  key={s.id}
                  nailImages={s}
                  onPress={() =>
                    replace(
                      bookmarkMode
                        ? `/detail/${s.id}?from=bookmark`
                        : `/detail/${s.id}?style=${styleId}`,
                    )
                  }
                />
              ))}
            </div>
          )}
          {similar.fetchingNext && (
            <div className="center-pad">
              <Spinner size="small" />
            </div>
          )}
        </section>
      </div>

      {confirmOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div className="confirm" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <p className="confirm-title">해당 아트를 삭제하시겠어요?</p>
            <div className="confirm-buttons">
              <button className="confirm-cancel" onClick={handleDelete}>
                삭제하기
              </button>
              <button className="confirm-ok" onClick={() => setConfirmOpen(false)}>
                돌아가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
