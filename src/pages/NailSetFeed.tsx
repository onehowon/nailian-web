import NailSet from '../shared/ui/NailSet';
import { TabBarHeader } from '../shared/ui/TabBar';
import { Spinner } from '../shared/ui/misc';
import { useInfinite } from '../shared/lib/useQuery';
import { goBack, navigate } from '../shared/lib/router';
import { fetchNailSetFeed } from '../shared/api/endpoints';
import { STYLE_KEYS, STYLE_NAMES } from '../mocks/data/styles';

const PAGE_SIZE = 10;

// 원본 pages/nail_set/feed
export default function NailSetFeed({ styleId }: { styleId: number }) {
  const styleName = `${STYLE_NAMES[STYLE_KEYS[styleId]] ?? ''}네일`;
  const q = useInfinite(page => fetchNailSetFeed(styleId, page, PAGE_SIZE), [styleId]);

  return (
    <div className="screen">
      <TabBarHeader title={styleName} onBack={goBack} />
      {q.loading && q.items.length === 0 ? (
        <div className="center-fill">
          <Spinner />
        </div>
      ) : q.error && q.items.length === 0 ? (
        <div className="center-fill error-text">{q.error.message}</div>
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
                onPress={() => navigate(`/detail/${s.id}?style=${styleId}`)}
              />
            ))}
          </div>
          {q.fetchingNext && (
            <div className="center-pad">
              <Spinner size="small" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
