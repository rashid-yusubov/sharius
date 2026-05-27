import './ExchangeStats.css';

const formatTotalSize = (files) => {
  const total = files.reduce((sum, file) => sum + (file.size ?? file.size_bytes ?? 0), 0);
  if (!total) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(total) / Math.log(1024)), units.length - 1);
  const value = total / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
};

function ExchangeStats({ attachedFiles, message }) {
  const status = message.trim() || attachedFiles.length ? 'Ready' : 'Empty';

  return (
    <aside className="exchange-stats" aria-label="Exchange summary">
      <div className="exchange-stats__item">
        <span>Files</span>
        <strong>{attachedFiles.length}</strong>
      </div>
      <div className="exchange-stats__item">
        <span>Size</span>
        <strong>{formatTotalSize(attachedFiles)}</strong>
      </div>
      <div className={`exchange-stats__item exchange-stats__item--${status.toLowerCase()}`}>
        <span>Status</span>
        <strong>{status}</strong>
      </div>
    </aside>
  );
}

export default ExchangeStats;
