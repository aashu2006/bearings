import React, { useState, useRef } from 'react';
import { Terminal, Compass, Layers, ShieldCheck, CornerDownLeft, Sparkles, ChevronDown, AlertCircle } from 'lucide-react';
import { DesertDunes } from './DesertDunes';
import { SAMPLE_REPOS } from '../config';

interface RepoInputProps {
  onConnect: (repoUrl: string) => void;
  /** Opens the pre-indexed sample repo, which skips the progress screen. */
  onUseSample: () => void;
  isLoading?: boolean;
  /** The API's message for a rejected submit, e.g. INVALID_REPO_URL or REPO_NOT_FOUND. */
  error?: string | null;
}

export function RepoInput({ onConnect, onUseSample, isLoading = false, error = null }: RepoInputProps) {
  const [url, setUrl] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionTwoRef = useRef<HTMLElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onConnect(url.trim());
    }
  };

  const scrollToSectionTwo = () => {
    sectionTwoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      ref={containerRef}
      id="screen-connect-repo"
      className="relative w-full h-full overflow-y-auto overflow-x-hidden select-text"
      style={{ backgroundColor: 'var(--sky-deep)' }}
    >


      {/* ========================================================= */}
      {/* HERO SECTION: Full-bleed, Left content, Right dune horizon */}
      {/* ========================================================= */}
      <section className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden">
        {/* Living Desert Horizon: Sky gradient, stars, moon, parallax dunes, caravan */}
        <DesertDunes />

        {/* Minimal Navigation Top Header */}
        <header className="relative z-10 w-full px-6 sm:px-12 pt-8 pb-4 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2.5 text-[#EAE2D4]">
            <Terminal className="w-4 h-4 text-[#C89B6B]" />
            <span className="tracking-widest font-semibold text-[#F0DFB4]">DUNE</span>
            <span className="text-[#3A2B33]">/</span>
            <span className="text-[#C89B6B]/80 text-[11px]">DEVELOPER INTELLIGENCE CONSOLE</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onUseSample}
              disabled={isLoading}
              className="text-[#C89B6B] hover:text-[#F0DFB4] border border-[#3A2B33] hover:border-[#C89B6B]/50 bg-[#171833]/40 px-3 py-1.5 transition-colors cursor-pointer text-[11px] rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Launch Live Atlas
            </button>
          </div>
        </header>

        {/* Main Hero Content: Left-aligned over right-weighted dune horizon */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
          {/* Left Column: Headline, Rationale, and Repository Connect Form */}
          <div className="lg:col-span-7 max-w-2xl text-left">
            {/* Functional label: Eyebrow scanner */}
            <div className="font-mono text-xs uppercase text-[#C89B6B] tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C89B6B]" />
              <span>CODEBASE TOPOGRAPHY</span>
            </div>

            {/* Headline in Fraunces: Organic serif with dune-curve weight shift */}
            <h1
              className="font-serif-dune text-4xl sm:text-5xl lg:text-6xl font-light text-[#EAE2D4] leading-[1.08] tracking-tight mb-6"
              style={{ textShadow: '0 2px 20px rgba(10, 11, 20, 0.9)' }}
            >
              Navigate the shifting terrain of your codebase.
            </h1>

            {/* Monospace body copy in warm sand-paper white */}
            <p className="font-mono text-sm sm:text-base text-[#EAE2D4]/85 leading-relaxed mb-8 max-w-xl">
              Dune maps symbols, dependencies, and architectural decisions into an enduring cognitive atlas.
              Cut through noise and locate the exact file to build upon.
            </p>

            {/* Repository Connect Form */}
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
              <div>
                <label
                  htmlFor="repo-url-input"
                  className="block font-mono text-xs uppercase tracking-wider text-[#C89B6B] mb-2"
                >
                  REPOSITORY URL
                </label>
                <div className="relative">
                  <input
                    id="repo-url-input"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    disabled={isLoading}
                    aria-invalid={error !== null}
                    aria-describedby={error ? 'repo-url-error' : undefined}
                    className="w-full px-4 py-3.5 bg-[#0A0B14]/85 backdrop-blur-md border border-[#3A2B33] text-[#EAE2D4] font-mono text-sm placeholder:text-[#57392C] focus:outline-none focus:border-[#C89B6B] focus:ring-1 focus:ring-[#C89B6B] transition-colors rounded-lg"
                    style={{
                      boxShadow: '0 4px 24px rgba(10, 11, 20, 0.6)',
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-[#57392C]">
                    <span className="px-1.5 py-0.5 bg-[#171833]/60 border border-[#3A2B33] rounded text-[#C89B6B]">ENTER</span>
                    <CornerDownLeft className="w-3 h-3 text-[#C89B6B]/60" />
                  </div>
                </div>
                {error && (
                  <div
                    id="repo-url-error"
                    role="alert"
                    className="mt-2 flex items-start gap-2 text-xs font-mono text-red-300 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded-lg"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Action Button: No appended arrows, moonlit highlight, font-mono */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  id="btn-index-repo"
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="px-6 py-3.5 font-mono font-semibold text-xs text-[#0A0B14] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none rounded-lg"
                  style={{
                    backgroundColor: 'var(--moon)',
                    boxShadow: '0 0 24px rgba(240, 223, 180, 0.25)',
                  }}
                >
                  {isLoading ? 'Surveying terrain...' : 'Index repository'}
                </button>

                <button
                  type="button"
                  onClick={onUseSample}
                  disabled={isLoading}
                  className="px-5 py-3.5 font-mono text-xs text-[#EAE2D4] hover:text-white border border-[#3A2B33] hover:border-[#C89B6B]/60 bg-[#171833]/30 transition-colors cursor-pointer rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Load sample codebase
                </button>
              </div>
            </form>

            {/* Direct Sample Repo Selectors */}
            <div className="mt-8 pt-6 border-t border-[#3A2B33]/60 max-w-xl">
              <div className="font-mono text-xs text-[#C89B6B] mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F0DFB4]" />
                <span>Pre-indexed repositories:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_REPOS.map((repo) => (
                  <button
                    key={repo.url}
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      setUrl(repo.url);
                      onConnect(repo.url);
                    }}
                    className="min-w-0 text-left font-mono text-xs text-[#EAE2D4]/75 hover:text-[#F0DFB4] bg-[#171833]/40 border border-[#3A2B33] px-3 py-2 transition-colors cursor-pointer rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="block truncate">{repo.name}</span>
                    <span className="block text-[10px] text-[#C89B6B]/80">{repo.note}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Intentionally open to let the right-weighted dune horizon breathe */}
          <div className="hidden lg:block lg:col-span-5 h-full relative pointer-events-none" />
        </div>

        {/* Bottom Hero Anchor: Scroll trigger cue */}
        <div className="relative z-10 w-full px-6 py-6 flex justify-center items-center">
          <button
            type="button"
            onClick={scrollToSectionTwo}
            className="group flex flex-col items-center gap-1 font-mono text-xs text-[#C89B6B]/70 hover:text-[#F0DFB4] transition-colors cursor-pointer"
          >
            <span>Scroll to explore architecture</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-[#C89B6B]" />
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 2: Quiet, grounded architectural topography        */}
      {/* Dark dune-brown background (#151016), no camels, no storm  */}
      {/* ========================================================= */}
      <section
        ref={sectionTwoRef}
        id="section-architectural-topography"
        className="relative w-full py-24 px-6 sm:px-12"
        style={{ backgroundColor: '#140F18' }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Functional eyebrow label */}
          <div className="font-mono text-xs uppercase tracking-wider text-[#C89B6B] mb-3">
            SECTION 02 // ARCHITECTURAL TOPOGRAPHY
          </div>

          {/* Section Headline in Fraunces */}
          <h2 className="font-serif-dune text-3xl sm:text-4xl text-[#EAE2D4] font-normal mb-6">
            The anatomy of codebase cartography
          </h2>

          <p className="font-mono text-sm text-[#EAE2D4]/75 max-w-2xl mb-14 leading-relaxed">
            Software projects accumulate thousands of paths, orphaned helpers, and silent dependencies.
            Dune continuously reconstructs the terrain into three coordinate systems:
          </p>

          {/* Architecture Pillars: Flattened depth, clean typography, no generic SaaS card grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Pillar 1 */}
            <div className="border-t border-[#3A2B33] pt-6 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Compass className="w-4 h-4 text-[#C89B6B]" />
                <span className="font-mono text-xs uppercase text-[#F0DFB4] tracking-wider">
                  01. AST Graph Topology
                </span>
              </div>
              <p className="font-mono text-xs text-[#EAE2D4]/70 leading-relaxed">
                Full-syntax tree parsing extracts callable nodes, express routers, middleware chains, and test bindings into a traversable directional graph.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="border-t border-[#3A2B33] pt-6 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-[#C89B6B]" />
                <span className="font-mono text-xs uppercase text-[#F0DFB4] tracking-wider">
                  02. Persistent Context Atlas
                </span>
              </div>
              <p className="font-mono text-xs text-[#EAE2D4]/70 leading-relaxed">
                Human architectural decisions, PR rationales, and past incident post-mortems stay tethered directly to the source modules they govern.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="border-t border-[#3A2B33] pt-6 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-[#C89B6B]" />
                <span className="font-mono text-xs uppercase text-[#F0DFB4] tracking-wider">
                  03. Precision Grounding
                </span>
              </div>
              <p className="font-mono text-xs text-[#EAE2D4]/70 leading-relaxed">
                Natural-language queries evaluate topological centrality, returning recommended injection points, downstream tests, and exact line citations.
              </p>
            </div>
          </div>

          {/* Quick Launch Callout */}
          <div className="p-6 border border-[#3A2B33] bg-[#1B1422]/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-[#C89B6B] mb-1">
                READY TO INSPECT
              </div>
              <div className="font-mono text-sm text-[#EAE2D4]">
                Explore the pre-indexed sample, <span className="text-[#F0DFB4]">{SAMPLE_REPOS[0].name}</span>.
              </div>
            </div>

            <button
              type="button"
              onClick={onUseSample}
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#F0DFB4] hover:bg-white text-[#0A0B14] font-mono font-semibold text-xs tracking-wider transition-colors cursor-pointer shrink-0 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Open developer console
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
