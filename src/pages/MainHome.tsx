import { useRef, useState } from 'react';
import Icon from '../shared/ui/Icon';
import NailSet from '../shared/ui/NailSet';
import { TabBarFooter } from '../shared/ui/TabBar';
import { Spinner } from '../shared/ui/misc';
import { useQuery } from '../shared/lib/useQuery';
import { navigate } from '../shared/lib/router';
import {
  fetchHomeBanners,
  fetchRecommendedNailSets,
  fetchUserProfile,
} from '../shared/api/endpoints';
import type { IBanner } from '../shared/api/types';

// 원본 pages/main_home
export default function MainHome() {
  const profile = useQuery(fetchUserProfile, []);
  const groups = useQuery(() => fetchRecommendedNailSets(), []);
  const nickname = profile.data?.data?.nickname ?? '';

  return (
    <div className="screen">
      <div className="scroll">
        <div className="home-top">
          <Icon name="logo" width={78} height={25} className="home-logo" />
        </div>
        <div className="home-content">
          <Banner />
          {/* 웹 체험판 추가: 링크로 들어온 사람이 바로 웹 AR을 해 볼 수 있게 */}
          <button className="home-tryon" onClick={() => navigate('/ar/try')}>
            <Icon name="ar" size={24} color="var(--white)" />
            <span className="home-tryon-text">
              <strong>내 손에 올려보기 (웹 AR)</strong>
              <span>샘플 손·사진·카메라로 바로 체험</span>
            </span>
            <Icon name="arrowRight" size={20} color="var(--white)" />
          </button>
          <h2 className="home-reco">
            <span className="purple">{nickname}</span>님을 위한
            <br />
            아트를 추천드려요
          </h2>
          {groups.loading && !groups.data ? (
            <div className="center-pad">
              <Spinner />
            </div>
          ) : (
            <div className="reco-list">
              {groups.data?.data?.map(g => (
                <section key={g.style.id} className="reco-section">
                  <button
                    className="reco-header"
                    onClick={() => navigate(`/feed/${g.style.id}`)}
                  >
                    <span>{g.style.name}네일 보러가기</span>
                    <Icon name="arrowRight" size={24} color="var(--gray400)" />
                  </button>
                  <div className="hscroll">
                    {g.nailSets.map(s => (
                      <NailSet
                        key={s.id}
                        nailImages={s}
                        onPress={() => navigate(`/detail/${s.id}?style=${g.style.id}`)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
        <footer className="home-footer">
          <p>문의 메일 : snail.official.kr@gmail.com</p>
          <div className="home-footer-notice">
            <p>유의사항</p>
            <p>• 체험판 네일 이미지는 원본 앱 에셋을 바탕으로 만든 샘플입니다.</p>
          </div>
        </footer>
      </div>
      <TabBarFooter activeTab="home" />
    </div>
  );
}

function Banner() {
  const { data } = useQuery(fetchHomeBanners, []);
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const banners = data?.data ?? [];

  const open = (b: IBanner) => {
    if (b.link.startsWith('#')) navigate(b.link.slice(1));
    else window.open(b.link, '_blank', 'noopener');
  };

  return (
    <div className="banner-wrap">
      <div
        className="banner"
        ref={ref}
        onScroll={e => {
          const el = e.currentTarget;
          setIdx(Math.round(el.scrollLeft / (el.clientWidth + 8)));
        }}
      >
        {banners.length === 0 && <div className="banner-item banner-skeleton" />}
        {banners.map(b => (
          <button key={b.id} className="banner-item" onClick={() => open(b)}>
            <img src={b.imageUrl} alt="샘플 배너" draggable={false} />
          </button>
        ))}
      </div>
      {banners.length > 1 && (
        <div className="dots">
          {banners.map((b, i) => (
            <button
              key={b.id}
              className={`dot ${i === idx ? 'is-active' : ''}`}
              aria-label={`배너 ${i + 1}`}
              onClick={() => ref.current?.scrollTo({ left: i * (331 + 8), behavior: 'smooth' })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
