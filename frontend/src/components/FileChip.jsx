import {
  ArchiveFileIcon,
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
import './FileChip.css';

const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'go', 'rs', 'php'];
const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];
const spreadsheetExtensions = ['xls', 'xlsx', 'csv', 'ods'];
const documentExtensions = ['doc', 'docx', 'txt', 'rtf', 'md'];

const getExtension = (fileName) => fileName.split('.').pop()?.toLowerCase() || '';

const getFileKind = (file) => {
  const extension = getExtension(file.name);
  const type = file.type || '';

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

function FileChip({ file, onRemove }) {
  const kind = getFileKind(file);
  const FileKindIcon = iconByKind[kind];

  return (
    <div className={`file-chip file-chip--${kind}`}>
      <span className="file-chip__icon" aria-hidden="true">
        <FileKindIcon />
      </span>
      <span className="file-chip__meta">
        <span className="file-chip__name">{file.name}</span>
        <span className="file-chip__size">{formatFileSize(file.size)}</span>
      </span>
      <button className="file-chip__remove" onClick={onRemove} type="button" aria-label={`Remove ${file.name}`}>
        <CloseIcon />
      </button>
    </div>
  );
}

export default FileChip;
