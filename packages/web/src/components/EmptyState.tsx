import { HelpCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  example?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  example,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      id="empty-state-box"
      className={`border border-[#3A2B33] bg-[#171833]/40 p-6 text-[#EAE2D4] font-mono text-sm rounded-xl ${className}`}
    >
      <div className="flex items-center gap-2 text-[#C89B6B] mb-2 font-semibold tracking-wider uppercase text-xs">
        <HelpCircle className="w-4 h-4 text-[#EAE2D4]/50" />
        <span>{title}</span>
      </div>

      <p className="text-[#C89B6B] text-xs leading-relaxed mb-4">{description}</p>

      {example && (
        <div className="border-l-2 border-[#57392C] pl-3 py-1 my-3 text-xs text-[#EAE2D4] italic rounded-r-md">
          <span className="text-[#C89B6B] block not-italic uppercase text-[10px] mb-0.5">
            Example:
          </span>
          "{example}"
        </div>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-3 px-3 py-1.5 border border-[#57392C] bg-[#241C2E] hover:bg-[#3A2B33] text-[#EAE2D4] text-xs font-mono tracking-wider uppercase transition-colors rounded-lg cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
