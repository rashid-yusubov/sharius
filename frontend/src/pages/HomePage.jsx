import ExchangePanel from '../components/ExchangePanel.jsx';
import ExchangeStats from '../components/ExchangeStats.jsx';
import QuickAccess from '../components/QuickAccess.jsx';

function HomePage({
  attachedFiles,
  code,
  fileInputRef,
  expiresAt,
  isSyncing,
  message,
  onDownloadFile,
  onClear,
  onCodeChange,
  onCopy,
  onFileChange,
  onFileClick,
  onFilesDrop,
  onGenerateCode,
  onMessageChange,
  onPaste,
  onQrClose,
  onQrOpen,
  onRemoveFile,
  onSend,
  onUpdate,
  isQrOpen,
  sessionStatusText,
  timerTick,
}) {
  return (
    <>
      <QuickAccess
        code={code}
        isQrOpen={isQrOpen}
        onCodeChange={onCodeChange}
        onGenerateCode={onGenerateCode}
        onQrClose={onQrClose}
        onQrOpen={onQrOpen}
      />
      <ExchangeStats attachedFiles={attachedFiles} expiresAt={expiresAt} message={message} timerTick={timerTick} />
      <ExchangePanel
        attachedFiles={attachedFiles}
        fileInputRef={fileInputRef}
        isBusy={isSyncing}
        message={message}
        onDownloadFile={onDownloadFile}
        onClear={onClear}
        onCopy={onCopy}
        onFileChange={onFileChange}
        onFileClick={onFileClick}
        onFilesDrop={onFilesDrop}
        onMessageChange={onMessageChange}
        onPaste={onPaste}
        onRemoveFile={onRemoveFile}
        onSend={onSend}
        onUpdate={onUpdate}
        sessionCode={code}
        statusText={sessionStatusText}
      />
    </>
  );
}

export default HomePage;
