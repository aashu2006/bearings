import { useState } from 'react';
import { X, Copy, Check, Download, FileText } from 'lucide-react';
import { ErrorState } from './ErrorState';

interface ExportModalProps {
  /** Null while the export is being generated. */
  markdown: string | null;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}

export function ExportModal({ markdown, error, onRetry, onClose }: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (markdown === null) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (markdown === null) return;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DUNE_CONTEXT.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="export-context-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-mono animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl bg-[#0A0B14] border border-[#3A2B33] shadow-2xl flex flex-col max-h-[85vh] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="h-12 border-b border-[#3A2B33] px-4 flex items-center justify-between shrink-0 bg-[#171833]/60">
          <div className="flex items-center gap-2 text-xs text-[#F0DFB4] font-bold tracking-wider uppercase">
            <FileText className="w-4 h-4 text-[#C89B6B]" />
            <span>EXPORT REPOSITORY CONTEXT (MARKDOWN)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#C89B6B] hover:text-[#F0DFB4] transition-colors cursor-pointer rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Markdown Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#0A0B14] text-xs">
          <div className="text-[11px] text-[#C89B6B] mb-2">
            Readable by humans and LLM coding agents via CLIs or prompts:
          </div>
          {error ? (
            <ErrorState title="EXPORT FAILED" reason={error} actionLabel="TRY AGAIN" onRetry={onRetry} />
          ) : markdown === null ? (
            <div className="p-3.5 bg-[#171833]/90 border border-[#3A2B33] rounded-lg space-y-2 animate-pulse">
              <div className="h-3 w-1/3 bg-[#241C2E] rounded" />
              <div className="h-3 w-full bg-[#241C2E] rounded" />
              <div className="h-3 w-5/6 bg-[#241C2E] rounded" />
              <div className="h-3 w-1/4 bg-[#241C2E] rounded mt-4" />
              <div className="h-3 w-11/12 bg-[#241C2E] rounded" />
            </div>
          ) : (
            <pre className="p-3.5 bg-[#171833]/90 border border-[#3A2B33] text-[#EAE2D4] font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed select-text rounded-lg">
              {markdown}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="h-14 border-t border-[#3A2B33] px-4 flex items-center justify-between shrink-0 bg-[#171833]/40">
          <button
            onClick={handleDownload}
            disabled={markdown === null}
            className="disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 border border-[#3A2B33] hover:bg-[#241C2E] text-[#EAE2D4] text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer rounded-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD .MD</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              id="btn-copy-markdown"
              onClick={handleCopy}
              disabled={markdown === null}
              className={`disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer rounded-lg ${
                copied
                  ? 'bg-emerald-500 text-[#0A0B14]'
                  : 'bg-[#F0DFB4] hover:bg-[#FFF5DD] text-[#0A0B14]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>COPY MARKDOWN</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
