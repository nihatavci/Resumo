'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Message } from '@ai-sdk/react';

export interface CompanyIntel {
  culture: string;
  employerRep: string;
  hiringSignals: string;
}

export interface Conversation {
  id: string;
  resumeId: string;
  /** Auto-derived from first assistant reply (company/role name) or first user message */
  title: string;
  messages: Message[];
  companyIntel: CompanyIntel | null;
  memoryPoints: string[];
  createdAt: number;
  updatedAt: number;
}

function storageKey(resumeId: string) {
  return `resumo_convos_${resumeId}`;
}

function loadAll(resumeId: string): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(resumeId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    // Sort newest first
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

function saveAll(resumeId: string, convos: Conversation[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(resumeId), JSON.stringify(convos));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Derive a title from messages: company name from assistant analysis card, or first user message snippet */
export function deriveTitle(messages: Message[]): string {
  // Try to find the role analysis line from assistant reply
  for (const m of messages) {
    if (m.role !== 'assistant') continue;
    const roleMatch = m.content.match(/📋\s*Role\s*:\s*([^\n]+)/);
    if (roleMatch) {
      return roleMatch[1].trim().slice(0, 60);
    }
    const companyMatch = m.content.match(/🏢\s*Company\s*:\s*([^\n]+)/);
    if (companyMatch) {
      return companyMatch[1].trim().slice(0, 60);
    }
  }
  // Fall back to first user message snippet
  const firstUser = messages.find((m) => m.role === 'user');
  if (firstUser) {
    const text = firstUser.content.replace(/https?:\/\/\S+/g, '').trim();
    return text.slice(0, 50) || 'New conversation';
  }
  return 'New conversation';
}

export function useConversations(resumeId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load on mount
  useEffect(() => {
    const loaded = loadAll(resumeId);
    setConversations(loaded);
    // Auto-select the most recent conversation if any
    if (loaded.length > 0) {
      setActiveId(loaded[0].id);
    }
  }, [resumeId]);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  /** Create a new empty conversation and make it active */
  const createConversation = useCallback(() => {
    const newConvo: Conversation = {
      id: generateId(),
      resumeId,
      title: 'New conversation',
      messages: [],
      companyIntel: null,
      memoryPoints: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => {
      const next = [newConvo, ...prev];
      saveAll(resumeId, next);
      return next;
    });
    setActiveId(newConvo.id);
    return newConvo.id;
  }, [resumeId]);

  /** Upsert the active conversation's messages/intel/memoryPoints */
  const saveConversation = useCallback(
    (id: string, patch: Partial<Pick<Conversation, 'messages' | 'companyIntel' | 'memoryPoints'>>) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === id);
        if (idx === -1) return prev;
        const updated = { ...prev[idx], ...patch, updatedAt: Date.now() };
        // Re-derive title once we have messages
        if (patch.messages && patch.messages.length > 0) {
          updated.title = deriveTitle(patch.messages);
        }
        const next = [...prev];
        next[idx] = updated;
        // Re-sort: updated conversation goes to top
        next.sort((a, b) => b.updatedAt - a.updatedAt);
        saveAll(resumeId, next);
        return next;
      });
    },
    [resumeId],
  );

  /** Delete a conversation by id */
  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        saveAll(resumeId, next);
        // If deleting the active one, switch to next available or null
        if (activeId === id) {
          setActiveId(next.length > 0 ? next[0].id : null);
        }
        return next;
      });
    },
    [resumeId, activeId],
  );

  /** Switch active conversation */
  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  return {
    conversations,
    activeId,
    activeConversation,
    createConversation,
    saveConversation,
    deleteConversation,
    selectConversation,
  };
}
