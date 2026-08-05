'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { AIAttachment, AIMessage } from '@/lib/ai-types';
import { readAttachment } from '@/lib/ai-helpers';
import { useLanguage } from '@/providers/language-provider';
import { Button } from '@/components/ui/button';

interface AIChatProps {
  title: string;
  subtitle?: string;
  messages: AIMessage[];
  loading: boolean;
  onSend: (text: string, attachments: AIAttachment[]) => void;
  onClear: () => void;
  onClose?: () => void;
  suggestions?: string[];
  renderAssistant?: (msg: AIMessage) => ReactNode;
  compact?: boolean;
}

function attachmentIcon(a: AIAttachment) {
  if (a.text !== undefined) return '📄';
  if (a.mimeType === 'application/pdf') return '📕';
  return '🖼️';
}

export function AIChat({
  title,
  subtitle,
  messages,
  loading,
  onSend,
  onClear,
  onClose,
  suggestions,
  renderAssistant,
  compact,
}: AIChatProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<AIAttachment[]>([]);
  const [attachError, setAttachError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAttachError('');
    const next: AIAttachment[] = [];
    for (const file of Array.from(files).slice(0, 5)) {
      try {
        next.push(await readAttachment(file));
      } catch (e: any) {
        setAttachError(e?.message || 'Could not read file.');
      }
    }
    setAttachments((prev) => [...prev, ...next]);
  };

  const submit = () => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    onSend(text, attachments);
    setInput('');
    setAttachments([]);
  };

  return (
    <div className={`flex flex-col ${compact ? '' : 'h-full'} overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <p className="text-sm font-semibold leading-tight">{title}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground leading-tight">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onClear} className="btn-ghost p-1 text-xs text-muted-foreground hover:text-red-600" title={t('ai.clearHistory')}>
            {t('ai.clearHistory')}
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-ghost p-1 text-muted-foreground hover:text-red-600" title={t('app.close')} aria-label={t('app.close')}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: compact ? '45vh' : 'none' }}>
        {messages.length === 0 && (
          <div className="text-center py-6 space-y-2">
            <p className="text-sm text-muted-foreground">{t('ai.greeting')}</p>
            {suggestions && suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSend(s, [])}
                    className="text-xs border rounded-full px-3 py-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-sm whitespace-pre-wrap">
                {m.attachments && m.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {m.attachments.map((a) => (
                      <span key={a.id} className="text-[10px] bg-black/20 rounded px-1.5 py-0.5">
                        {attachmentIcon(a)} {a.name}
                      </span>
                    ))}
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-start">
              <div className={`max-w-[90%] bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-sm whitespace-pre-wrap ${m.error ? 'text-red-600' : ''}`}>
                {m.pending ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '120ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '240ms' }} />
                  </span>
                ) : (
                  <>
                    {m.text}
                    {renderAssistant && renderAssistant(m)}
                  </>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {attachError && <p className="px-4 text-xs text-red-500">{attachError}</p>}

      {attachments.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {attachments.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5 bg-muted">
              <span>{attachmentIcon(a)}</span>
              <span className="max-w-[140px] truncate">{a.name}</span>
              <button className="text-muted-foreground hover:text-red-600" onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}>
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 p-3 border-t">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf,.xlsx,.xls,.csv,.txt"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button onClick={() => fileRef.current?.click()} className="btn-outline btn-sm p-2 shrink-0" title={t('ai.attach')}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={t('ai.placeholder')}
          rows={1}
          className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1"
        />
        <Button size="sm" onClick={submit} disabled={loading}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
