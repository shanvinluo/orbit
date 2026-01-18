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
            className="w-[360px] h-[480px] max-h-[75vh] bg-[#0a0a0f]/90 backdrop-blur-2xl border border-white/[0.08] rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Sparkles size={14} className="text-white" />
              </div>
              <h3 className="text-white font-medium text-sm flex-1">Orbit AI</h3>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-4 py-2.5 text-[13px] leading-[1.5] ${
                    msg.role === 'user' 
                      ? 'bg-violet-500 text-white rounded-2xl rounded-br-md' 
                      : 'bg-white/[0.05] text-white/70 rounded-2xl rounded-bl-md border border-white/[0.03]'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/[0.05] border border-white/[0.03] px-4 py-3 rounded-2xl rounded-bl-md">
                    <span className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask something..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 flex items-center justify-center bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-full text-white transition-all shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
