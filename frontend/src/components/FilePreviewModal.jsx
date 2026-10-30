import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, FileIcon } from './icons.jsx';
import { getSessionFileDownloadUrl, getSessionFilePreviewUrl } from '../api/sessions.js';
import './FilePreviewModal.css';

const textExtensions = ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'sh', 'yml', 'yaml', 'xml', 'sql', 'log'];

const getExtension = (fileName = '') => fileName.split('.').pop()?.toLowerCase() || '';

const getFileCategory = (file) => {
  const extension = getExtension(file.name || file.original_name);
  const type = file.type || file.mime_type || '';

  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension)) {
    return 'image';
  }
  if (type.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'mkv'].includes(extension)) {
    return 'video';
  }
  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(extension)) {
    return 'audio';
  }
  if (type === 'application/pdf' || extension === 'pdf') {
    return 'pdf';
  }
  if (type.startsWith('text/') || textExtensions.includes(extension)) {
    return 'text';
  }
  return 'other';
};

const formatFileSize = (size) => {
  if (!size) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
};

function FilePreviewModal({
  currentIndex = 0,
  files = [],
  isOpen,
  onClose,
  onDownload,
  onSelectIndex,
  sessionCode,
}) {
  const { t } = useTranslation();
  const [textContent, setTextContent] = useState('');
  const [isTextLoading, setIsTextLoading] = useState(false);

  const currentFile = files[currentIndex] || null;

  const previewUrl = useMemo(() => {
    if (!currentFile) return '';
    if (currentFile.id && sessionCode) {
      return getSessionFilePreviewUrl(sessionCode, currentFile.id);
    }
    if (currentFile instanceof Blob) {
      return URL.createObjectURL(currentFile);
    }
    return '';
  }, [currentFile, sessionCode]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const category = currentFile ? getFileCategory(currentFile) : 'other';
  const fileName = currentFile ? (currentFile.name || currentFile.original_name || 'file') : '';
  const fileSize = currentFile ? (currentFile.size ?? currentFile.size_bytes ?? 0) : 0;

  // Load text file content
  useEffect(() => {
    if (!isOpen || category !== 'text' || !previewUrl) {
      setTextContent('');
      return;
    }

    let isCancelled = false;
    setIsTextLoading(true);

    if (currentFile instanceof Blob && currentFile.text) {
      currentFile
        .text()
        .then((text) => {
          if (!isCancelled) {
            setTextContent(text.slice(0, 50000)); // Limit to 50KB for performance
            setIsTextLoading(false);
          }
        })
        .catch(() => {
          if (!isCancelled) setIsTextLoading(false);
        });
    } else {
      fetch(previewUrl)
        .then((res) => res.text())
        .then((text) => {
          if (!isCancelled) {
            setTextContent(text.slice(0, 50000));
            setIsTextLoading(false);
          }
        })
        .catch(() => {
          if (!isCancelled) setIsTextLoading(false);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen, category, previewUrl, currentFile]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onSelectIndex?.(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < files.length - 1) {
        onSelectIndex?.(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, files.length, onClose, onSelectIndex]);

  if (!isOpen || !currentFile) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < files.length - 1;

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload(currentFile);
    } else if (sessionCode && currentFile.id) {
      const url = getSessionFileDownloadUrl(sessionCode, currentFile.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="file-preview-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="File preview">
      <div className="file-preview-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="file-preview-header">
          <div className="file-preview-header__info">
            <span className="file-preview-header__title" title={fileName}>
              {fileName}
            </span>
            <span className="file-preview-header__meta">
              {formatFileSize(fileSize)}
              {files.length > 1 && (
                <span className="file-preview-header__counter">
                  • {currentIndex + 1} / {files.length}
                </span>
              )}
            </span>
          </div>

          <div className="file-preview-header__actions">
            <button
              className="file-preview-header__btn"
              onClick={handleDownloadClick}
              type="button"
              title="Download file"
              aria-label="Download"
            >
              <ArrowDownIcon />
            </button>
            <button
              className="file-preview-header__btn"
              onClick={onClose}
              type="button"
              title="Close (Esc)"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="file-preview-body">
          {category === 'image' && (
            <div className="file-preview-body__image-wrap">
              <img src={previewUrl} alt={fileName} className="file-preview-body__image" />
            </div>
          )}

          {category === 'video' && (
            <div className="file-preview-body__media-wrap">
              <video src={previewUrl} controls autoPlay playsInline className="file-preview-body__video">
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {category === 'audio' && (
            <div className="file-preview-body__audio-wrap">
              <div className="file-preview-body__audio-disc">🎵</div>
              <audio src={previewUrl} controls autoPlay className="file-preview-body__audio" />
            </div>
          )}

          {category === 'pdf' && (
            <div className="file-preview-body__pdf-wrap">
              <iframe src={previewUrl} title={fileName} className="file-preview-body__iframe" sandbox="allow-scripts" />
            </div>
          )}

          {category === 'text' && (
            <div className="file-preview-body__text-wrap">
              {isTextLoading ? (
                <div className="file-preview-body__loading">Loading text content...</div>
              ) : (
                <pre className="file-preview-body__code">
                  <code>{textContent || '(Empty file)'}</code>
                </pre>
              )}
            </div>
          )}

          {category === 'other' && (
            <div className="file-preview-body__other-wrap">
              <div className="file-preview-body__other-icon">
                <FileIcon />
              </div>
              <h3 className="file-preview-body__other-name">{fileName}</h3>
              <p className="file-preview-body__other-hint">
                Preview not available for this file type ({formatFileSize(fileSize)})
              </p>
              <button className="file-preview-body__download-cta" onClick={handleDownloadClick} type="button">
                <ArrowDownIcon />
                <span>Download file</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation arrows */}
        {hasPrev && (
          <button
            className="file-preview-nav file-preview-nav--prev"
            onClick={() => onSelectIndex?.(currentIndex - 1)}
            type="button"
            title="Previous file"
            aria-label="Previous file"
          >
            <ChevronLeftIcon />
          </button>
        )}

        {hasNext && (
          <button
            className="file-preview-nav file-preview-nav--next"
            onClick={() => onSelectIndex?.(currentIndex + 1)}
            type="button"
            title="Next file"
            aria-label="Next file"
          >
            <ChevronRightIcon />
          </button>
        )}
      </div>
    </div>
  );
}

export default FilePreviewModal;
