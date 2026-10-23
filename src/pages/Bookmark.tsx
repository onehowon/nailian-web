import NailSet from '../shared/ui/NailSet';
import { TabBarFooter, TabBarHeader } from '../shared/ui/TabBar';
import { EmptyView, Spinner } from '../shared/ui/misc';
import { useInfinite } from '../shared/lib/useQuery';
import { navigate, replace } from '../shared/lib/router';
import { fetchUserNailSets } from '../shared/api/endpoints';

// 원본 pages/nail_set/bookmark (네일 보관함). 체험판에서는 '마이' 탭이 이 화면을 연다.
export default function Bookmark() {
  const q = useInfinite(page => fetchUserNailSets(page, 10), []);
  return (
    <div className="screen">
      <TabBarHeader title="네일 보관함" />
      {q.loading && q.items.length === 0 ? (
        <div className="center-fill">
          <Spinner />
        </div>
      ) : q.items.length === 0 ? (
        <div className="center-fill">
          <EmptyView
            message="저장된 아트가 없어요"
            buttonText="아트 둘러보기"
            onButtonPress={() => replace('/')}
          />
        </div>
      ) : (
        <div
          className="scroll"
          onScroll={e => {
            const el = e.currentTarget;
            if (el.scrollTop + el.clientHeight > el.scrollHeight * 0.7) q.fetchNextPage();
          }}
        >
          <div className="grid2">
            {q.items.map(s => (
              <NailSet
                key={s.id}
                nailImages={s}
                onPress={() => navigate(`/detail/${s.id}?from=bookmark`)}
              />
            ))}
          </div>
        </div>
      )}
      <TabBarFooter activeTab="my_page" />
    </div>
  );
}
