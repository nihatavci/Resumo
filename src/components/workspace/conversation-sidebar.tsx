'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, MessageSquare, Check, X } from 'lucide-react';
import { Folder } from '@/components/ui/folder-components';
import type { Conversation, GeneratedCV } from '@/hooks/use-conversations';
import { formatDistanceToNow } from 'date-fns';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string, generatedCV: GeneratedCV | null) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}: ConversationSidebarProps) {
  return (
    <div className="w-[200px] flex-shrink-0 flex flex-col h-full bg-foreground/[0.02] border-r border-dia-divider overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 border-b border-dia-divider">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/40">
          Chats
        </span>
        <button
          onClick={onCreate}
          title="New chat"
          className="flex items-center justify-center h-6 w-6 rounded-full hover:bg-foreground/10 text-foreground/50 hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5 px-1.5">
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center px-2">
            <MessageSquare className="h-6 w-6 text-foreground/20" />
            <p className="text-[11px] text-foreground/30 leading-snug">
              Start by pasting a job URL or description
            </p>
          </div>
        )}
        {conversations.map((convo) => (
          <ConvoItem
            key={convo.id}
            convo={convo}
            isActive={convo.id === activeId}
            onSelect={() => onSelect(convo.id, convo.generatedCV)}
            onDelete={() => onDelete(convo.id)}
            onRename={(title) => onRename(convo.id, title)}
          />
        ))}
      </div>
    </div>
  );
}

function ConvoItem({
  convo,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: {
  convo: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(convo.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasCV = Boolean(convo.generatedCV);

  useEffect(() => {
    if (editing) {
      setEditValue(convo.title);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, convo.title]);

  function commitRename() {
    if (editValue.trim() && editValue.trim() !== convo.title) {
      onRename(editValue.trim());
    }
    setEditing(false);
  }

  function cancelRename() {
    setEditValue(convo.title);
    setEditing(false);
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative rounded-xl transition-all cursor-pointer ${
        isActive
          ? 'bg-white shadow-sm border border-dia-divider/60'
          : 'hover:bg-white/60'
      }`}
      onClick={() => {
        if (!editing) onSelect();
      }}
    >
      <div className="flex items-start gap-2 px-2.5 py-2">
        {/* Icon: folder if has CV, otherwise chat bubble */}
        <div className="flex-shrink-0 mt-0.5">
          {hasCV ? (
            <FolderMini />
          ) : (
            <MessageSquare
              className={`h-3.5 w-3.5 mt-0.5 ${isActive ? 'text-foreground/60' : 'text-foreground/30'}`}
            />
          )}
        </div>

        {/* Title + timestamp */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') cancelRename();
                }}
                className="flex-1 min-w-0 text-[11px] font-medium bg-transparent border-b border-foreground/30 outline-none text-foreground py-0.5"
                autoFocus
              />
              <button
                onClick={commitRename}
                className="text-emerald-500 hover:text-emerald-600 flex-shrink-0"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={cancelRename}
                className="text-foreground/40 hover:text-foreground/70 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <p
              className={`text-[11px] font-medium leading-snug truncate ${
                isActive ? 'text-foreground' : 'text-foreground/60'
              }`}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              title="Double-click to rename"
            >
              {convo.title}
            </p>
          )}
          <p className="text-[10px] text-foreground/30 mt-0.5">
            {formatDistanceToNow(convo.updatedAt, { addSuffix: true })}
          </p>
          {hasCV && (
            <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-medium text-blue-500 bg-blue-50 rounded-full px-1.5 py-0.5">
              <span className="h-1 w-1 rounded-full bg-blue-400" />
              CV ready
            </span>
          )}
        </div>

        {/* Delete button */}
        {hovered && !editing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex-shrink-0 text-foreground/30 hover:text-red-400 transition-colors mt-0.5"
            title="Delete conversation"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Folder preview — shown when conversation has a generated CV and is active */}
      {hasCV && isActive && (
        <div className="px-2.5 pb-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-foreground/[0.03] border border-dia-divider p-2">
            <FolderCard label="CV" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-foreground/70 truncate">
                Tailored CV
              </p>
              <p className="text-[9px] text-foreground/40">
                Click to view in preview
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Tiny scaled-down folder icon for list items */
function FolderMini() {
  return (
    <div
      style={{
        width: 16,
        height: 14,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          transform: 'scale(0.165)',
          transformOrigin: 'top left',
          position: 'absolute',
        }}
      >
        <Folder size="sm" color="blue" />
      </div>
    </div>
  );
}

/** Medium folder card shown in the active conversation's CV badge */
function FolderCard({ label }: { label?: string }) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          transform: 'scale(0.33)',
          transformOrigin: 'top left',
          position: 'absolute',
        }}
      >
        <Folder size="sm" color="blue" label={label} />
      </div>
    </div>
  );
}
