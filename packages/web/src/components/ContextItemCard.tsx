import { Bot, User, FileCode } from 'lucide-react';
import type { ContextItem } from '@dune/shared/types';
import { timeAgo } from '../lib/utils';

interface ContextItemCardProps {
  item: ContextItem;
  onOpenFile?: (path: string) => void;
}

export function ContextItemCard({ item, onOpenFile }: ContextItemCardProps) {
  const getTypeColor = () => {
    switch (item.type) {
      case 'decision':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
      case 'dead-end':
        return 'text-red-400 border-red-500/30 bg-red-950/20';
      case 'constraint':
        return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
    }
  };

  return (
    <div
      id={`context-item-${item.id}`}
      className="border border-[#3A2B33] bg-[#171833]/40 p-3.5 font-mono text-xs space-y-2.5 hover:border-[#C89B6B]/60 transition-colors rounded-xl"
    >
      {/* Category header & Author badge */}
      <div className="flex items-center justify-between flex-wrap gap-1">
        <span
          className={`text-[10px] px-1.5 border uppercase tracking-wider font-bold rounded ${getTypeColor()}`}
        >
          {item.type === 'dead-end'
            ? 'DEAD END'
            : item.type === 'decision'
            ? 'DECISION'
            : 'CONSTRAINT'}
        </span>
        {/* A human must always be able to tell which parts of the record a model wrote. */}
        {item.authoredBy === 'agent' ? (
          <span className="inline-flex items-center gap-1 px-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-mono tracking-wider uppercase rounded">
            <Bot className="w-3 h-3" />
            [ AGENT-AUTHORED ]
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 bg-[#241C2E] border border-[#57392C] text-[#EAE2D4] text-[10px] font-mono tracking-wider uppercase rounded">
            <User className="w-3 h-3" />
            [ HUMAN ]
          </span>
        )}
      </div>

      {/* Title */}
      <div className="text-[#F0DFB4] font-semibold text-xs leading-snug">
        {item.title}
      </div>

      {/* Body */}
      <p className="text-[#EAE2D4] text-[11px] leading-relaxed bg-[#0A0B14]/50 p-2.5 border border-[#241C2E] rounded-lg whitespace-pre-line">
        {item.body}
      </p>

      {/* Footer metadata: file paths and timestamp */}
      <div className="pt-1 flex items-start justify-between gap-2 text-[10px] text-[#C89B6B] border-t border-[#241C2E]">
        {item.files.length > 0 ? (
          <div className="flex flex-col gap-0.5 min-w-0">
            {item.files.map((file) => (
              <button
                key={file}
                type="button"
                onClick={() => onOpenFile?.(file)}
                className="text-[#EAE2D4] hover:text-[#F0DFB4] flex items-center gap-1 transition-colors cursor-pointer group min-w-0"
                title="Open source snapshot"
              >
                <FileCode className="w-3 h-3 text-[#EAE2D4]/50 group-hover:text-amber-400 shrink-0" />
                <span className="truncate group-hover:underline">{file}</span>
              </button>
            ))}
          </div>
        ) : (
          <span className="text-[#57392C]">No file pinned</span>
        )}

        <span className="text-[#C89B6B] shrink-0" title={item.createdAt}>
          {timeAgo(item.createdAt)}
        </span>
      </div>
    </div>
  );
}
