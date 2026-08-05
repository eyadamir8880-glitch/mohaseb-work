import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface AttachmentPayload {
  name: string;
  mimeType: string;
  data?: string;
  text?: string;
}

interface MessagePayload {
  role: string;
  text: string;
  attachments?: AttachmentPayload[];
}

const invoiceSchema = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    draft: {
      type: 'object',
      properties: {
        customerName: { type: 'string' },
        notes: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productName: { type: 'string' },
              quantity: { type: 'number' },
              unitPrice: { type: 'number' },
              discountPercent: { type: 'number' },
              taxPercent: { type: 'number' },
            },
            required: ['productName', 'quantity', 'unitPrice'],
          },
        },
      },
      required: ['customerName', 'items'],
    },
    newCustomers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          address: { type: 'string' },
        },
      },
    },
    newProducts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          nameAr: { type: 'string' },
          sellingPrice: { type: 'number' },
          sku: { type: 'string' },
          unitOfMeasure: { type: 'string' },
        },
      },
    },
  },
  required: ['reply', 'draft'],
};

function buildSystemPrompt(mode: string, language: string, context: any): string {
  const lang = language === 'ar' ? 'Arabic' : 'English';
  const langNote = `Always respond in ${lang}. When writing numbers, always use Western digits (0-9), never Arabic-Indic numerals.`;

  const dataBlock = `BUSINESS DATA SNAPSHOT (use it to answer accurately):
\`\`\`json
${JSON.stringify(context, null, 0)}
\`\`\`
If the data needed to answer is not in this snapshot, say so instead of guessing.`;

  if (mode === 'invoice') {
    return `You are the invoice assistant inside a small-business management app (محتسب / mohasebeyad).

Your job: understand what invoice the user wants — from their message, an attached handwritten note, photo, PDF, or Excel file — and produce a JSON response.

Rules:
1. Match the customer against the BUSINESS DATA customer list ONLY when the name matches EXACTLY (or is the same name written in the other language field). Do NOT approximate or pick a similar-looking name. Example: if the user says "علي" and the list has "أحمد", that is NOT a match. If there is no exact match, put the proposed customer under newCustomers and also put the exact name the user gave in draft.customerName. When in doubt, treat it as a new customer rather than guessing.
2. Match each product line against the BUSINESS DATA product list (name or nameAr) ONLY on an exact match. If a product is not found, list it under newProducts (name, sellingPrice from the unit price, nameAr if known, unitOfMeasure if known) and still include it in draft.items with its productName. When in doubt, treat it as a new product rather than guessing.
3. draft.items: one object per line with productName, quantity, unitPrice, discountPercent (0 if none), taxPercent (0 if none). INCLUDE EVERY line item the user mentioned — never drop or merge items. If a quantity is mentioned like "3", "3×", or "3 قطع", use it; otherwise assume 1.
4. If the request is not about creating an invoice (e.g. a general question), set draft to an object with customerName "" and items [] and just reply normally.
5. reply: a short friendly summary in ${lang}, e.g. "فاتورة جاهزة لأحمد: 2× كولا، 1× خبز".
6. Do not guess prices: prefer the selling price from the snapshot; if a price is not known, ask or use the one the user provided. Mark unknown prices clearly.
7. Customer names and product names MUST be taken verbatim from the lists when they match, so the app can find them.

${langNote}

${dataBlock}`;
  }

  return `You are a friendly AI assistant inside a small-business management app (محتسب / mohasebeyad). You can chat normally with the user, and you are especially good at helping with their business.

You can help with: understanding their customers, products, invoices, payments, treasury, and reports using the business data snapshot below.

Rules:
- You CAN see and read attached images (photos of handwritten notes, order lists, serial numbers/SKUs), PDF files, and Excel/CSV/text files. Carefully inspect any image the user sends you — read every item, quantity and number in it.
- Answer questions about the business using the snapshot. If the answer needs data not present, say so instead of inventing numbers.
- When the user wants to CREATE an invoice from a photo, note, or description, do NOT refuse. Tell them: open Invoices → New Invoice, press the AI sparkles button (✨), attach the photo there, and the assistant will fill the invoice automatically.
- Keep answers clear and friendly. Use tables or short lists when helpful.
- ${langNote}

${dataBlock}`;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI is not configured. Add GEMINI_API_KEY.' }, { status: 500 });
  }

  let body: { mode?: string; language?: string; messages?: MessagePayload[]; context?: any };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const mode = body.mode === 'invoice' ? 'invoice' : 'chat';
  const language = body.language === 'ar' ? 'ar' : 'en';
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const context = body.context || {};

  const systemPrompt = buildSystemPrompt(mode, language, context);

  const lastUserIndex = [...messages].map((m) => m.role).lastIndexOf('user');
  const lastUser = lastUserIndex >= 0 ? messages[lastUserIndex] : null;
  const history = messages.filter((_, i) => i !== lastUserIndex);

  const userParts: any[] = [];
  if (lastUser?.text) userParts.push({ text: lastUser.text });
  for (const a of lastUser?.attachments || []) {
    if (a.text) userParts.push({ text: a.text });
    else if (a.data) userParts.push({ inlineData: { mimeType: a.mimeType || 'application/octet-stream', data: a.data } });
  }
  if (userParts.length === 0) {
    userParts.push({ text: '(no message)' });
  }

  const contents: any[] = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text || '' }],
    })),
    { role: 'user', parts: userParts },
  ];

  const generationConfig: any = {
    temperature: 0.2,
    maxOutputTokens: 8192,
  };
  if (mode === 'invoice') {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = invoiceSchema;
  }

  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig }),
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Network error calling AI: ${e?.message || 'unknown'}` }, { status: 502 });
  }

  const data = await geminiRes.json();
  if (!geminiRes.ok) {
    return NextResponse.json(
      { error: data?.error?.message || 'AI request failed.' },
      { status: 502 }
    );
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';

  if (mode === 'invoice') {
    try {
      const parsed = JSON.parse(text);
      return NextResponse.json({
        reply: parsed.reply || '',
        draft: parsed.draft || null,
        newCustomers: parsed.newCustomers || [],
        newProducts: parsed.newProducts || [],
      });
    } catch {
      return NextResponse.json({ reply: text, draft: null, newCustomers: [], newProducts: [] });
    }
  }

  return NextResponse.json({ reply: text });
}
