export interface AIModelOption {
  id: string;
  label: string;
  note?: string;
}

export const AI_MODELS: AIModelOption[] = [
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', note: 'Recommended — fast, free, reads images' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', note: 'Fast, free, reads images' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', note: 'Lightest and fastest, free' },
  { id: 'gemini-flash-lite-latest', label: 'Gemini Flash Lite (latest)', note: 'Always the newest lite model' },
  { id: 'gemini-flash-latest', label: 'Gemini Flash (latest)', note: 'Always the newest flash model' },
  { id: 'gemini-omni-flash-preview', label: 'Gemini Omni Flash (preview)', note: 'Experimental preview' },
  { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (preview)', note: 'Smarter — may require a paid plan' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (preview)', note: 'Smarter — may require a paid plan' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', note: 'Older pro model — may require a paid plan' },
  { id: 'gemma-4-31b-it', label: 'Gemma 4 (open model)', note: 'Open model — may not read images' },
];

export const AI_DEFAULT_MODEL = 'gemini-3.6-flash';
