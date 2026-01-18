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
  const [isOpen, setIsOpen] = useState(true);
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50 }}
            className="w-[400px] h-[550px] max-h-[80vh] bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header with gradient */}
            <div className="relative border-b border-white/5 px-6 py-5 bg-gradient-to-r from-violet-900/30 via-purple-900/20 to-transparent">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.15),transparent_70%)]" />
              <div className="relative flex items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-violet-600/20 rounded-xl border border-violet-500/30">
                    <Sparkles size={20} className="text-violet-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-white text-lg tracking-tight">Orbit AI</span>
                    <p className="text-xs text-slate-400 mt-0.5">Analyze relationships & news</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl rounded-br-md shadow-lg shadow-violet-900/20' 
                      : 'bg-white/5 border border-white/10 text-slate-200 rounded-2xl rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl rounded-bl-md">
                    <span className="flex gap-1.5">
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-5 border-t border-white/5 bg-slate-800/30">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything..."
                  className="flex-1 bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-lg shadow-violet-900/30 hover:shadow-violet-500/40"
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
