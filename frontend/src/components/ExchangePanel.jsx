import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import IconButton from './IconButton.jsx';
import FileChip from './FileChip.jsx';
import { ArrowUpIcon, ClipboardIcon, CopyIcon, PlusIcon, SyncIcon, TrashIcon } from './icons.jsx';
import './ExchangePanel.css';

function ExchangePanel({
  attachedFiles,
  fileInputRef,
  isBusy,
  message,
  onDownloadFile,
  onClear,
  onCopy,
  onFileChange,
  onFileClick,
  onFilesDrop,
  onMessageChange,
  onPaste,
  onRemoveFile,
  onSend,
  onUpdate,
}) {
  const { t } = useTranslation();
  const [isDragActive, setIsDragActive] = useState(false);
  const dragDepthRef = useRef(0);

  const extractFilesFromClipboard = (clipboardData) => {
    if (!clipboardData) return [];
    const files = [];

    if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        const file = clipboardData.files[i];
        if (file) files.push(file);
      }
    }

    if (files.length === 0 && clipboardData.items && clipboardData.items.length > 0) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            if (!file.name || file.name === 'image.png') {
              const ext = file.type?.split('/')[1] || 'png';
              const namedFile = new File([file], `screenshot-${Date.now()}.${ext}`, {
                type: file.type || 'image/png',
              });
              files.push(namedFile);
            } else {
              files.push(file);
            }
          }
        }
      }
    }

    return files;
  };

  const handlePasteCapture = (event) => {
    if (isBusy) return;

    const files = extractFilesFromClipboard(event.clipboardData);
    if (files.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      onFilesDrop?.(files);
    }
  };

  useEffect(() => {
    const handleWindowPaste = (event) => {
      if (isBusy) return;

      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          (activeEl.tagName === 'TEXTAREA' && !activeEl.classList.contains('exchange__textarea')))
      ) {
        return;
      }

      const files = extractFilesFromClipboard(event.clipboardData);
      if (files.length > 0) {
        event.preventDefault();
        onFilesDrop?.(files);
        return;
      }

      if (activeEl?.tagName !== 'TEXTAREA' && event.clipboardData) {
        const text = event.clipboardData.getData('text');
        if (text) {
          event.preventDefault();
          onMessageChange?.(message ? `${message}\n${text}` : text);
        }
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [isBusy, message, onFilesDrop, onMessageChange]);

  const hasDraggedFiles = (event) => {
    const types = Array.from(event.dataTransfer?.types || []);
    return types.includes('Files') || Boolean(event.dataTransfer?.files?.length);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isBusy && hasDraggedFiles(event)) {
      dragDepthRef.current += 1;
      setIsDragActive(true);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isBusy && hasDraggedFiles(event)) {
      event.dataTransfer.dropEffect = 'copy';
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragActive(false);

    if (isBusy) return;

    const files = Array.from(event.dataTransfer.files || []);
    onFilesDrop?.(files);
  };

  return (
    <section className="exchange" aria-label="Text exchange">
      <div
        className={`exchange__panel glass-panel${isDragActive ? ' exchange__panel--drag-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaste={handlePasteCapture}
      >
        <div className="exchange__drop-overlay" aria-hidden="true">
          <strong>{t('panel.drop_files')}</strong>
        </div>
        <div className="exchange__workspace">
          <div className="exchange__top-actions">
            <IconButton disabled={isBusy} label={t('panel.clear_text')} onClick={onClear} variant="panel">
              <TrashIcon />
            </IconButton>
            <IconButton disabled={isBusy} label={t('panel.paste')} onClick={onPaste} variant="panel">
              <ClipboardIcon />
            </IconButton>
            <IconButton label={t('panel.copy')} onClick={onCopy} variant="panel">
              <CopyIcon />
            </IconButton>
          </div>
          <textarea
            aria-label="Shared text"
            className="exchange__textarea"
            disabled={isBusy}
            onChange={(event) => onMessageChange(event.target.value)}
            onPaste={handlePasteCapture}
            placeholder={t('panel.placeholder')}
            value={message}
          />
        </div>

        <div className="exchange__bottom-actions">
          {attachedFiles.length > 0 && (
            <div className="exchange__file-list" aria-label="Attached files">
              {attachedFiles.map((file, index) => (
                <FileChip
                  file={file}
                  key={`${file.id || file.name || file.original_name}-${file.lastModified || file.created_at || index}`}
                  onDownload={file.id ? () => onDownloadFile(file) : undefined}
                  onRemove={() => onRemoveFile(index)}
                />
              ))}
            </div>
          )}

          <div className="exchange__controls">
            <div className="exchange__attachments">
              <input className="exchange__file-input" multiple onChange={onFileChange} ref={fileInputRef} type="file" />
              <IconButton disabled={isBusy} label={t('panel.add_file')} onClick={onFileClick} size="large" variant="muted">
                <PlusIcon />
              </IconButton>
            </div>

            <div className="exchange__send-actions">
              <IconButton disabled={isBusy} label={t('panel.update')} onClick={onUpdate} size="large" variant="dark">
                <SyncIcon />
              </IconButton>
              <IconButton disabled={isBusy} label={t('panel.send')} onClick={onSend} size="large" variant="primary">
                <ArrowUpIcon />
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExchangePanel;
