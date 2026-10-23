import { useEffect, useState } from 'react';
import Icon from '../../shared/ui/Icon';
import { TabBarHeader } from '../../shared/ui/TabBar';
import type { Category, Color, Shape } from '../../shared/api/types';
import onecolor from '../../assets/images/onecolor_nukki.png';
import french from '../../assets/images/french_nukki.png';
import gradient from '../../assets/images/gradient_nukki.png';
import art from '../../assets/images/art_nukki.png';
import imgSquare from '../../assets/images/img_square.png';
import imgRound from '../../assets/images/img_round.png';
import imgAlmond from '../../assets/images/img_almond.png';
import imgBallet from '../../assets/images/img_ballet.png';
import imgStill from '../../assets/images/img_still.png';

export interface FilterValues {
  category?: Category;
  color?: Color;
  shape?: Shape;
}

// 원본 features/filter/model/filterData.ts
const categoryItems: { id: Category; name: string; image: string }[] = [
  { id: 'ONE_COLOR', name: '원컬러', image: onecolor },
  { id: 'FRENCH', name: '프렌치', image: french },
  { id: 'GRADIENT', name: '그라데이션', image: gradient },
  { id: 'ART', name: '아트', image: art },
];
const colorItems: { id: Color; name: string; color: string }[] = [
  { id: 'WHITE', name: '화이트', color: '#FFFFFF' },
  { id: 'BLACK', name: '블랙', color: '#111111' },
  { id: 'BEIGE', name: '베이지', color: '#F7EDD1' },
  { id: 'PINK', name: '핑크', color: '#FFBBD3' },
  { id: 'YELLOW', name: '옐로우', color: '#FFF53A' },
  { id: 'GREEN', name: '그린', color: '#CDFB90' },
  { id: 'BLUE', name: '블루', color: '#CADCFF' },
  { id: 'SILVER', name: '실버', color: '#EAEAEA' },
];
const shapeItems: { id: Shape; name: string; image: string }[] = [
  { id: 'SQUARE', name: '스퀘어', image: imgSquare },
  { id: 'ROUND', name: '라운드', image: imgRound },
  { id: 'ALMOND', name: '아몬드', image: imgAlmond },
  { id: 'BALLERINA', name: '발레리나', image: imgBallet },
  { id: 'STILETTO', name: '스틸레토', image: imgStill },
];

type Tab = 'category' | 'color' | 'shape';
const TAB_LABEL: Record<Tab, string> = { category: '카테고리', color: '색상', shape: '쉐입' };

const same = (a: FilterValues, b: FilterValues) =>
  a.category === b.category && a.color === b.color && a.shape === b.shape;

// 원본 pages/ar_experience/ui/FilterModal
export default function FilterModal({
  visible,
  initialValues,
  onClose,
  onApply,
}: {
  visible: boolean;
  initialValues: FilterValues;
  onClose: () => void;
  onApply: (v: FilterValues) => void;
}) {
  const [tab, setTab] = useState<Tab>('category');
  const [values, setValues] = useState<FilterValues>(initialValues);

  useEffect(() => {
    if (visible) setValues(initialValues);
  }, [visible, initialValues]);

  const toggle = <K extends keyof FilterValues>(key: K, v: FilterValues[K]) =>
    setValues(prev => {
      const next = { ...prev };
      if (prev[key] === v) delete next[key];
      else next[key] = v;
      return next;
    });

  return (
    <div className={`filter-modal ${visible ? 'is-open' : ''}`} aria-hidden={!visible}>
      <TabBarHeader title="필터" onBack={onClose} />
      <div className="filter-tabs" role="tablist">
        {(Object.keys(TAB_LABEL) as Tab[]).map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`filter-tab ${tab === t ? 'is-active' : ''}`}
            onClick={() => setTab(t)}
          >
            <span>{TAB_LABEL[t]}</span>
            <i />
          </button>
        ))}
      </div>
      <div className="filter-divider" />
      <div className="filter-content">
        {tab === 'category' && (
          <div className="filter-cards">
            {categoryItems.map(it => (
              <FilterCard
                key={it.id}
                label={it.name}
                image={it.image}
                selected={values.category === it.id}
                onPress={() => toggle('category', it.id)}
              />
            ))}
          </div>
        )}
        {tab === 'color' && (
          <div>
            {colorItems.map(it => (
              <button key={it.id} className="list-item" onClick={() => toggle('color', it.id)}>
                <span className="list-item-content">
                  <span
                    className={`color-circle ${it.id === 'WHITE' ? 'is-white' : ''}`}
                    style={{ background: it.color }}
                  />
                  <span className={values.color === it.id ? 'purple' : ''}>{it.name}</span>
                </span>
                <span className="list-check">
                  {values.color === it.id && <Icon name="check" size={18} color="var(--purple500)" />}
                </span>
              </button>
            ))}
          </div>
        )}
        {tab === 'shape' && (
          <div className="filter-cards">
            {shapeItems.map(it => (
              <FilterCard
                key={it.id}
                label={it.name}
                image={it.image}
                selected={values.shape === it.id}
                onPress={() => toggle('shape', it.id)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="filter-apply">
        <button
          className="btn-secondary-medium"
          disabled={same(values, initialValues)}
          onClick={() => onApply(values)}
        >
          적용하기
        </button>
      </div>
    </div>
  );
}

function FilterCard({
  label,
  image,
  selected,
  onPress,
}: {
  label: string;
  image: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <button className={`filter-card ${selected ? 'is-selected' : ''}`} onClick={onPress} aria-pressed={selected}>
      {selected && <Icon name="check" size={18} color="var(--purple500)" className="filter-card-check" />}
      <img src={image} alt="" />
      <span>{label}</span>
    </button>
  );
}
