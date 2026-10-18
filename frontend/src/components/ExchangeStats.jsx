import { useTranslation } from 'react-i18next';
import './ExchangeStats.css';

const formatTotalSize = (files) => {
  const total = files.reduce((sum, file) => sum + (file.size ?? file.size_bytes ?? 0), 0);
  if (!total) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(total) / Math.log(1024)), units.length - 1);
  const value = total / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
};

const formatExpiresIn = (expiresAt, t) => {
  if (!expiresAt) return t('stats.no_session');

  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(diffMs)) return t('stats.unknown');
  if (diffMs <= 0) return t('stats.expired');

  const totalSeconds = Math.ceil(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

function ExchangeStats({ attachedFiles, expiresAt, isSyncing, message, status, timerTick }) {
  const { t } = useTranslation();

  const statusKey = status || (isSyncing ? 'syncing' : (message.trim() || attachedFiles.length ? 'synced' : 'empty'));
  const statusText = t(`stats.${statusKey}`, { defaultValue: statusKey });

  void timerTick;
  const expiresText = formatExpiresIn(expiresAt, t);

  return (
    <aside className="exchange-stats" aria-label="Exchange summary">
      <div className="exchange-stats__item">
        <span>{t('stats.files')}</span>
        <strong>{attachedFiles.length}</strong>
      </div>
      <div className="exchange-stats__item">
        <span>{t('stats.size')}</span>
        <strong>{formatTotalSize(attachedFiles)}</strong>
      </div>
      <div className={`exchange-stats__item exchange-stats__item--${statusKey}`}>
        <span>{t('stats.status')}</span>
        <strong>{statusText}</strong>
      </div>
      <div className={`exchange-stats__item exchange-stats__item--${expiresText === t('stats.expired') ? 'expired' : 'timer'}`}>
        <span>{t('stats.expires')}</span>
        <strong>{expiresText}</strong>
      </div>
    </aside>
  );
}

export default ExchangeStats;
