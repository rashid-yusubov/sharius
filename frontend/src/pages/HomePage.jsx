import ExchangePanel from '../components/ExchangePanel.jsx';
import ExchangeStats from '../components/ExchangeStats.jsx';
import QuickAccess from '../components/QuickAccess.jsx';

function HomePage({
  attachedFiles,
  code,
  fileInputRef,
  isSyncing,
  message,
  onDownloadFile,
  onClear,
  onCodeChange,
  onCopy,
  onFileChange,
  onFileClick,
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
      <ExchangeStats attachedFiles={attachedFiles} message={message} />
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
