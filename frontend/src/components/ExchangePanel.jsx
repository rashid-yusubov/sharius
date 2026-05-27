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
  onMessageChange,
  onPaste,
  onRemoveFile,
  onSend,
  onUpdate,
  sessionCode,
  statusText,
}) {
  return (
    <section className="exchange" aria-label="Text exchange">
      <div className="exchange__panel glass-panel">
        <div className="exchange__top-actions">
          <IconButton disabled={isBusy} label="Clear text" onClick={onClear} variant="panel">
            <TrashIcon />
          </IconButton>
          <IconButton disabled={isBusy} label="Paste from clipboard" onClick={onPaste} variant="panel">
            <ClipboardIcon />
          </IconButton>
          <IconButton label="Copy to clipboard" onClick={onCopy} variant="panel">
            <CopyIcon />
          </IconButton>
        </div>
        <div className="exchange__session-bar">
          <div className="exchange__session-meta">
            <span className={`exchange__status-dot${isBusy ? ' exchange__status-dot--busy' : ''}`} />
            <div>
              <p className="exchange__session-label">Active session</p>
              <strong>{sessionCode || 'Local draft'}</strong>
            </div>
          </div>
          <p className="exchange__session-hint">{statusText}</p>
        </div>
        <div className="exchange__workspace">
          <textarea
            aria-label="Shared text"
            className="exchange__textarea"
            disabled={isBusy}
            onChange={(event) => onMessageChange(event.target.value)}
            placeholder="Type or paste your text, links, or notes here for instant cross-device sharing..."
            value={message}
          />
        </div>

        <div className="exchange__bottom-actions">
          <div className="exchange__attachments">
            <input className="exchange__file-input" multiple onChange={onFileChange} ref={fileInputRef} type="file" />
            <IconButton disabled={isBusy} label="Add file" onClick={onFileClick} size="large" variant="muted">
              <PlusIcon />
            </IconButton>
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
          </div>

          <div className="exchange__send-actions">
            <IconButton disabled={isBusy} label="Update" onClick={onUpdate} size="large" variant="dark">
              <SyncIcon />
            </IconButton>
            <IconButton disabled={isBusy} label="Send" onClick={onSend} size="large" variant="primary">
              <ArrowUpIcon />
            </IconButton>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExchangePanel;
