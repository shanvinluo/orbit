'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphNode } from '@/types';

interface SearchBarProps {
  nodes: GraphNode[];
  onSelect: (node: GraphNode) => void;
}

export default function SearchBar({ nodes, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GraphNode[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSearch = (val: string) => {
    setQuery(val);
    setSelectedIndex(0);
    if (val.length > 1) {
      const filtered = nodes.filter(n =>
        n.label.toLowerCase().includes(val.toLowerCase())
      );
      setResults(filtered.slice(0, 8));
    } else {
      setResults([]);
    }
  };

  const handleSelectNode = (node: GraphNode) => {
    onSelect(node);
    setQuery(node.label);
    setResults([]);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelectNode(results[selectedIndex]);
    } else if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Escape') {
      setResults([]);
      setIsFocused(false);
      setQuery('');
    }
  };

  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-40 w-[600px] max-w-[90vw]">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`relative bg-slate-900/80 backdrop-blur-xl border rounded-2xl transition-all duration-300 ${isFocused ? 'border-white shadow-[0_0_25px_rgba(255,255,255,0.2)]' : 'border-white/10 hover:border-white/20'}`}
      >
        <div className="flex items-center px-6 py-4">
          <Search className={`mr-4 transition-colors ${isFocused ? 'text-violet-400' : 'text-slate-400'}`} size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Search companies..."
            className="bg-transparent border-none focus:outline-none text-white text-lg w-full placeholder-slate-500 font-light placeholder:text-slate-500"
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {isFocused && query.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {results.length > 0 ? (
              results.map((node, idx) => (
                <button
                  key={node.id}
                  onClick={() => handleSelectNode(node)}
                  className={`w-full text-left px-6 py-3 border-b border-white/5 last:border-none flex justify-between items-center transition-colors ${
                    idx === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="text-slate-200">{node.label}</span>
                  <span className="text-xs text-slate-500 uppercase border border-white/10 px-2 py-0.5 rounded">
                    {node.type}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-6 py-4 text-slate-400 text-center italic">
                No companies found matching "{query}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
