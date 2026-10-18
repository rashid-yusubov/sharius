const iconProps = {
  'aria-hidden': 'true',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 2,
  viewBox: '0 0 24 24',
};

const materialIconProps = {
  'aria-hidden': 'true',
  fill: 'currentColor',
  viewBox: '0 -960 960 960',
};

export function MagicIcon() {
  return (
    <svg {...materialIconProps}>
      <path d="m176-120-56-56 301-302-181-45 198-123-17-234 179 151 216-88-87 217 151 178-234-16-124 198-45-181-301 301Zm24-520-80-80 80-80 80 80-80 80Zm355 197 48-79 93 7-60-71 35-86-86 35-71-59 7 92-79 49 90 22 23 90Zm165 323-80-80 80-80 80 80-80 80ZM569-570Z" />
    </svg>
  );
}

export function QrIcon() {
  return (
    <svg {...materialIconProps}>
      <path d="M80-680v-200h200v80H160v120H80Zm0 600v-200h80v120h120v80H80Zm600 0v-80h120v-120h80v200H680Zm120-600v-120H680v-80h200v200h-80ZM700-260h60v60h-60v-60Zm0-120h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm120-120h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm240-320v240H520v-240h240ZM440-440v240H200v-240h240Zm0-320v240H200v-240h240Zm-60 500v-120H260v120h120Zm0-320v-120H260v120h120Zm320 0v-120H580v120h120Z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg {...materialIconProps}>
      <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
    </svg>
  );
}

export function ClipboardIcon() {
  return (
    <svg {...materialIconProps}>
      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h167q11-35 43-57.5t70-22.5q40 0 71.5 22.5T594-840h166q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560h-80v120H280v-120h-80v560Zm308.5-571.5Q520-783 520-800t-11.5-28.5Q497-840 480-840t-28.5 11.5Q440-817 440-800t11.5 28.5Q463-760 480-760t28.5-11.5Z" />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg {...materialIconProps}>
      <path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SyncIcon() {
  return (
    <svg {...materialIconProps}>
      <path d="M280-80 120-240l160-160 56 58-62 62h406v-160h80v240H274l62 62-56 58Zm-80-440v-240h486l-62-62 56-58 160 160-160 160-56-58 62-62H280v160h-80Z" />
    </svg>
  );
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

export function ChevronLeftIcon() {
  return (
    <svg {...iconProps}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg {...iconProps}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function EyeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
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

export function TranslateIcon() {
  return (
    <svg {...iconProps}>
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
