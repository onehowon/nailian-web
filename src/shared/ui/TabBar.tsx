import type { ReactNode } from 'react';
import Icon, { type IconName } from './Icon';
import { navigate, replace } from '../lib/router';

// 원본 shared/ui/TabBar 의 헤더·하단 탭
export function TabBarHeader({
  title,
  onBack,
  rightContent,
}: {
  title: string;
  onBack?: () => void;
  rightContent?: ReactNode;
}) {
  return (
    <div className="tb-header">
      {onBack && (
        <button className="tb-back" onClick={onBack} aria-label="뒤로 가기">
          <Icon name="arrowLeft" size={48} color="var(--gray900)" />
        </button>
      )}
      <h1 className="tb-title">{title}</h1>
      {rightContent && <div className="tb-right">{rightContent}</div>}
    </div>
  );
}

type TabType = 'home' | 'ar_experience' | 'my_page';
const TAB_DATA: { id: TabType; label: string; icon: IconName; route: string }[] = [
  { id: 'home', label: '홈', icon: 'home', route: '/' },
  { id: 'ar_experience', label: 'AR 체험', icon: 'ar', route: '/ar' },
  { id: 'my_page', label: '마이', icon: 'my', route: '/my' },
];

export function TabBarFooter({ activeTab }: { activeTab: TabType }) {
  return (
    <nav className="tb-footer" aria-label="하단 탭">
      {TAB_DATA.map(t => (
        <button
          key={t.id}
          className={`tb-tab ${activeTab === t.id ? 'is-active' : ''}`}
          aria-current={activeTab === t.id ? 'page' : undefined}
          onClick={() => {
            if (t.id === activeTab) return;
            // 탭 이동은 쌓지 않고 교체 (원본도 탭 간 이동은 navigate 로 같은 화면을 재사용)
            if (t.id === 'home') replace('/');
            else navigate(t.route);
          }}
        >
          <Icon name={t.icon} size={24} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
