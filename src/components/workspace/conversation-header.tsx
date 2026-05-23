'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Trash2, MessageSquare } from 'lucide-react';
import type { Conversation } from '@/hooks/use-conversations';

interface ConversationHeaderProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ConversationHeader({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: ConversationHeaderProps) {
  const [open, setOpen] = useState(false);
  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="relative px-6 pt-5 pb-3 flex-shrink-0 border-b border-dia-divider">
      {/* Top row: title + controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="text-dia-heading-sm font-light text-foreground">Tailor with AI</h2>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* New conversation */}
          <button
            onClick={onCreate}
            className="flex items-center gap-1 rounded-full border border-dia-divider bg-white text-foreground/60 text-xs font-medium px-2.5 py-1 hover:bg-foreground/5 transition-colors"
            title="Start a new conversation"
          >
            <Plus className="h-3 w-3" />
            New
          </button>

          {/* Conversation picker — only show if there are any */}
          {conversations.length > 0 && (
            <button
              onClick={() => setOpen((v) => !v)}
              className={`flex items-center gap-1 rounded-full border text-xs font-medium px-2.5 py-1 transition-colors ${
                open
                  ? 'border-foreground/20 bg-foreground/5 text-foreground'
                  : 'border-dia-divider bg-white text-foreground/60 hover:bg-foreground/5'
              }`}
              title="Switch conversation"
            >
              <MessageSquare className="h-3 w-3" />
              <span>{conversations.length}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Active conversation title */}
      {active && active.messages.length > 0 && (
        <p className="text-xs text-foreground/40 mt-0.5 truncate max-w-[280px]">
          {active.title}
        </p>
      )}

      {/* Subtitle hint when no active / empty */}
      {(!active || active.messages.length === 0) && (
        <p className="text-sm text-dia-muted mt-0.5">
          Paste a job URL or description. Chat to refine.
        </p>
      )}

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-6 top-full mt-1 z-50 bg-white rounded-2xl shadow-2xl border border-dia-divider overflow-hidden min-w-[280px] max-w-[320px]">
            <div className="px-4 py-2.5 border-b border-dia-divider">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/40">
                Conversations
              </span>
            </div>
            <ul className="max-h-72 overflow-y-auto py-1">
              {conversations.map((c) => (
                <li key={c.id}>
                  <div
                    className={`group flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-foreground/[0.03] transition-colors ${
                      c.id === activeId ? 'bg-foreground/[0.04]' : ''
                    }`}
                    onClick={() => {
                      onSelect(c.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate leading-snug ${
                          c.id === activeId
                            ? 'text-foreground font-medium'
                            : 'text-foreground/70'
                        }`}
                      >
                        {c.title}
                      </p>
                      <p className="text-[10px] text-foreground/30 mt-0.5">
                        {formatRelativeTime(c.updatedAt)}
                        {c.messages.length > 0 && (
                          <span className="ml-1.5">· {c.messages.filter((m) => m.role === 'user').length} msgs</span>
                        )}
                      </p>
                    </div>
                    {/* Delete button — only on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c.id);
                        if (conversations.length === 1) setOpen(false);
                      }}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-foreground/30 hover:text-red-500 transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
