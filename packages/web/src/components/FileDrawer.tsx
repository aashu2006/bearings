import { useState, useEffect, useRef } from 'react';
import { X, FileCode, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import type { FileContentResponse } from '@dune/shared/types';
import { getFile } from '../api/repos';
import { ApiRequestError, errorMessage } from '../api/client';

interface FileDrawerProps {
  repoId: string;
  filePath: string | null;
  highlightLines?: [number, number] | null;
  onClose: () => void;
}

export function FileDrawer({
  repoId,
  filePath,
  highlightLines,
  onClose,
}: FileDrawerProps) {
  const [file, setFile] = useState<FileContentResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'not_found' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);
  const codeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filePath) return;

    let isMounted = true;
    setStatus('loading');

    getFile(repoId, filePath)
      .then((data) => {
        if (isMounted) {
          setFile(data);
          setStatus('loaded');
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setFile(null);
          // NOT_FOUND is a real answer — the path is not in the indexed set. Anything else
          // is a failure to fetch, which is worth retrying.
          const notFound = err instanceof ApiRequestError && err.code === 'NOT_FOUND';
          setStatus(notFound ? 'not_found' : 'error');
          setLoadError(notFound ? null : errorMessage(err));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [repoId, filePath, attempt]);

  // Scroll to cited line once loaded
  useEffect(() => {
    if (status === 'loaded' && highlightLines && codeContainerRef.current) {
      const targetLine = highlightLines[0];
      const lineEl = document.getElementById(`code-line-${targetLine}`);
      if (lineEl) {
        lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [status, highlightLines]);

  if (!filePath) return null;

  const handleCopy = () => {
    if (!file) return;
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = file ? file.content.split('\n') : [];

  return (
    <aside
      id="file-source-drawer"
      className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl bg-[#0A0B14] border-l border-[#3A2B33] shadow-2xl flex flex-col font-mono animate-in slide-in-from-right duration-200"
    >
      {/* Drawer Header */}
      <div className="h-12 border-b border-[#3A2B33] px-4 flex items-center justify-between shrink-0 bg-[#171833]/60">
        <div className="flex items-center gap-2 text-xs truncate">
          <FileCode className="w-4 h-4 text-[#C89B6B] shrink-0" />
          <span className="text-[#F0DFB4] font-semibold truncate">{filePath}</span>
          {highlightLines && (
            <span className="text-[10px] px-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 rounded">
              Lines {highlightLines[0]}–{highlightLines[1]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === 'loaded' && (
            <button
              onClick={handleCopy}
              className="p-1.5 text-[#C89B6B] hover:text-[#F0DFB4] transition-colors cursor-pointer rounded-md"
              title="Copy file contents"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            id="btn-close-file-drawer"
            onClick={onClose}
            className="p-1.5 text-[#C89B6B] hover:text-[#F0DFB4] transition-colors cursor-pointer rounded-md"
            title="Close drawer (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Content Body */}
      <div ref={codeContainerRef} className="flex-1 overflow-y-auto p-4 text-xs select-text">
        {status === 'loading' && (
          <div className="py-20 text-center text-[#C89B6B]">
            <div className="animate-pulse">Loading snapshot: {filePath}...</div>
          </div>
        )}

        {status === 'not_found' && (
          <div className="py-16 px-6 text-center max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-[#C89B6B] mx-auto mb-3" />
            <div className="text-sm font-bold text-[#F0DFB4] uppercase tracking-wider mb-2">
              SOURCE UNAVAILABLE
            </div>
            <p className="text-[#C89B6B] text-xs leading-relaxed mb-6">
              This file is not in the indexed snapshot. Only indexed source files can be opened here.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#171833] border border-[#57392C] hover:bg-[#241C2E] text-[#F0DFB4] text-xs tracking-wider uppercase transition-colors rounded-lg cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-16 px-6 text-center max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <div className="text-sm font-bold text-[#F0DFB4] uppercase tracking-wider mb-2">
              COULD NOT LOAD THIS FILE
            </div>
            <p className="text-[#C89B6B] text-xs leading-relaxed mb-6">{loadError}</p>
            <button
              onClick={() => setAttempt((n) => n + 1)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#171833] border border-[#57392C] hover:bg-[#241C2E] text-[#F0DFB4] text-xs tracking-wider uppercase transition-colors rounded-lg cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              TRY AGAIN
            </button>
          </div>
        )}

        {status === 'loaded' && (
          <div className="leading-relaxed font-mono">
            {lines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const isHighlighted =
                highlightLines &&
                lineNum >= highlightLines[0] &&
                lineNum <= highlightLines[1];

              return (
                <div
                  key={lineNum}
                  id={`code-line-${lineNum}`}
                  className={`flex items-start py-0.5 group ${
                    isHighlighted
                      ? 'bg-amber-500/15 border-l-2 border-amber-400 -ml-2 pl-1.5 text-[#F0DFB4] font-medium'
                      : 'hover:bg-[#171833]/60'
                  }`}
                >
                  <span
                    className={`w-10 select-none text-right pr-3 shrink-0 text-[11px] ${
                      isHighlighted
                        ? 'text-amber-400 font-bold'
                        : 'text-[#C89B6B] group-hover:text-[#EAE2D4]'
                    }`}
                  >
                    {lineNum}
                  </span>
                  <pre className="overflow-x-auto whitespace-pre font-mono text-[11px] text-[#EAE2D4]">
                    <code>{lineText || ' '}</code>
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer metadata */}
      {status === 'loaded' && file && (
        <div className="h-8 border-t border-[#241C2E] px-4 flex items-center justify-between text-[11px] text-[#C89B6B] bg-[#0A0B14] shrink-0">
          <span>{file.lineCount} lines</span>
          <span>{file.language}</span>
        </div>
      )}
    </aside>
  );
}
