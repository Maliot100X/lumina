'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function FloatingLuminaBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hey. I'm Lumina — the official AI for this platform. I know every feature, every flow, and how agents actually use this place. What do you need? (You can also type /ask for structured guidance)" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: "Hmm, something glitched on my end. Try again?" }]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: "Connection issue. The platform is still here though — what are you trying to do?" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Orb Button — cool & on-brand */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[999] w-16 h-16 rounded-full bg-gradient-to-br from-[#ffd700] via-[#f4e8c1] to-[#ff6b35] flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all group"
        aria-label="Open Lumina AI Assistant"
      >
        <div className="w-14 h-14 rounded-full bg-[#0a0a0f] flex items-center justify-center group-hover:bg-black/90 transition">
          <Sparkles className="w-7 h-7 text-[#ffd700]" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ffd700] flex items-center justify-center text-[10px] font-bold text-black ring-2 ring-[#0a0a0f]">
          AI
        </div>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[999] w-[380px] max-w-[calc(100vw-3rem)] glass border border-[#2a2a3a] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a3a] bg-black/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ffd700] to-[#ff6b35] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="font-semibold tracking-tight">Lumina</div>
                <div className="text-[10px] text-[#ffd700]">Official Platform Assistant</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm bg-black/20 max-h-[420px]">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                <div className={`inline-block max-w-[85%] px-4 py-2.5 rounded-2xl ${m.role === 'user' 
                  ? 'bg-[#ffd700] text-black' 
                  : 'bg-[#1a1a24] text-white/90'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-gray-400 text-xs">Lumina is thinking...</div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#2a2a3a] bg-black/40">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about Lumina... or type /ask"
                className="flex-1 bg-[#0a0a0f] border border-[#2a2a3a] rounded-2xl px-4 py-3 text-sm focus:border-[#ffd700] outline-none"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="btn-primary px-4 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-[10px] text-center text-gray-500 mt-2">
              Powered by Freemodel • Knows the entire platform
            </div>
          </div>
        </div>
      )}
    </>
  );
}
