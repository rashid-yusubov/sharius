import { useMemo, useState } from 'react';
import {
  ArchiveFileIcon,
  ArrowDownIcon,
  AudioFileIcon,
  CloseIcon,
  CodeFileIcon,
  DocumentFileIcon,
  FileIcon,
  ImageFileIcon,
  PdfFileIcon,
  SpreadsheetFileIcon,
  VideoFileIcon,
} from './icons.jsx';
import { getSessionFilePreviewUrl } from '../api/sessions.js';
import './FileChip.css';

const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'go', 'rs', 'php', 'c', 'cpp', 'sh', 'sql', 'yml', 'yaml'];
const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
const spreadsheetExtensions = ['xls', 'xlsx', 'csv', 'ods'];
const documentExtensions = ['doc', 'docx', 'txt', 'rtf', 'md', 'odt'];

const getExtension = (fileName = '') => fileName.split('.').pop()?.toLowerCase() || '';

const getFileKind = (file) => {
  const extension = getExtension(file.name || file.original_name);
  const type = file.type || file.mime_type || '';

  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (archiveExtensions.includes(extension)) return 'archive';
  if (spreadsheetExtensions.includes(extension)) return 'spreadsheet';
  if (codeExtensions.includes(extension)) return 'code';
  if (documentExtensions.includes(extension)) return 'document';
  return 'generic';
};

const iconByKind = {
  archive: ArchiveFileIcon,
  audio: AudioFileIcon,
  code: CodeFileIcon,
  document: DocumentFileIcon,
  generic: FileIcon,
  image: ImageFileIcon,
  pdf: PdfFileIcon,
  spreadsheet: SpreadsheetFileIcon,
  video: VideoFileIcon,
};

const formatFileSize = (size) => {
  if (!size) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
};

function FileChip({ file, index, onDownload, onPreview, onRemove, sessionCode }) {
  const [imageError, setImageError] = useState(false);
  const fileName = file.name || file.original_name || 'file';
  const fileSize = file.size ?? file.size_bytes ?? 0;
  const kind = getFileKind(file);
  const FileKindIcon = iconByKind[kind];
  const canDownload = Boolean(file.id && onDownload);

  const thumbUrl = useMemo(() => {
    if (kind !== 'image') return null;
    if (file.id && sessionCode) {
      return getSessionFilePreviewUrl(sessionCode, file.id);
    }
    if (file instanceof Blob) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file, kind, sessionCode]);

  const handleChipClick = () => {
    if (onPreview) {
      onPreview(file, index);
    }
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    onDownload?.(file);
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <div
      className={`file-chip file-chip--${kind}${onPreview ? ' file-chip--clickable' : ''}`}
      onClick={handleChipClick}
      title={`${fileName} (нажмите для предпросмотра)`}
      role={onPreview ? 'button' : undefined}
      tabIndex={onPreview ? 0 : undefined}
      onKeyDown={onPreview ? (e) => e.key === 'Enter' && handleChipClick() : undefined}
    >
      <span className="file-chip__icon" aria-hidden="true">
        {kind === 'image' && thumbUrl && !imageError ? (
          <img
            src={thumbUrl}
            alt=""
            className="file-chip__thumb"
            onError={() => setImageError(true)}
          />
        ) : (
          <FileKindIcon />
        )}
      </span>
      <span className="file-chip__meta">
        <span className="file-chip__name">{fileName}</span>
        <span className="file-chip__size">{formatFileSize(fileSize)}</span>
      </span>
      {canDownload ? (
        <button
          className="file-chip__action"
          onClick={handleDownloadClick}
          type="button"
          aria-label={`Download ${fileName}`}
          title="Download"
        >
          <ArrowDownIcon />
        </button>
      ) : null}
      <button
        className="file-chip__remove"
        onClick={handleRemoveClick}
        type="button"
        aria-label={`Remove ${fileName}`}
        title="Remove"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

export default FileChip;
