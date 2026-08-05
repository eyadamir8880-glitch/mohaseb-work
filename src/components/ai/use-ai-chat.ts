'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AIAttachment, AIMessage, AIMode, AIServerResponse, InvoiceDraft, NewCustomerDraft, NewProductDraft } from '@/lib/ai-types';

interface HistoryEntry {
  role: 'user' | 'assistant';
  text: string;
  draft?: InvoiceDraft | null;
  newCustomers?: NewCustomerDraft[];
  newProducts?: NewProductDraft[];
}

function makeId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}-${Math.random()}`;
}

function historyKey(mode: AIMode) {
  return `mohasebeyad:ai:${mode}`;
}

export function useAIChat(mode: AIMode) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const raw = localStorage.getItem(historyKey(mode));
      if (raw) {
        const entries: HistoryEntry[] = JSON.parse(raw);
        setMessages(
          entries.map((e) => ({
            id: makeId(),
            role: e.role,
            text: e.text,
            draft: e.draft,
            newCustomers: e.newCustomers,
            newProducts: e.newProducts,
          }))
        );
      }
    } catch {
      // ignore corrupt history
    }
  }, [mode]);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      const entries: HistoryEntry[] = messages.map((m) => ({
        role: m.role,
        text: m.text,
        draft: m.draft,
        newCustomers: m.newCustomers,
        newProducts: m.newProducts,
      }));
      localStorage.setItem(historyKey(mode), JSON.stringify(entries.slice(-100)));
    } catch {
      // ignore quota errors
    }
  }, [messages, mode]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError('');
    try {
      localStorage.removeItem(historyKey(mode));
    } catch {
      // ignore
    }
  }, [mode]);

  const send = useCallback(
    async (text: string, attachments: AIAttachment[], payload: { context: any; language: string }) => {
      const userMessage: AIMessage = {
        id: makeId(),
        role: 'user',
        text,
        attachments: attachments.length > 0 ? attachments : undefined,
      };
      const pendingId = makeId();
      const pendingMessage: AIMessage = { id: pendingId, role: 'assistant', text: '', pending: true };

      setMessages((prev) => [...prev, userMessage, pendingMessage]);
      setError('');
      setLoading(true);

      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode,
            language: payload.language,
            messages: [
              ...messages.map((m) => ({
                role: m.role,
                text: m.text,
                attachments: m.attachments?.map((a) => ({ name: a.name, mimeType: a.mimeType, data: a.data, text: a.text })),
              })),
              {
                role: 'user',
                text,
                attachments: attachments.map((a) => ({ name: a.name, mimeType: a.mimeType, data: a.data, text: a.text })),
              },
            ],
            context: payload.context,
          }),
        });

        const data: AIServerResponse & { error?: string } = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Something went wrong');
        }

        const assistantMessage: AIMessage = {
          id: pendingId,
          role: 'assistant',
          text: data.reply || '',
          draft: mode === 'invoice' ? data.draft : null,
          newCustomers: mode === 'invoice' ? data.newCustomers : [],
          newProducts: mode === 'invoice' ? data.newProducts : [],
        };

        setMessages((prev) => prev.map((m) => (m.id === pendingId ? assistantMessage : m)));
      } catch (e: any) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId ? { ...m, pending: false, error: true, text: e?.message || 'Something went wrong.' } : m
          )
        );
        setError(e?.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    },
    [messages, mode]
  );

  return { messages, loading, error, send, clearHistory };
}
