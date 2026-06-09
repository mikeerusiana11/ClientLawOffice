import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getIp } from '@/lib/rate-limit';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 1000;

const SYSTEM_PROMPT = `You are a friendly legal assistant for Miller Law Office, a boutique solo law practice in Dumaguete City, Negros Oriental, Philippines, led by Atty. Abigail T. Miller.

FORMATTING RULES — follow these strictly:
- Never use markdown: no asterisks, no bold, no bullet symbols, no headers, no dashes as list markers
- Write in plain, conversational sentences only
- Keep replies short — 2 to 4 sentences at most
- If a question is vague or could go several ways, ask one short clarifying question before answering
- End replies with a brief follow-up question when it feels natural (e.g. "Would you like to know more about that?" or "Is this related to a personal matter or a business concern?")

Firm contact details (share when asked):
Phone / WhatsApp / Viber: +63 917 631 7120
Email: attyabigailtmiller@gmail.com
Address: Dumaguete City, Negros Oriental, Philippines
Office hours: Monday to Friday, 9:00 AM to 5:00 PM; Saturday by appointment; Sunday closed

Practice areas: family law, property and real estate, business and corporate law, civil and criminal defense, estate planning, notarial services.

Rules:
- Never give specific legal advice — always recommend consulting Atty. Miller directly
- For fees, explain they vary by case and encourage booking a consultation
- To get in touch, tell users to click the Contact Us button on the website (WhatsApp, Viber, or phone)
- Do not discuss topics outside the firm's practice areas

Privacy reminders:
- Every 3 to 4 exchanges, naturally remind the user not to share sensitive personal information in this chat — such as full names, addresses, ID numbers, case details, or financial information
- Keep the reminder brief and friendly, for example: "Just a reminder — please avoid sharing sensitive personal details here. Save those for your private consultation with Atty. Miller."
- Do not repeat the reminder in back-to-back messages`;

export async function POST(request: NextRequest) {
  // 20 requests per minute per IP
  if (!rateLimit(`chat:${getIp(request)}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  try {
    const { messages } = await request.json() as {
      messages?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Prevent context-stuffing cost attacks
    const trimmed = messages.slice(-MAX_MESSAGES);
    const sanitized = trimmed
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: String(m.content).slice(0, MAX_MESSAGE_LENGTH) }));

    if (sanitized.length === 0) {
      return NextResponse.json({ error: 'No valid messages provided' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chat service unavailable' }, { status: 503 });
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...sanitized,
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('GROQ API error:', err);
      return NextResponse.json({ error: 'Chat service error' }, { status: 502 });
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[];
    };

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      return NextResponse.json({ error: 'No response from chat service' }, { status: 502 });
    }

    const lastUserMessage = sanitized.filter(m => m.role === 'user').at(-1)?.content ?? '';
    const locationKeywords = /\b(location|address|where|map|directions?|how to get|find you|situated|office|visit)\b/i;
    const showMap = locationKeywords.test(lastUserMessage);

    return NextResponse.json({ reply, showMap });
  } catch (err) {
    console.error('Chat route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
