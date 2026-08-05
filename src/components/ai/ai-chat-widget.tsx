'use client';

import { useCallback, useState } from 'react';
import { useAppStore } from '@/stores/use-app-store';
import { useLanguage } from '@/providers/language-provider';
import { buildAIContext } from '@/lib/ai-helpers';
import { AIChat } from '@/components/ai/ai-chat';
import { useAIChat } from '@/components/ai/use-ai-chat';
import type { AIAttachment } from '@/lib/ai-types';

export function AIChatWidget() {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  const chat = useAIChat('chat');

  const context = useCallback(() => buildAIContext(store, language as 'en' | 'ar'), [store, language]);

  const handleSend = useCallback(
    (text: string, attachments: AIAttachment[]) => {
      chat.send(text, attachments, { context: context(), language });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chat, context, language]
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform"
        style={{ bottom: 20, insetInlineEnd: 20 }}
        title={t('ai.title')}
        aria-label={t('ai.title')}
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="fixed z-40 flex flex-col overflow-hidden rounded-2xl border shadow-2xl bg-background"
      style={{ bottom: 20, insetInlineEnd: 20, width: 390, maxWidth: 'calc(100vw - 2rem)', height: 'min(620px, calc(100vh - 40px))' }}
    >
      <AIChat
        title={t('ai.title')}
        subtitle={t('ai.subtitle')}
        messages={chat.messages}
        loading={chat.loading}
        onSend={handleSend}
        onClear={() => { chat.clearHistory(); }}
        onClose={() => setOpen(false)}
        suggestions={[
          t('ai.suggestionDebt'),
          t('ai.suggestionOverdue'),
          t('ai.suggestionTop'),
          t('ai.suggestionToday'),
        ]}
      />
    </div>
  );
}
