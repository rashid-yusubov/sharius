import IconButton from './IconButton.jsx';
import QrCodeModal from './QrCodeModal.jsx';
import { MagicIcon, QrIcon } from './icons.jsx';
import './QuickAccess.css';

function QuickAccess({ code, isQrOpen, onCodeChange, onGenerateCode, onQrClose, onQrOpen }) {
  return (
    <section className="quick-access" aria-label="Quick access code">
      <div className="quick-access__field glass-panel">
        <input
          aria-label="Quick access code"
          className="quick-access__input"
          onChange={(event) => onCodeChange(event.target.value)}
          placeholder="Enter quick access code..."
          type="text"
          value={code}
        />
        <div className="quick-access__actions">
          <IconButton label="Generate code" onClick={onGenerateCode} variant="ghost">
            <MagicIcon />
          </IconButton>
          <IconButton label="Show QR code" onClick={onQrOpen} variant="ghost">
            <QrIcon />
          </IconButton>
        </div>
      </div>
      <QrCodeModal isOpen={isQrOpen} onClose={onQrClose} value={code} />
    </section>
  );
}

export default QuickAccess;
