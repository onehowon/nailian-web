import { useEffect, useState } from 'react';
import Icon from './Icon';
import { toast, type ToastState } from '../lib/toast';

export function Spinner({ size = 'large' }: { size?: 'small' | 'large' }) {
  return <span className={`spinner spinner-${size}`} role="status" aria-label="불러오는 중" />;
}

export function EmptyView({
  message,
  buttonText,
  onButtonPress,
}: {
  message: string;
  buttonText: string;
  onButtonPress: () => void;
}) {
  return (
    <div className="empty-view">
      <p className="empty-text">{message}</p>
      <button className="chip-black" onClick={onButtonPress}>
        {buttonText}
      </button>
    </div>
  );
}

export function ToastHost() {
  const [t, setT] = useState<ToastState | null>(null);
  useEffect(() => toast.subscribe(setT), []);
  if (!t) return null;
  return (
    <div key={t.id} className={`toast toast-${t.position}`} role="status" aria-live="polite">
      {t.position === 'top' && (
        <Icon name="check" size={20} color={t.iconType === 'warn' ? 'var(--warn-red)' : 'var(--purple500)'} />
      )}
      <span>{t.message}</span>
    </div>
  );
}
