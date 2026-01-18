'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ChevronDown, ChevronUp, Newspaper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  suggestions?: string[];
  actionType?: 'search' | 'filter' | 'find_path' | 'clear_filter';
}

interface ChatbotProps {
  onNewsAnalysis?: (analysis: any) => void;
  onSearch?: (companyId: string, companyName: string) => void;
  onFilter?: (edgeTypes: string[]) => void;
  onClearFilter?: () => void;
  onFindPath?: (fromId: string, toId: string) => void;
}

// Detect if the query is a command (search, filter, path) or content query
const isCommandQuery = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  
  // Command keywords
  const commandKeywords = [
    'show me', 'find', 'search', 'look up', 'select', 'go to', 'focus on',
    'filter', 'only show', 'hide', 'show only',
    'path from', 'path between', 'connected to', 'connection from', 'how is', 'relationship between',
    'clear filter', 'reset', 'show all', 'show everything'
  ];
  
  return commandKeywords.some(keyword => lowerText.includes(keyword));
};

// Detect the type of query: 'news', 'relationship', or 'general'
const detectQueryType = (text: string): 'news' | 'relationship' | 'general' => {
  const lowerText = text.toLowerCase();
  
  // Impact/scenario analysis detection - route to news for bullish/bearish analysis
  const impactKeywords = ['affected', 'impact', 'crashes', 'crash', 'fails', 'bankrupt', 'goes down', 'drops', 'rises', 'grows', 'expands', 'acquires', 'merges'];
  const scenarioKeywords = ['if', 'what would', 'what happens', 'which companies', 'which stocks', 'what stocks'];
  const hasImpactKeywords = impactKeywords.some(keyword => lowerText.includes(keyword));
  const hasScenarioKeywords = scenarioKeywords.some(keyword => lowerText.includes(keyword));
  
  // If asking about impact scenarios, use news analysis for bullish/bearish
  if (hasImpactKeywords && hasScenarioKeywords) {
    return 'news';
  }
  
  // News article detection: Long text with news keywords
  const newsKeywords = ['announced', 'reported', 'according to', 'breaking', 'news', 'article', 'sources', 'confirmed', 'invaded'];
  const hasNewsKeywords = newsKeywords.some(keyword => lowerText.includes(keyword));
  const isLongText = text.length > 200;
  const hasMultipleSentences = (text.match(/[.!?]/g) || []).length >= 3;
  
  if ((hasNewsKeywords && hasMultipleSentences) || (isLongText && hasMultipleSentences)) {
    return 'news';
  }
  
  // Relationship detection: Asks about connections between specific companies
  const relationshipKeywords = ['connection', 'connected', 'relationship', 'between', 'path', 'link', 'linked'];
  const hasRelationshipKeywords = relationshipKeywords.some(keyword => lowerText.includes(keyword));
  
  // Check if two company-like names are mentioned (capitalized words)
  const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  const potentialCompanies = capitalizedWords.filter(w => w.length > 3);
  
  if (hasRelationshipKeywords && potentialCompanies.length >= 2) {
    return 'relationship';
  }
  
  // Default to general finance Q&A
  return 'general';
};

// Generate contextual suggestions based on the conversation
const generateSuggestions = (aiContent: string, analysisType: 'news' | 'general' | 'relationship' | 'greeting' | 'error'): string[] => {
  if (analysisType === 'news') {
    return [
      "Show me the supply chain connections",
      "Which companies are most at risk?",
      "Find paths between affected companies"
    ];
  }
  
  if (analysisType === 'greeting') {
    return [
      "What is a P/E ratio?",
      "Tell me about Apple's competitors",
      "How does the semiconductor industry work?"
    ];
  }
  
  if (analysisType === 'relationship') {
    return [
      "Show me indirect connections",
      "Which industries are most connected?",
      "Find the most influential companies"
    ];
  }
  
  if (analysisType === 'error') {
    return [
      "What are ETFs?",
      "Tell me about NVIDIA",
      "How do supply chains work?"
    ];
  }
  
  // General finance Q&A suggestions
  return [
    "Tell me more about this",
    "What companies are involved?",
    "How does this affect the market?"
  ];
};

