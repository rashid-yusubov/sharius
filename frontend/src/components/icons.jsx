import contentCopyIcon from '../assets/icons/content-copy.svg';
import contentPasteIcon from '../assets/icons/content-paste.svg';
import deleteIcon from '../assets/icons/delete.svg';
import qrCodeScannerIcon from '../assets/icons/qr-code-scanner.svg';
import repeatIcon from '../assets/icons/repeat.svg';
import wandStarsIcon from '../assets/icons/wand-stars.svg';

const iconProps = {
  'aria-hidden': 'true',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 2,
  viewBox: '0 0 24 24',
};

function AssetIcon({ src }) {
  return <span aria-hidden="true" className="asset-icon" style={{ '--asset-icon-url': `url(${src})` }} />;
}

export function MagicIcon() {
  return <AssetIcon src={wandStarsIcon} />;
}

export function QrIcon() {
  return <AssetIcon src={qrCodeScannerIcon} />;
}

export function TrashIcon() {
  return <AssetIcon src={deleteIcon} />;
}

export function ClipboardIcon() {
  return <AssetIcon src={contentPasteIcon} />;
}

export function CopyIcon() {
  return <AssetIcon src={contentCopyIcon} />;
}

export function PlusIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SyncIcon() {
  return <AssetIcon src={repeatIcon} />;
}

export function ArrowUpIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

export function ArrowDownIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 5v14" />
      <path d="m5 12 7 7 7-7" />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a7 7 0 1 0 11 11Z" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg {...iconProps}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function FileIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

export function ImageFileIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8" cy="10" r="1.5" />
      <path d="m21 16-5.2-5.2a2 2 0 0 0-2.8 0L5 18" />
    </svg>
  );
}

export function PdfFileIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v5h5" />
      <path d="M8 17v-4h2a1.4 1.4 0 0 1 0 2H8M12 17v-4h1.4a2 2 0 0 1 0 4H12M16 17v-4h2" />
    </svg>
  );
}

export function VideoFileIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m10 9 5 3-5 3Z" />
    </svg>
  );
}

export function AudioFileIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9 18V5l10-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  );
}

export function ArchiveFileIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 2h12v20H6z" />
      <path d="M10 2v4M14 2v4M10 10h4M10 14h4" />
    </svg>
  );
}

export function CodeFileIcon() {
  return (
    <svg {...iconProps}>
      <path d="m9 18-6-6 6-6" />
      <path d="m15 6 6 6-6 6" />
    </svg>
  );
}

export function DocumentFileIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v5h5" />
      <path d="M8 13h8M8 17h6M8 9h2" />
    </svg>
  );
}

export function SpreadsheetFileIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v5h5" />
      <path d="M8 12h8M8 16h8M11 9v10M15 12v7" />
    </svg>
  );
}
