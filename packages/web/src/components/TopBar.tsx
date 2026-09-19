import { BookOpen, Database, GitCommit, ToggleLeft, ToggleRight } from 'lucide-react';
import type { RepoMeta } from '@dune/shared/types';
import { formatCompact, formatNumber } from '../lib/utils';

interface TopBarProps {
  /** Null while the repo state is loading. */
  meta: RepoMeta | null;
  /** Shown until meta arrives: the name from the submitted URL. */
  fallbackName: string | null;
  contextCount: number;
  onOpenContext: () => void;
  /** Development only; production builds never render the mock toggle. */
  showMockToggle: boolean;
  isMockMode: boolean;
  onToggleMockMode: () => void;
  onChangeRepo: () => void;
}

export function TopBar({
  meta,
  fallbackName,
  contextCount,
  onOpenContext,
  showMockToggle,
  isMockMode,
  onToggleMockMode,
  onChangeRepo,
}: TopBarProps) {
  return (
    <header
      id="dune-top-bar"
      className="h-12 border-b border-[#3A2B33] bg-[#0A0B14] px-4 flex items-center justify-between font-mono-dune text-xs select-none z-20 shrink-0 text-[#EAE2D4] shadow-sm"
    >
      {/* Left: Brand (clickable logo → home) + Repo Identity */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Clickable DUNE logo — navigates back to the home/connect screen */}
          <button
            id="btn-logo-home"
            onClick={onChangeRepo}
            title="Go home — connect a different repository"
            className="font-serif-dune font-semibold tracking-[0.2em] text-[#F0DFB4] text-base drop-shadow-[0_1px_3px_rgba(240,223,180,0.25)] cursor-pointer hover:text-white hover:drop-shadow-[0_1px_12px_rgba(240,223,180,0.6)] transition-all active:scale-95 bg-transparent border-none p-0"
          >
            DUNE
          </button>
          <span className="text-[#57392C]">/</span>
          <span className="font-mono-dune text-[#EAE2D4] font-medium tracking-wide text-xs truncate">
            {meta?.name ?? fallbackName ?? '—'}
          </span>
        </div>

        {meta && (
          <div className="hidden sm:flex items-center gap-3 text-[#C89B6B]/80 border-l border-[#3A2B33] pl-4 font-mono-dune shrink-0">
            <span className="tracking-wide">
              <strong className="text-[#EAE2D4] font-semibold">{formatNumber(meta.fileCount)}</strong> FILES
            </span>
            <span className="text-[#3A2B33]">•</span>
            <span className="tracking-wide" title={`${formatNumber(meta.lineCount)} lines`}>
              <strong className="text-[#EAE2D4] font-semibold">{formatCompact(meta.lineCount)}</strong> LINES
            </span>
          </div>
        )}

        {meta && (
          <div className="hidden md:flex items-center gap-2 border-l border-[#3A2B33] pl-4 text-[11px] font-mono-dune text-[#EAE2D4]/60 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[#F0DFB4]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F0DFB4] inline-block shadow-[0_0_6px_#F0DFB4]" />
              CHARTED
            </span>
            <span className="text-[#3A2B33]">•</span>
            <span className="inline-flex items-center gap-1 text-[#C89B6B]/90" title={meta.commitSha}>
              <GitCommit className="w-3 h-3 text-[#C89B6B]" />
              COMMIT {meta.commitSha.slice(0, 7)}
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions & Tools */}
      <div className="flex items-center gap-3 font-mono-dune shrink-0">
        {/* Mock/Live API indicator — a development fixture */}
        {showMockToggle && (
          <button
            onClick={onToggleMockMode}
            title="Switch between the live API and the fixtures in src/mocks (development only)"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-[#EAE2D4]/70 hover:text-white border border-[#3A2B33] hover:border-[#C89B6B]/60 bg-[#171833]/50 transition-colors rounded-md cursor-pointer"
          >
            <Database className="w-3 h-3 text-[#C89B6B]" />
            <span>MOCK:</span>
            <span className={isMockMode ? 'text-[#F0DFB4] font-semibold' : 'text-[#EAE2D4]/50'}>
              {isMockMode ? 'ACTIVE' : 'OFF'}
            </span>
            {isMockMode ? (
              <ToggleRight className="w-3.5 h-3.5 text-[#F0DFB4]" />
            ) : (
              <ToggleLeft className="w-3.5 h-3.5 text-[#57392C]" />
            )}
          </button>
        )}



        {/* Context Button */}
        <button
          id="btn-open-context"
          onClick={onOpenContext}
          className="px-3 py-1.5 bg-[#F0DFB4] hover:bg-[#FFF5DD] text-[#0A0B14] font-bold text-xs tracking-wider uppercase transition-all inline-flex items-center gap-2 cursor-pointer rounded-md shadow-[0_1px_8px_rgba(240,223,180,0.2)] active:scale-95"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#0A0B14]" />
          <span className="font-mono-dune">CONTEXT</span>
          <span className="px-1.5 py-0.2 bg-[#0A0B14] text-[#F0DFB4] text-[10px] font-bold rounded">
            {contextCount}
          </span>
        </button>
      </div>
    </header>
  );
}
