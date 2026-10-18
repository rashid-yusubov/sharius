import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { CloseIcon, CopyIcon } from './icons.jsx';
import './QrCodeModal.css';

function QrCodeModal({ isOpen, onClose, value }) {
  const { t } = useTranslation();
  const [qrSource, setQrSource] = useState('');
  const [copied, setCopied] = useState(false);

  const trimmedCode = value?.trim().toUpperCase() || '';
  const shareUrl = typeof window !== 'undefined' && trimmedCode
    ? `${window.location.origin}/?code=${encodeURIComponent(trimmedCode)}`
    : trimmedCode;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    let isActive = true;

    if (!isOpen || !shareUrl) {
      setQrSource('');
      return undefined;
    }

    QRCode.toDataURL(shareUrl, {
      color: {
        dark: '#0a0a0b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 12,
      width: 360,
    }).then((source) => {
      if (isActive) setQrSource(source);
    });

    return () => {
      isActive = false;
    };
  }, [isOpen, shareUrl]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="qr-modal" aria-labelledby="qr-modal-title" aria-modal="true" role="dialog">
      <button className="qr-modal__backdrop" aria-label="Close QR overlay" onClick={onClose} type="button" />

      <div className="qr-modal__panel glass-panel">
        <button className="qr-modal__close" aria-label="Close QR code" onClick={onClose} type="button">
          <CloseIcon />
        </button>

        <div className="qr-modal__qr-frame">
          {qrSource ? <img alt={`QR code for session ${trimmedCode}`} className="qr-modal__image" src={qrSource} /> : null}
        </div>

        <div className="qr-modal__content">
          <p className="qr-modal__eyebrow">{t('qr.scan_to_connect')}</p>
          <h2 id="qr-modal-title">{t('qr.title')}</h2>
          <p className="qr-modal__code">{trimmedCode}</p>
          <button className="qr-modal__copy-link" onClick={handleCopyLink} type="button">
            <CopyIcon />
            <span>{copied ? t('qr.copied') : t('qr.copy_link')}</span>
          </button>
          <p className="qr-modal__hint">{t('qr.hint')}</p>
        </div>
      </div>
    </div>
  );
}

export default QrCodeModal;

