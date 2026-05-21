import ExchangePanel from '../components/ExchangePanel.jsx';
import ExchangeStats from '../components/ExchangeStats.jsx';
import QuickAccess from '../components/QuickAccess.jsx';

function HomePage({
  attachedFiles,
  code,
  fileInputRef,
  message,
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
        message={message}
        onClear={onClear}
        onCopy={onCopy}
        onFileChange={onFileChange}
        onFileClick={onFileClick}
        onMessageChange={onMessageChange}
        onPaste={onPaste}
        onRemoveFile={onRemoveFile}
        onSend={onSend}
        onUpdate={onUpdate}
      />
    </>
  );
}

export default HomePage;
