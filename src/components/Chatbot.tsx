'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface ChatbotProps {
  onNewsAnalysis?: (analysis: any) => void;
}

// Simple heuristic to detect if text is likely news
const isLikelyNews = (text: string): boolean => {
  const newsKeywords = ['announced', 'reported', 'according to', 'breaking', 'news', 'article', 'sources', 'confirmed', 'invaded', 'stocks would be affected', 'which stocks', 'affected stocks', 'market impact', 'financial impact'];
  const lowerText = text.toLowerCase();
  const hasNewsKeywords = newsKeywords.some(keyword => lowerText.includes(keyword));
  const isLongText = text.length > 200; // News articles are typically longer
  const hasMultipleSentences = (text.match(/[.!?]/g) || []).length >= 3;
  const asksAboutImpact = lowerText.includes('affected') || lowerText.includes('impact') || lowerText.includes('stocks');
  
  return (hasNewsKeywords || isLongText || asksAboutImpact) && (hasMultipleSentences || asksAboutImpact);
};

export default function Chatbot({ onNewsAnalysis }: ChatbotProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Hello! I can analyze the relationships in the graph. Paste a news article or ask about a connection.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Detect if this is news
      const isNews = isLikelyNews(userMsg.content);
      const analysisType = isNews ? 'news' : 'relationship';
      
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMsg.content, type: analysisType })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Server error: ${res.status}` }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      
      // Handle errors first
      if (data.error) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: data.error
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }
      
      // Handle news analysis
      if (data.analysisType === 'news' && data.affectedCompanies) {
        const affectedCount = data.affectedCompanies.length;
        let responseContent = `📰 Analyzed the news article and identified ${affectedCount} affected compan${affectedCount === 1 ? 'y' : 'ies'} in the graph. `;
        
        if (affectedCount > 0) {
          responseContent += `The companies have been highlighted in the graph. Click to see detailed impact analysis.`;
          // Pass to parent for highlighting and popup
          if (onNewsAnalysis) {
            onNewsAnalysis(data);
          }
        } else {
          responseContent += `However, none of the mentioned companies were found in the current graph.`;
        }
        
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: responseContent
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        // Handle relationship analysis (existing logic)
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: data.error || data.explanation || "I couldn't analyze that."
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (e: any) {
      console.error('Chatbot error:', e);
      const errorMessage = e?.message || String(e);
      
      let userMessage = "Sorry, I encountered an error connecting to the AI service.";
      
      // Provide more specific error messages
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
        userMessage = "Network error: Could not connect to the server. Please check your internet connection.";
      } else if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        userMessage = "API key error: Your Gemini API key may be invalid or expired. Please check your .env.local file.";
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        userMessage = "Model not found: The AI model is not available. This may be an API key permissions issue.";
      } else if (errorMessage) {
        userMessage = `Error: ${errorMessage.substring(0, 200)}`;
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: userMessage
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 50, backgroundColor: 'white' }}
        className={`p-4 rounded-full transition-all hover:scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)] ${isOpen ? 'hidden' : 'flex'}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Sparkles size={24} className="text-black fill-black" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 50 }}
            className="w-[380px] h-[600px] max-h-[80vh] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <Sparkles size={18} className="text-violet-400" />
                </div>
                <span className="font-bold text-white">Orbit AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-white/10 text-slate-200 rounded-tl-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 px-4 py-2 rounded-2xl rounded-tl-sm">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything..."
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
                <button 
                  onClick={handleSend}
                  className="p-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-white transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
