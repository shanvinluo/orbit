'use client';

import React, { useState } from 'react';
import { Search, X, Route, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [pathLength, setPathLength] = useState<number | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);

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
      setPathError('Please select two different nodes');
      onPathFound(null);
      setPathLength(null);
      return;
    }

    setIsLoading(true);
    setPathError(null);
    setPathLength(null);

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
        setPathLength(shortestPath.length);
        onPathFound({ nodes: shortestPath.nodes, edges: Array.from(edgeIds) });
      } else {
        setPathError('No path found between these nodes');
        setPathLength(null);
        onPathFound(null);
      }
    } catch (error) {
      console.error('Failed to find path:', error);
      setPathError('Failed to find path. Please try again.');
      setPathLength(null);
      onPathFound(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFromSelected(null);
    setToSelected(null);
    setFromQuery('');
    setToQuery('');
    setFromResults([]);
    setToResults([]);
    setPathLength(null);
    setPathError(null);
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
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="absolute top-[140px] left-8 z-40 bg-gradient-to-r from-violet-600/90 to-purple-600/90 hover:from-violet-500 hover:to-purple-500 text-white px-6 py-3.5 rounded-2xl backdrop-blur-xl border border-violet-400/30 shadow-lg shadow-violet-900/30 hover:shadow-violet-500/40 transition-all flex items-center gap-2.5 font-medium"
      >
        <Route size={20} className="drop-shadow-sm" />
        <span>Find Path</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute top-[140px] left-8 z-40 w-[520px] max-w-[90vw] bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
    >
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-r from-violet-900/30 via-purple-900/20 to-transparent border-b border-white/5 px-6 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.15),transparent_70%)]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-600/20 rounded-lg border border-violet-500/30">
              <Route className="text-violet-400" size={22} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg tracking-tight">Find Shortest Path</h3>
              <p className="text-slate-400 text-xs mt-0.5">Discover connections between nodes</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              handleClear();
            }}
            className="p-2 bg-black/20 hover:bg-black/40 rounded-lg text-slate-400 hover:text-white transition-all backdrop-blur-sm border border-white/5"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* From Node */}
        <div className="relative">
          <label className="block text-xs font-medium text-slate-400 mb-2.5 uppercase tracking-wider">Starting Node</label>
          {fromSelected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-xl px-4 py-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-violet-600/30 rounded-lg">
                  <CheckCircle2 className="text-violet-400" size={16} />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{fromSelected.label}</div>
                  <div className="text-xs text-slate-400">{fromSelected.type}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setFromSelected(null);
                  setFromQuery('');
                  setPathLength(null);
                  setPathError(null);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ) : (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={fromQuery}
                onChange={(e) => handleFromSearch(e.target.value)}
                onFocus={() => setIsFromFocused(true)}
                onBlur={() => setTimeout(() => setIsFromFocused(false), 200)}
                onKeyDown={handleFromKeyDown}
                placeholder="Search for starting node..."
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-12 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm"
              />
              <AnimatePresence>
                {isFromFocused && fromQuery.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-slate-800/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto"
                  >
                    {fromResults.length > 0 ? (
                      fromResults.map((node, idx) => (
                        <button
                          key={node.id}
                          onClick={() => handleSelectFrom(node)}
                          className={`w-full text-left px-4 py-3 border-b border-white/5 last:border-none flex justify-between items-center transition-colors ${
                            idx === fromSelectedIndex ? 'bg-violet-600/20 border-l-2 border-l-violet-500' : 'hover:bg-white/5'
                          }`}
                        >
                          <span className="text-slate-200 text-sm font-medium">{node.label}</span>
                          <span className="text-xs text-slate-500 uppercase border border-white/10 px-2 py-1 rounded-md bg-white/5">
                            {node.type}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-slate-400 text-center text-sm">
                        No nodes found
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Arrow Divider */}
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/10" />
            <ArrowRight size={18} className="text-violet-400/60" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        </div>

        {/* To Node */}
        <div className="relative">
          <label className="block text-xs font-medium text-slate-400 mb-2.5 uppercase tracking-wider">Destination Node</label>
          {toSelected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-xl px-4 py-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-violet-600/30 rounded-lg">
                  <CheckCircle2 className="text-violet-400" size={16} />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{toSelected.label}</div>
                  <div className="text-xs text-slate-400">{toSelected.type}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setToSelected(null);
                  setToQuery('');
                  setPathLength(null);
                  setPathError(null);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ) : (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={toQuery}
                onChange={(e) => handleToSearch(e.target.value)}
                onFocus={() => setIsToFocused(true)}
                onBlur={() => setTimeout(() => setIsToFocused(false), 200)}
                onKeyDown={handleToKeyDown}
                placeholder="Search for destination node..."
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-12 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm"
              />
              <AnimatePresence>
                {isToFocused && toQuery.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-slate-800/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto"
                  >
                    {toResults.length > 0 ? (
                      toResults.map((node, idx) => (
                        <button
                          key={node.id}
                          onClick={() => handleSelectTo(node)}
                          className={`w-full text-left px-4 py-3 border-b border-white/5 last:border-none flex justify-between items-center transition-colors ${
                            idx === toSelectedIndex ? 'bg-violet-600/20 border-l-2 border-l-violet-500' : 'hover:bg-white/5'
                          }`}
                        >
                          <span className="text-slate-200 text-sm font-medium">{node.label}</span>
                          <span className="text-xs text-slate-500 uppercase border border-white/10 px-2 py-1 rounded-md bg-white/5">
                            {node.type}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-slate-400 text-center text-sm">
                        No nodes found
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Path Result / Error */}
        <AnimatePresence>
          {pathLength !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-xl px-4 py-3.5 flex items-center gap-3"
            >
              <div className="p-1.5 bg-violet-600/30 rounded-lg">
                <CheckCircle2 className="text-violet-400" size={18} />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">Path Found!</div>
                <div className="text-xs text-slate-400">Shortest path: {pathLength} {pathLength === 1 ? 'step' : 'steps'}</div>
              </div>
            </motion.div>
          )}
          {pathError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3.5 flex items-center gap-3"
            >
              <AlertCircle className="text-red-400" size={18} />
              <div className="flex-1">
                <div className="text-red-400 font-medium text-sm">No Path Found</div>
                <div className="text-xs text-red-400/70">{pathError}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleFindPath}
            disabled={!fromSelected || !toSelected || isLoading}
            className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl transition-all font-medium shadow-lg shadow-violet-900/30 hover:shadow-violet-500/40 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Finding...</span>
              </>
            ) : (
              <>
                <Route size={18} />
                <span>Find Path</span>
              </>
            )}
          </button>
          <button
            onClick={handleClear}
            className="px-5 py-3.5 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 rounded-xl transition-all border border-white/10 hover:border-white/20 font-medium"
          >
            Clear
          </button>
        </div>
      </div>
    </motion.div>
  );
}
