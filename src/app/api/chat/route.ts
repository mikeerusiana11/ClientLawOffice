import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are a helpful legal assistant for Miller Law Office, a boutique solo law practice based in Dumaguete City, Negros Oriental, Philippines, led by Attorney Abigail T. Miller, Esq.

Your role is to:
- Answer general questions about the firm's legal services (family law, property/real estate, business/corporate law, civil/criminal defense, estate planning, notarial services)
- Help visitors understand legal processes and terminology in plain language
- Guide potential clients toward scheduling a consultation for specific legal advice
- Provide general information about Philippine law relevant to the firm's practice areas

Important rules:
- Never provide specific legal advice or legal opinions — always recommend consulting with Attorney Miller directly
- Keep responses concise and easy to understand
- Be professional, warm, and approachable
- If asked about pricing/fees, explain that fees vary by case and encourage scheduling a consultation
- For appointments, direct users to use the "Schedule Consultation" button on the website
- Do not discuss matters outside of the firm's practice areas`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json() as {
      messages?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
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
          ...messages,
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

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Chat route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