export default function Chatbot({ onNewsAnalysis, onSearch, onFilter, onClearFilter, onFindPath }: ChatbotProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Hello! I can answer questions, analyze news, and control the graph. Try commands like "Show me Apple", "Filter to ownership", or "Find path from Tesla to NVIDIA"!',
      suggestions: [
        "Show me Microsoft",
        "Filter to supplier relationships",
        "Find path from Apple to NVIDIA"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Auto-send after a brief delay so user can see what's being sent
    setTimeout(() => {
      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: suggestion };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      handleSendWithContent(suggestion);
    }, 100);
  };

  const handleSendWithContent = async (content: string) => {
    setIsLoading(true);

    try {
      // Check if this is a command query first
      if (isCommandQuery(content)) {
        const cmdRes = await fetch('/api/ai/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: content })
        });

        if (cmdRes.ok) {
          const cmdData = await cmdRes.json();
          const { command, message } = cmdData;

          // Execute the command if it's actionable
          if (command.type !== 'none') {
            let actionTaken = false;
            let actionType: 'search' | 'filter' | 'find_path' | 'clear_filter' | undefined;

            switch (command.type) {
              case 'search':
                if (command.params.companyId && onSearch) {
                  onSearch(command.params.companyId, command.params.companyName);
                  actionTaken = true;
                  actionType = 'search';
                }
                break;
              case 'filter':
                if (command.params.edgeTypes && onFilter) {
                  onFilter(command.params.edgeTypes);
                  actionTaken = true;
                  actionType = 'filter';
                }
                break;
              case 'find_path':
                if (command.params.fromId && command.params.toId && onFindPath) {
                  onFindPath(command.params.fromId, command.params.toId);
                  actionTaken = true;
                  actionType = 'find_path';
                }
                break;
              case 'clear_filter':
                if (onClearFilter) {
                  onClearFilter();
                  actionTaken = true;
                  actionType = 'clear_filter';
                }
                break;
            }

            if (actionTaken) {
              const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: message,
                actionType,
                suggestions: generateCommandSuggestions(command.type)
              };
              setMessages(prev => [...prev, aiMsg]);
              setIsLoading(false);
              return;
            }
          }

          // Command not actionable, show the message
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: message,
            suggestions: generateSuggestions(message, 'error')
          };
          setMessages(prev => [...prev, aiMsg]);
          setIsLoading(false);
          return;
        }
      }

      // Not a command - proceed with normal analysis
      const queryType = detectQueryType(content);
      
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, type: queryType })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Server error: ${res.status}` }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      
      if (data.error) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: data.error,
          suggestions: generateSuggestions(data.error, 'error')
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }
      
      // Handle news analysis
      if (data.analysisType === 'news' && data.affectedCompanies) {
        const affectedCount = data.affectedCompanies.length;
        let responseContent = `Analyzed the news and identified ${affectedCount} affected compan${affectedCount === 1 ? 'y' : 'ies'}. `;
        
        if (affectedCount > 0) {
          responseContent += `Companies highlighted in the graph.`;
          if (onNewsAnalysis) {
            onNewsAnalysis(data);
          }
        } else {
          responseContent += `No matching companies found in the graph.`;
        }
        
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: responseContent,
          suggestions: generateSuggestions(responseContent, 'news')
        };
        setMessages(prev => [...prev, aiMsg]);
      } 
      // Handle general finance Q&A with optional company highlighting
      else if (data.analysisType === 'general') {
        const responseContent = data.answer || "I couldn't process that question.";
        
        // If companies were mentioned, highlight them
        if (data.mentionedCompanies && data.mentionedCompanies.length > 0 && onNewsAnalysis) {
          onNewsAnalysis({ 
            affectedCompanies: data.mentionedCompanies,
            analysisType: 'general'
          });
        }
        
        const companyCount = data.mentionedCompanies?.length || 0;
        let fullResponse = responseContent;
        if (companyCount > 0) {
          fullResponse += ` (${companyCount} compan${companyCount === 1 ? 'y' : 'ies'} highlighted)`;
        }
        
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: fullResponse,
          suggestions: generateSuggestions(responseContent, 'general')
        };
        setMessages(prev => [...prev, aiMsg]);
      }
      // Handle relationship analysis
      else {
        const responseContent = data.error || data.explanation || "I couldn't analyze that.";
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: responseContent,
          suggestions: generateSuggestions(responseContent, 'relationship')
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (e: any) {
      console.error('Chatbot error:', e);
      const errorMessage = e?.message || String(e);
      
      let userMessage = "Error connecting to AI service.";
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
        userMessage = "Network error. Check your connection.";
      } else if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        userMessage = "API key error. Check your .env.local file.";
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        userMessage = "Model not available. Check API key permissions.";
      } else if (errorMessage) {
        userMessage = `Error: ${errorMessage.substring(0, 150)}`;
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: userMessage,
        suggestions: generateSuggestions(userMessage, 'error')
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate suggestions after executing a command
  const generateCommandSuggestions = (commandType: string): string[] => {
    switch (commandType) {
      case 'search':
        return [
          "Find path to another company",
          "Show supplier relationships",
          "What companies are connected?"
        ];
      case 'filter':
        return [
          "Clear all filters",
          "Also show ownership",
          "Find a company"
        ];
      case 'find_path':
        return [
          "Find another path",
          "Show me the starting company",
          "Filter to this relationship type"
        ];
      case 'clear_filter':
        return [
          "Filter to ownership only",
          "Show me Apple",
          "Find path between companies"
        ];
      default:
        return [
          "Show me Microsoft",
          "Filter to suppliers",
          "Find path from Apple to NVIDIA"
        ];
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const content = input;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    await handleSendWithContent(content);
  };

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
      style={{
        position: 'fixed',
        bottom: 0,
        right: 24,
        width: 380,
        maxHeight: isCollapsed ? 'auto' : '60vh',
        backgroundColor: '#0f172a',
        borderTop: '3px solid #8b5cf6',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px 24px 0 0',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.1)'
      }}
    >
      {/* Drag Handle */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
        <div style={{ width: 40, height: 5, backgroundColor: '#475569', borderRadius: 3 }} />
      </div>

      {/* Header */}
      <div style={{ 
        padding: '12px 20px 16px', 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'linear-gradient(to right, rgba(139, 92, 246, 0.15), transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              padding: 8, 
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              borderRadius: 10,
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}>
              <Sparkles color="white" size={16} />
            </div>
            <div>
              <h2 style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: 0 }}>
                Orbit AI
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <div style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)'
                }} />
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Ready to analyze</span>
              </div>
            </div>
          </div>
          <motion.button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{ 
              padding: 6, 
              backgroundColor: 'rgba(0,0,0,0.3)', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronUp color="#94a3b8" size={16} />
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Content - Animated collapse */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
          >
            {/* Messages */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxHeight: '35vh'
            }}>
              {messages.map((msg, idx) => (
                <React.Fragment key={msg.id}>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ 
                      display: 'flex', 
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' 
                    }}
                  >
                    {msg.role === 'ai' && (
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.2))',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8,
                        flexShrink: 0
                      }}>
                        <Sparkles color="#a78bfa" size={12} />
                      </div>
                    )}
                    <div style={{ 
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      fontSize: 13,
                      lineHeight: 1.5,
                      background: msg.role === 'user' 
                        ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                        : 'rgba(30, 41, 59, 0.8)',
                      color: msg.role === 'user' ? 'white' : '#e2e8f0',
                      border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: msg.role === 'user' 
                        ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                        : 'none'
                    }}>
                      {msg.content}
                    </div>
                  </motion.div>
                  {/* Suggestion chips for AI messages */}
                  {msg.role === 'ai' && msg.suggestions && idx === messages.length - 1 && !isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginLeft: 32,
                        marginTop: 8
                      }}
                    >
                      {msg.suggestions.map((suggestion, sIdx) => (
                        <motion.button
                          key={sIdx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          whileHover={{ scale: 1.02, backgroundColor: 'rgba(139, 92, 246, 0.25)' }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            padding: '6px 12px',
                            fontSize: 11,
                            color: '#c4b5fd',
                            background: 'rgba(139, 92, 246, 0.12)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: 16,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: 'flex', justifyContent: 'flex-start' }}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.2))',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    flexShrink: 0
                  }}>
                    <Sparkles color="#a78bfa" size={12} />
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '14px 14px 14px 4px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <span style={{ display: 'flex', gap: 5 }}>
                      <motion.span 
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        style={{ width: 6, height: 6, backgroundColor: '#a78bfa', borderRadius: '50%' }}
                      />
                      <motion.span 
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                        style={{ width: 6, height: 6, backgroundColor: '#a78bfa', borderRadius: '50%' }}
                      />
                      <motion.span 
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                        style={{ width: 6, height: 6, backgroundColor: '#a78bfa', borderRadius: '50%' }}
                      />
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ 
              padding: '12px 16px 16px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15, 23, 42, 0.5)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10,
                padding: '10px 12px',
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12
              }}>
                <Newspaper color="#64748b" size={16} />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Paste news or ask a question..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 13,
                    color: 'white'
                  }}
                />
                <motion.button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: input.trim() && !isLoading 
                      ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                      : 'rgba(100, 116, 139, 0.3)',
                    border: 'none',
                    cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: input.trim() && !isLoading 
                      ? '0 4px 12px rgba(139, 92, 246, 0.4)'
                      : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <Send color="white" size={14} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
