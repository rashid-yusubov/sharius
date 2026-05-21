import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CloseIcon } from './icons.jsx';
import './QrCodeModal.css';

function QrCodeModal({ isOpen, onClose, value }) {
  const [qrSource, setQrSource] = useState('');

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

    if (!isOpen || !value.trim()) {
      setQrSource('');
      return undefined;
    }

    QRCode.toDataURL(value.trim(), {
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
  }, [isOpen, value]);

  if (!isOpen) return null;

  return (
    <div className="qr-modal" aria-labelledby="qr-modal-title" aria-modal="true" role="dialog">
      <button className="qr-modal__backdrop" aria-label="Close QR overlay" onClick={onClose} type="button" />

      <div className="qr-modal__panel glass-panel">
        <button className="qr-modal__close" aria-label="Close QR code" onClick={onClose} type="button">
          <CloseIcon />
        </button>

        <div className="qr-modal__qr-frame">
          {qrSource ? <img alt={`QR code for ${value}`} className="qr-modal__image" src={qrSource} /> : null}
        </div>

        <div className="qr-modal__content">
          <p className="qr-modal__eyebrow">Scan to connect</p>
          <h2 id="qr-modal-title">Quick access QR</h2>
          <p className="qr-modal__code">{value}</p>
          <p className="qr-modal__hint">The window will close automatically after backend scan confirmation.</p>
        </div>
      </div>
    </div>
  );
}

export default QrCodeModal;
