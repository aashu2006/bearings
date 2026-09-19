import { useState, useEffect, useCallback, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { Answer, JobStatus, Source } from '@dune/shared/types';
import { createRepo, getRepoState } from './api/repos';
import { askQuestion } from './api/query';
import {
  createContextItem,
  dismissSuggestion,
  getContext,
  getExport,
  refreshSuggestions,
  type ContextDraft,
} from './api/context';
import { MOCK_TOGGLE_AVAILABLE, errorMessage, isMockMode, setMockMode } from './api/client';
import { SAMPLE_REPO_URL } from './config';
import { repoNameFromUrl } from './lib/utils';

// Components
import { RepoInput } from './components/RepoInput';
import { IndexProgress } from './components/IndexProgress';
import { TopBar } from './components/TopBar';
import { GraphView } from './components/GraphView';
import { QueryBox } from './components/QueryBox';
import { AnswerCard } from './components/AnswerCard';
import { FileDrawer } from './components/FileDrawer';
import { ContextPanel } from './components/ContextPanel';
import { ExportModal } from './components/ExportModal';
import { DesertDunes } from './components/DesertDunes';
import { ErrorState } from './components/ErrorState';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/** How often the progress screen polls GET /repos/:repoId, per the contract. */
const POLL_MS = 1500;

type Screen = 'connect' | 'indexing' | 'main';

interface ActiveAnswer {
  question: string;
  answer: Answer;
  tookMs: number;
}

interface ExportState {
  markdown: string | null;
  error: string | null;
}

function DuneConsole() {
  const client = useQueryClient();

  const [screen, setScreen] = useState<Screen>('connect');
  const [repoId, setRepoId] = useState<string | null>(null);
  // What the user submitted, so a retry re-indexes that repo and nothing else.
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [submittedJob, setSubmittedJob] = useState<JobStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // App UI states
  const [activeAnswer, setActiveAnswer] = useState<ActiveAnswer | null>(null);
  const [queryError, setQueryError] = useState<{ question: string; error: unknown } | null>(null);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const queryRun = useRef(0);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [highlightLines, setHighlightLines] = useState<[number, number] | null>(null);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [contextDraft, setContextDraft] = useState<ContextDraft | null>(null);
  const [exportState, setExportState] = useState<ExportState | null>(null);
  const [mockActive, setMockActive] = useState(isMockMode());

  // Dropdown for the entire Query & Target Analysis section (everything apart from the graph)
  // Default: down (open) in PC (>= 1024px), default: up (closed) in tablet & phone (< 1024px)
  const isDesktop = () => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [isQueryDropdownOpen, setIsQueryDropdownOpen] = useState(isDesktop);
  const userToggledQueryDropdownRef = useRef(false);

  // Sync with responsive layout when resizing unless user manually toggled
  useEffect(() => {
    const handleResize = () => {
      if (!userToggledQueryDropdownRef.current) {
        setIsQueryDropdownOpen(window.innerWidth >= 1024);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleQueryDropdown = () => {
    userToggledQueryDropdownRef.current = true;
    setIsQueryDropdownOpen((prev) => !prev);
  };

  // Keyboard navigation: Escape closes drawers/modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (exportState) {
          setExportState(null);
        } else if (selectedFilePath) {
          setSelectedFilePath(null);
          setHighlightLines(null);
        } else if (isContextOpen) {
          setIsContextOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exportState, selectedFilePath, isContextOpen]);

  // One query serves both screens: polled while indexing, read once for the map.
  const repoQuery = useQuery({
    queryKey: ['repo', repoId],
    queryFn: () => getRepoState(repoId!),
    enabled: repoId !== null && screen !== 'connect',
    refetchInterval: (query) => {
      if (screen !== 'indexing') return false;
      const stage = query.state.data?.job?.stage;
      return stage === 'ready' || stage === 'failed' ? false : POLL_MS;
    },
  });
  const repoState = repoQuery.data ?? null;
  const job = repoState?.job ?? submittedJob;

  // No success screen: the map appearing is the confirmation.
  useEffect(() => {
    if (screen === 'indexing' && repoState?.job?.stage === 'ready' && repoState.meta) {
      const timer = setTimeout(() => setScreen('main'), 700);
      return () => clearTimeout(timer);
    }
  }, [repoState, screen]);

  const contextQuery = useQuery({
    queryKey: ['context', repoId],
    queryFn: () => getContext(repoId!),
    enabled: screen === 'main' && repoId !== null,
  });
  const contextItems = contextQuery.data?.items ?? [];
  const suggestions = contextQuery.data?.suggestions ?? [];

  const resetRepoView = () => {
    queryRun.current += 1;
    setActiveAnswer(null);
    setQueryError(null);
    setIsQueryLoading(false);
    setSelectedFilePath(null);
    setHighlightLines(null);
    setIsContextOpen(false);
    setContextDraft(null);
    setExportState(null);
  };

  // Handle repository connect
  const handleConnect = async (url: string) => {
    setIsConnecting(true);
    setConnectError(null);
    try {
      const res = await createRepo(url);
      // A previous visit may have cached this repo as failed, which would stop polling.
      client.removeQueries({ queryKey: ['repo', res.repoId] });
      resetRepoView();
      setRepoUrl(url);
      setRepoId(res.repoId);
      setSubmittedJob({
        repoId: res.repoId,
        jobId: res.jobId,
        stage: 'queued',
        progress: 0,
        detail: null,
        failedStage: null,
        failureReason: null,
      });
      setScreen(res.alreadyIndexed ? 'main' : 'indexing');
    } catch (err) {
      setConnectError(errorMessage(err));
      setScreen('connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleBackToConnect = () => {
    resetRepoView();
    setScreen('connect');
  };

  // Handle query execution
  const handleRunQuery = async (question: string) => {
    if (!repoId) return;
    const run = ++queryRun.current;
    setIsQueryLoading(true);
    setQueryError(null);
    try {
      const res = await askQuestion(repoId, question);
      if (run !== queryRun.current) return;
      setActiveAnswer({ question, answer: res.answer, tookMs: res.tookMs });
    } catch (error) {
      if (run !== queryRun.current) return;
      setActiveAnswer(null);
      setQueryError({ question, error });
    } finally {
      if (run === queryRun.current) setIsQueryLoading(false);
    }
  };

  // Open file source in drawer
  const handleOpenSource = useCallback((file: string, lines: Source['lines'] | null) => {
    setSelectedFilePath(file);
    setHighlightLines(lines);
  }, []);

  const handleSelectGraphNode = useCallback((filePath: string) => {
    setSelectedFilePath(filePath);
    setHighlightLines(null);
  }, []);

  // Saving an answer opens a pre-filled draft in the context panel: the person decides
  // what the record says before anything is stored.
  // An uncertain answer carries its candidates, so the record can say which one was right.
  const handleSaveAnswerToContext = ({ question, answer }: ActiveAnswer) => {
    const files = [answer.recommendedFile, answer.attachTo, ...(answer.candidates ?? []).map((c) => c.file)].filter(
      (f): f is string => f !== null,
    );
    setContextDraft({ type: 'decision', title: question, body: answer.reason, files: [...new Set(files)] });
    setIsContextOpen(true);
  };

  const invalidateContext = () => client.invalidateQueries({ queryKey: ['context', repoId] });

  const handleCreateItem = async (draft: ContextDraft) => {
    await createContextItem(repoId!, draft);
    await invalidateContext();
  };

  const handleApproveSuggestion = async (suggestionId: string, draft: ContextDraft) => {
    await createContextItem(repoId!, draft, suggestionId);
    await invalidateContext();
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    await dismissSuggestion(suggestionId);
    await invalidateContext();
  };

  const handleRefreshSuggestions = async () => {
    const res = await refreshSuggestions(repoId!);
    client.setQueryData(['context', repoId], (old: typeof contextQuery.data) =>
      old ? { ...old, suggestions: res.suggestions } : old,
    );
    return res.suggestions.length;
  };

  // Open export modal
  const handleOpenExport = async () => {
    if (!repoId) return;
    setExportState({ markdown: null, error: null });
    try {
      const { markdown } = await getExport(repoId);
      setExportState((prev) => (prev ? { markdown, error: null } : prev));
    } catch (err) {
      setExportState((prev) => (prev ? { markdown: null, error: errorMessage(err) } : prev));
    }
  };

  // Mock and live data never mix: switching sources starts over from the connect screen.
  const handleToggleMock = () => {
    const next = !mockActive;
    setMockMode(next);
    setMockActive(next);
    client.clear();
    resetRepoView();
    setRepoId(null);
    setScreen('connect');
  };

  const repoName = repoState?.meta?.name ?? (repoUrl ? repoNameFromUrl(repoUrl) : null);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0A0B14] text-[#EAE2D4] overflow-hidden font-mono">
      {/* SCREEN 1: Connect Repository */}
      {screen === 'connect' && (
        <main className="flex-1 w-full h-full overflow-hidden relative">
          <RepoInput
            onConnect={handleConnect}
            onUseSample={() => handleConnect(SAMPLE_REPO_URL)}
            isLoading={isConnecting}
            error={connectError}
          />
        </main>
      )}

      {/* SCREEN 1 TRANSFORM: Indexing Progress */}
      {screen === 'indexing' && job && (
        <main className="flex-1 overflow-y-auto flex items-center justify-center p-6 relative" style={{ backgroundColor: 'var(--sky-deep)' }}>
          {/* Desert background with caravan traversal */}
          <DesertDunes />
          <IndexProgress
            job={job}
            repoName={repoName ?? job.repoId}
            pollError={repoQuery.isError ? errorMessage(repoQuery.error) : null}
            isRetrying={isConnecting}
            onRetry={() => repoUrl && handleConnect(repoUrl)}
            onUseSample={() => handleConnect(SAMPLE_REPO_URL)}
            onCancel={handleBackToConnect}
            onComplete={() => setScreen('main')}
          />
        </main>
      )}

      {/* SCREEN 2: Main Repository Experience */}
      {screen === 'main' && (
        <>
          {/* Top Bar */}
          <TopBar
            meta={repoState?.meta ?? null}
            fallbackName={repoName}
            contextCount={contextItems.length}
            onOpenContext={() => setIsContextOpen(true)}
            showMockToggle={MOCK_TOGGLE_AVAILABLE}
            isMockMode={mockActive}
            onToggleMockMode={handleToggleMock}
            onChangeRepo={handleBackToConnect}
          />

          <h1 className="sr-only">Dune — codebase map for {repoName ?? 'this repository'}</h1>

          {repoQuery.isError ? (
            <main className="flex-1 flex items-center justify-center p-6">
              <ErrorState
                title="COULD NOT LOAD THIS REPOSITORY"
                reason={errorMessage(repoQuery.error)}
                actionLabel="TRY AGAIN"
                onRetry={() => repoQuery.refetch()}
              />
            </main>
          ) : (
          /* Main Layout: Codebase Map on Left, Query & Answer on Right as a Dropdown */
          <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            {/* Left: Codebase Map (React Flow) */}
            <div className="flex-1 h-full w-full relative overflow-hidden bg-[#0A0B14]">
              <GraphView
                graph={repoState?.graph ?? null}
                isLoading={repoQuery.isLoading}
                activeAnswer={activeAnswer?.answer ?? null}
                selectedFilePath={selectedFilePath}
                onSelectFile={handleSelectGraphNode}
                isProcessingQuery={isQueryLoading}
              />

              {/* Floating Re-open Button when Dropdown is folded UP on PC */}
              {!isQueryDropdownOpen && (
                <button
                  type="button"
                  id="btn-reopen-query-dropdown-desktop"
                  onClick={toggleQueryDropdown}
                  className="hidden lg:flex absolute top-3 right-3 z-30 items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#0A0B14]/95 backdrop-blur-md border border-[#C89B6B]/70 hover:border-[#F0DFB4] text-[#F0DFB4] hover:bg-[#171833] transition-all shadow-2xl font-mono-dune text-xs cursor-pointer group select-none active:scale-95"
                  title="Drop down Query & Analysis panel"
                >
                  <div className="w-5 h-5 rounded bg-[#171833] border border-[#3A2B33] flex items-center justify-center text-[#C89B6B] group-hover:text-[#F0DFB4]">
                    <Search className="w-3 h-3" />
                  </div>
                  <span className="font-serif-dune font-semibold text-xs tracking-wide">
                    Codebase Query & Target
                  </span>
                  <div className="flex items-center gap-1 text-[#C89B6B] group-hover:text-[#F0DFB4]">
                    <span className="text-[10px] uppercase">Drop Down</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </button>
              )}
            </div>

            {/* Mobile / Tablet: Dropdown Trigger Bar when folded UP */}
            {!isQueryDropdownOpen && (
              <button
                type="button"
                id="btn-reopen-query-dropdown-mobile"
                onClick={toggleQueryDropdown}
                className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-[#0A0B14] border-t border-[#3A2B33] text-left cursor-pointer transition-colors hover:bg-[#171833]/60 shrink-0 z-20 shadow-lg"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded bg-[#171833] border border-[#3A2B33] flex items-center justify-center text-[#F0DFB4] shrink-0">
                    <Search className="w-3 h-3" />
                  </div>
                  <span className="font-serif-dune text-xs sm:text-sm font-semibold text-[#F0DFB4] tracking-wide truncate">
                    Codebase Query & Target Insights
                  </span>
                  {activeAnswer && (activeAnswer.answer.attachTo || activeAnswer.answer.recommendedFile) && (
                    <span className="text-[10px] font-mono-dune text-[#C89B6B] bg-[#171833] px-2 py-0.5 rounded border border-[#3A2B33] truncate max-w-[120px] hidden xs:inline-block">
                      {activeAnswer.answer.attachTo || activeAnswer.answer.recommendedFile}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono-dune text-[#C89B6B] shrink-0">
                  <span className="text-[10px] uppercase tracking-wider">Drop Down</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </button>
            )}

            {/* The Dropdown Menu: Whole thing apart from the graph */}
            {isQueryDropdownOpen && (
              <div
                id="query-answer-dropdown-menu"
                className="w-full lg:w-[420px] max-w-full h-[60vh] lg:h-full border-t lg:border-t-0 lg:border-l border-[#3A2B33] bg-[#0A0B14] flex flex-col shrink-0 z-20 shadow-2xl overflow-hidden transition-all duration-300"
              >
                {/* Dropdown Header Trigger (Click to Fold Up ▴) */}
                <button
                  type="button"
                  id="query-dropdown-toggle-header"
                  onClick={toggleQueryDropdown}
                  className="w-full flex items-center justify-between px-3.5 sm:px-4 py-3 bg-[#0A0B14] border-b border-[#3A2B33] text-left cursor-pointer select-none transition-colors hover:bg-[#171833]/50 group shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C89B6B]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-[#171833] border border-[#3A2B33] flex items-center justify-center text-[#F0DFB4] shrink-0 group-hover:border-[#C89B6B]/60 transition-colors">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-serif-dune text-sm font-semibold text-[#F0DFB4] tracking-wide shrink-0">
                        Codebase Query & Insights
                      </span>
                      {activeAnswer && (activeAnswer.answer.attachTo || activeAnswer.answer.recommendedFile) && (
                        <span className="text-[10px] font-mono-dune text-[#C89B6B] bg-[#171833] px-2 py-0.5 rounded border border-[#3A2B33] truncate max-w-[130px] hidden xs:inline-block">
                          {activeAnswer.answer.attachTo || activeAnswer.answer.recommendedFile}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono-dune text-[#C89B6B] uppercase tracking-wider hidden sm:inline group-hover:text-[#F0DFB4] transition-colors">
                      Fold Up ▴
                    </span>
                    <div
                      className="w-6 h-6 rounded-md bg-[#171833]/80 border border-[#3A2B33] flex items-center justify-center text-[#C89B6B] group-hover:text-[#F0DFB4] group-hover:border-[#C89B6B]/60 transition-all"
                      title="Collapse menu (fold up)"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu Contents: QueryBox + AnswerCard */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                  <QueryBox
                    onSearch={handleRunQuery}
                    isLoading={isQueryLoading}
                    showExamples={!activeAnswer && !queryError}
                  />

                  <div className="flex-1 overflow-y-auto">
                    <AnswerCard
                      answer={activeAnswer?.answer ?? null}
                      tookMs={activeAnswer?.tookMs ?? null}
                      isLoading={isQueryLoading}
                      error={queryError ? queryError.error : null}
                      onRetry={queryError ? () => handleRunQuery(queryError.question) : null}
                      onOpenSource={handleOpenSource}
                      onSaveToContext={() => activeAnswer && handleSaveAnswerToContext(activeAnswer)}
                    />
                  </div>
                </div>
              </div>
            )}
          </main>
          )}

          {/* SCREEN 3: Context Drawer (Slide-over drawer over Screen 2) */}
          <ContextPanel
            repoId={repoId}
            repoName={repoName}
            items={contextItems}
            suggestions={suggestions}
            isLoading={contextQuery.isLoading}
            loadError={contextQuery.isError ? errorMessage(contextQuery.error) : null}
            onReload={() => contextQuery.refetch()}
            isOpen={isContextOpen}
            draft={contextDraft}
            onDraftConsumed={() => setContextDraft(null)}
            onClose={() => setIsContextOpen(false)}
            onCreateItem={handleCreateItem}
            onApproveSuggestion={handleApproveSuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            onRefreshSuggestions={handleRefreshSuggestions}
            onOpenExport={handleOpenExport}
            onOpenFile={(path) => {
              setSelectedFilePath(path);
              setHighlightLines(null);
            }}
          />

          {/* File Source Drawer (When node or source link is clicked) */}
          {repoId && (
            <FileDrawer
              repoId={repoId}
              filePath={selectedFilePath}
              highlightLines={highlightLines}
              onClose={() => {
                setSelectedFilePath(null);
                setHighlightLines(null);
              }}
            />
          )}

          {/* Export Markdown Modal */}
          {exportState && (
            <ExportModal
              markdown={exportState.markdown}
              error={exportState.error}
              onRetry={handleOpenExport}
              onClose={() => setExportState(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DuneConsole />
    </QueryClientProvider>
  );
}
