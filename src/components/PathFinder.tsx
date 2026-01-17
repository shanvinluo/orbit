'use client';

import React, { useState } from 'react';
import { Search, X, Route } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphNode } from '@/types';

interface PathFinderProps {
  nodes: GraphNode[];
  onPathFound: (path: { nodes: string[]; edges: string[] } | null) => void;
}

export default function PathFinder({ nodes, onPathFound }: PathFinderProps) {
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromResults, setFromResults] = useState<GraphNode[]>([]);
  const [toResults, setToResults] = useState<GraphNode[]>([]);
  const [fromSelected, setFromSelected] = useState<GraphNode | null>(null);
  const [toSelected, setToSelected] = useState<GraphNode | null>(null);
  const [isFromFocused, setIsFromFocused] = useState(false);
  const [isToFocused, setIsToFocused] = useState(false);
  const [fromSelectedIndex, setFromSelectedIndex] = useState(0);
  const [toSelectedIndex, setToSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const handleFromSearch = (val: string) => {
    setFromQuery(val);
    setFromSelectedIndex(0);
    if (val.length > 1) {
      const filtered = nodes.filter(n =>
        n.label.toLowerCase().includes(val.toLowerCase())
      );
      setFromResults(filtered.slice(0, 8));
    } else {
      setFromResults([]);
    }
  };

  const handleToSearch = (val: string) => {
    setToQuery(val);
    setToSelectedIndex(0);
    if (val.length > 1) {
      const filtered = nodes.filter(n =>
        n.label.toLowerCase().includes(val.toLowerCase())
      );
      setToResults(filtered.slice(0, 8));
    } else {
      setToResults([]);
    }
  };

  const handleSelectFrom = (node: GraphNode) => {
    setFromSelected(node);
    setFromQuery(node.label);
    setFromResults([]);
    setIsFromFocused(false);
  };

  const handleSelectTo = (node: GraphNode) => {
    setToSelected(node);
    setToQuery(node.label);
    setToResults([]);
    setIsToFocused(false);
  };

  const handleFindPath = async () => {
    if (!fromSelected || !toSelected) return;
    if (fromSelected.id === toSelected.id) {
      onPathFound(null);
      return;
    }

    try {
      const response = await fetch(`/api/paths?from=${fromSelected.id}&to=${toSelected.id}&depth=10`);
      const paths = await response.json();
      
      if (paths && paths.length > 0) {
        const shortestPath = paths[0]; // Already sorted by length
        const edgeIds = new Set<string>();
        shortestPath.edges.forEach((edge: any) => {
          const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
          const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
          // Add both directions since the graph traversal may use reverse edges
          // and GraphViz checks edge IDs in the format "source-target"
          edgeIds.add(`${sourceId}-${targetId}`);
          edgeIds.add(`${targetId}-${sourceId}`);
        });
        onPathFound({ nodes: shortestPath.nodes, edges: Array.from(edgeIds) });
      } else {
        onPathFound(null);
      }
    } catch (error) {
      console.error('Failed to find path:', error);
      onPathFound(null);
    }
  };

  const handleClear = () => {
    setFromSelected(null);
    setToSelected(null);
    setFromQuery('');
    setToQuery('');
    setFromResults([]);
    setToResults([]);
    onPathFound(null);
  };

  const handleFromKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && fromResults.length > 0) {
      e.preventDefault();
      handleSelectFrom(fromResults[fromSelectedIndex]);
    } else if (e.key === 'ArrowDown' && fromResults.length > 0) {
      e.preventDefault();
      setFromSelectedIndex((prev) => (prev + 1) % fromResults.length);
    } else if (e.key === 'ArrowUp' && fromResults.length > 0) {
      e.preventDefault();
      setFromSelectedIndex((prev) => (prev - 1 + fromResults.length) % fromResults.length);
    }
  };

  const handleToKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && toResults.length > 0) {
      e.preventDefault();
      handleSelectTo(toResults[toSelectedIndex]);
    } else if (e.key === 'ArrowDown' && toResults.length > 0) {
      e.preventDefault();
      setToSelectedIndex((prev) => (prev + 1) % toResults.length);
    } else if (e.key === 'ArrowUp' && toResults.length > 0) {
      e.preventDefault();
      setToSelectedIndex((prev) => (prev - 1 + toResults.length) % toResults.length);
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="absolute bottom-8 right-8 z-40 bg-violet-600/90 hover:bg-violet-600 text-white px-6 py-3 rounded-xl backdrop-blur-xl border border-violet-400/20 shadow-lg hover:shadow-violet-500/20 transition-all flex items-center gap-2"
      >
        <Route size={20} />
        <span>Find Path</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-8 right-8 z-40 w-[500px] max-w-[90vw] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Route className="text-violet-400" size={20} />
          <h3 className="text-white font-semibold text-lg">Find Shortest Path</h3>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            handleClear();
          }}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {/* From Node */}
        <div className="relative">
          <label className="block text-sm text-slate-400 mb-2">From</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={fromQuery}
              onChange={(e) => handleFromSearch(e.target.value)}
              onFocus={() => setIsFromFocused(true)}
              onBlur={() => setTimeout(() => setIsFromFocused(false), 200)}
              onKeyDown={handleFromKeyDown}
              placeholder="Select starting node..."
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            {fromSelected && (
              <button
                onClick={() => {
                  setFromSelected(null);
                  setFromQuery('');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <AnimatePresence>
            {isFromFocused && fromQuery.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
              >
                {fromResults.length > 0 ? (
                  fromResults.map((node, idx) => (
                    <button
                      key={node.id}
                      onClick={() => handleSelectFrom(node)}
                      className={`w-full text-left px-4 py-2 border-b border-white/5 last:border-none flex justify-between items-center transition-colors ${
                        idx === fromSelectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <span className="text-slate-200 text-sm">{node.label}</span>
                      <span className="text-xs text-slate-500 uppercase border border-white/10 px-2 py-0.5 rounded">
                        {node.type}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-slate-400 text-center text-sm italic">
                    No nodes found
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* To Node */}
        <div className="relative">
          <label className="block text-sm text-slate-400 mb-2">To</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={toQuery}
              onChange={(e) => handleToSearch(e.target.value)}
              onFocus={() => setIsToFocused(true)}
              onBlur={() => setTimeout(() => setIsToFocused(false), 200)}
              onKeyDown={handleToKeyDown}
              placeholder="Select destination node..."
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            {toSelected && (
              <button
                onClick={() => {
                  setToSelected(null);
                  setToQuery('');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <AnimatePresence>
            {isToFocused && toQuery.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
              >
                {toResults.length > 0 ? (
                  toResults.map((node, idx) => (
                    <button
                      key={node.id}
                      onClick={() => handleSelectTo(node)}
                      className={`w-full text-left px-4 py-2 border-b border-white/5 last:border-none flex justify-between items-center transition-colors ${
                        idx === toSelectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <span className="text-slate-200 text-sm">{node.label}</span>
                      <span className="text-xs text-slate-500 uppercase border border-white/10 px-2 py-0.5 rounded">
                        {node.type}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-slate-400 text-center text-sm italic">
                    No nodes found
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleFindPath}
            disabled={!fromSelected || !toSelected}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            Find Path
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </motion.div>
  );
}
