import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  location?: string;
  reason?: string;
  actionLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'OPERATION FAILED',
  location,
  reason = 'An unexpected error occurred while communicating with the repository service.',
  actionLabel = 'RETRY',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      id="error-state-card"
      className={`border border-red-500/30 bg-[#0A0B14]/80 p-6 text-[#EAE2D4] font-mono text-sm max-w-lg mx-auto rounded-xl ${className}`}
    >
      <div className="flex items-center gap-2 text-red-400 mb-4 font-semibold tracking-wider uppercase text-xs">
        <AlertCircle className="w-4 h-4" />
        <span>{title}</span>
      </div>

      {location && (
        <div className="mb-3">
          <span className="text-xs text-[#EAE2D4] uppercase tracking-wide block mb-1">
            Parsing stopped while processing:
          </span>
          <div className="bg-[#171833] border border-[#3A2B33] px-3 py-1.5 text-[#EAE2D4] text-xs rounded-lg">
            {location}
          </div>
        </div>
      )}

      <div className="mb-5">
        <span className="text-xs text-[#EAE2D4] uppercase tracking-wide block mb-1">
          Reason:
        </span>
        <p className="text-[#EAE2D4] text-xs leading-relaxed bg-[#171833]/50 p-3 border border-[#3A2B33]/80 rounded-lg">
          {reason}
        </p>
      </div>

      {onRetry && (
        <button
          id="btn-error-retry"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#57392C] bg-[#171833] hover:bg-[#241C2E] text-[#EAE2D4] hover:text-[#F0DFB4] text-xs font-mono tracking-wider uppercase transition-colors rounded-lg cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
