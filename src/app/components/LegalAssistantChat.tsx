'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Scale, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LegalAssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hello! I'm the Miller Law Office legal assistant. I can answer general questions about our services and help you understand your legal options. For specific legal advice, I'll always recommend scheduling a consultation with Attorney Miller. How can I help you today?",
};

export default function LegalAssistantChat({ isOpen, onClose }: LegalAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });

      const data = await res.json() as { reply?: string; error?: string };

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || "I'm sorry, I couldn't process that. Please try again or contact our office directly.",
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble connecting. Please try again or call our office for assistance.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl shadow-2xl border border-slate-200 overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1A2B3C]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
            <Scale size={16} className="text-[#1A2B3C]" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Legal Assistant</p>
            <p className="text-white/50 text-xs">Miller Law Office</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[300px] max-h-[400px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1A2B3C] text-white rounded-br-sm'
                  : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-xl rounded-bl-sm px-3 py-2 shadow-sm">
              <Loader2 size={16} className="text-slate-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-200 bg-white">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask a legal question..."
          disabled={loading}
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] disabled:opacity-50 bg-slate-50"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="w-9 h-9 bg-[#D4AF37] hover:bg-[#C49D2E] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
          aria-label="Send message"
        >
          <Send size={15} className="text-[#1A2B3C]" />
        </button>
      </div>

      <div className="px-3 pb-2 bg-white">
        <p className="text-[10px] text-slate-400 text-center">
          For specific legal advice, please schedule a consultation.
        </p>
      </div>
    </div>
  );
}
