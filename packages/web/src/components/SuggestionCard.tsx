import { useState } from 'react';
import { GitCommit, Edit3, Check, X, Loader2 } from 'lucide-react';
import type { ContextType, Suggestion } from '@dune/shared/types';
import type { ContextDraft } from '../api/context';
import { errorMessage } from '../api/client';
import { parseFileList, timeAgo } from '../lib/utils';

interface SuggestionCardProps {
  suggestion: Suggestion;
  /** Saves the (possibly edited) draft as team context, as a human. */
  onApprove: (suggestionId: string, draft: ContextDraft) => Promise<void>;
  onDismiss: (suggestionId: string) => Promise<void>;
}

export function SuggestionCard({
  suggestion,
  onApprove,
  onDismiss,
}: SuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(suggestion.title);
  const [body, setBody] = useState(suggestion.body);
  const [type, setType] = useState<ContextType>(suggestion.type);
  const [files, setFiles] = useState(suggestion.files.join(', '));
  const [busy, setBusy] = useState<'saving' | 'dismissing' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: 'saving' | 'dismissing', action: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await action();
      // On success the suggestion leaves the pending list and this card unmounts.
    } catch (err) {
      setError(errorMessage(err));
      setBusy(null);
    }
  };

  const canSave = title.trim() !== '' && body.trim() !== '';

  const handleSave = () =>
    run('saving', () =>
      onApprove(suggestion.id, { type, title: title.trim(), body: body.trim(), files: parseFileList(files) }),
    );

  return (
    <div
      id={`suggestion-${suggestion.id}`}
      className="border border-[#3A2B33] border-l-2 border-l-amber-500/70 bg-[#171833]/50 p-3.5 font-mono text-xs space-y-3 rounded-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
          <GitCommit className="w-3.5 h-3.5" />
          <span>SUGGESTED FROM GIT HISTORY</span>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          disabled={busy !== null}
          className="text-[#C89B6B] hover:text-[#F0DFB4] text-[10px] flex items-center gap-1 cursor-pointer rounded px-1.5 py-0.5 disabled:opacity-40"
        >
          <Edit3 className="w-3 h-3" />
          <span>{isEditing ? 'DONE' : 'EDIT'}</span>
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-2.5 pt-1">
          <div>
            <label className="text-[10px] uppercase text-[#C89B6B] block mb-1">
              Category
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ContextType)}
              className="w-full bg-[#0A0B14] border border-[#57392C] px-2 py-1 text-xs text-[#EAE2D4] rounded-lg"
            >
              <option value="decision">DECISION</option>
              <option value="dead-end">DEAD END</option>
              <option value="constraint">CONSTRAINT</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase text-[#C89B6B] block mb-1">
              Summary
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0A0B14] border border-[#57392C] px-2 py-1 text-xs text-[#EAE2D4] font-mono rounded-lg"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase text-[#C89B6B] block mb-1">
              Reason / Background
            </label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-[#0A0B14] border border-[#57392C] px-2 py-1 text-xs text-[#EAE2D4] font-mono rounded-lg"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase text-[#C89B6B] block mb-1">
              Related Files (comma-separated)
            </label>
            <input
              type="text"
              value={files}
              onChange={(e) => setFiles(e.target.value)}
              className="w-full bg-[#0A0B14] border border-[#57392C] px-2 py-1 text-xs text-[#EAE2D4] font-mono rounded-lg"
            />
          </div>
        </div>
      ) : (
        <>
          <div>
            <span className="text-[10px] font-bold text-[#C89B6B] uppercase tracking-wider block mb-0.5">
              {type === 'dead-end'
                ? 'DEAD END'
                : type === 'decision'
                ? 'DECISION'
                : 'CONSTRAINT'}
            </span>
            <div className="text-[#F0DFB4] font-semibold text-xs">{title}</div>
          </div>

          <p className="text-[#EAE2D4] text-[11px] leading-relaxed bg-[#0A0B14]/60 p-2 border border-[#3A2B33] rounded-lg whitespace-pre-line">
            {body}
          </p>

          <div className="flex items-center justify-between gap-2 text-[10px] text-[#C89B6B]">
            {files.trim() && (
              <span className="truncate">
                File: <code className="text-[#EAE2D4]">{files}</code>
              </span>
            )}
            <span className="shrink-0 ml-auto" title={suggestion.createdAt}>
              {timeAgo(suggestion.createdAt)}
            </span>
          </div>
        </>
      )}

      {error && (
        <div role="alert" className="text-[11px] text-red-300 bg-red-950/40 border border-red-500/40 px-2.5 py-1.5 rounded-lg">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#3A2B33]">
        <button
          onClick={handleSave}
          disabled={busy !== null || !canSave}
          className="flex-1 py-1.5 px-2 bg-[#F0DFB4] hover:bg-[#FFF5DD] text-[#0A0B14] font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          <span>{busy === 'saving' ? 'SAVING…' : 'SAVE TO CONTEXT'}</span>
        </button>
        <button
          onClick={() => run('dismissing', () => onDismiss(suggestion.id))}
          disabled={busy !== null}
          className="py-1.5 px-3 border border-[#3A2B33] hover:bg-[#241C2E] text-[#C89B6B] hover:text-[#F0DFB4] text-[11px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === 'dismissing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          <span>DISMISS</span>
        </button>
      </div>
    </div>
  );
}
