'use client';

import React, { useState } from 'react';
import { Filter, Route } from 'lucide-react';
import { motion } from 'framer-motion';
import { GraphNode } from '@/types';

import { EdgeType } from '@/types';

interface ToolsNavbarProps {
  nodes: GraphNode[];
  enabledTypes: Set<EdgeType>;
  onToggle: (type: EdgeType) => void;
  onToggleAll: () => void;
  onPathFound: (path: { nodes: string[]; edges: string[] } | null) => void;
}

type ActiveTool = 'filter' | 'path' | null;

export default function ToolsNavbar({ 
  nodes, 
  enabledTypes, 
  onToggle, 
  onToggleAll, 
  onPathFound 
}: ToolsNavbarProps) {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

  const handleToolClick = (tool: ActiveTool) => {
    setActiveTool(activeTool === tool ? null : tool);
  };

  return (
    <div className="absolute top-24 left-8 z-40">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3"
      >
        {/* Toolbar buttons */}
        <div className="flex gap-2 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-xl">
          <button
            onClick={() => handleToolClick('filter')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTool === 'filter'
                ? 'bg-violet-600 text-white'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Filter size={18} />
            <span className="text-sm font-medium">Relationships</span>
          </button>
          <button
            onClick={() => handleToolClick('path')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTool === 'path'
                ? 'bg-violet-600 text-white'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Route size={18} />
            <span className="text-sm font-medium">Find Path</span>
          </button>
        </div>

        {/* Active tool panel */}
        {activeTool === 'filter' && (
          <RelationshipFilterPanel
            enabledTypes={enabledTypes}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
          />
        )}
        {activeTool === 'path' && (
          <PathFinderPanel
            nodes={nodes}
            onPathFound={onPathFound}
          />
        )}
      </motion.div>
    </div>
  );
}

// Inline filter panel (extracted from RelationshipFilter)
function RelationshipFilterPanel({ 
  enabledTypes, 
  onToggle, 
  onToggleAll 
}: { 
  enabledTypes: Set<EdgeType>; 
  onToggle: (type: EdgeType) => void; 
  onToggleAll: () => void;
}) {
  const allTypes = Object.values(EdgeType);
  const allEnabled = allTypes.every(type => enabledTypes.has(type));
  const { EDGE_COLORS, EDGE_LABELS } = require('@/types');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="w-[340px] bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-violet-900/20 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold text-sm">Filter Relationships</h3>
          <button
            onClick={onToggleAll}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            {allEnabled ? 'Hide All' : 'Show All'}
          </button>
        </div>
        <div className="text-xs text-slate-400">
          {enabledTypes.size} of {allTypes.length} visible
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {allTypes.map((type) => {
          const isEnabled = enabledTypes.has(type);
          const color = EDGE_COLORS[type];
          const label = EDGE_LABELS[type];
          return (
            <button
              key={type}
              onClick={() => onToggle(type)}
              className="w-full px-5 py-3 border-b border-white/5 last:border-none flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <div
                className="w-3 h-3 rounded-full border-2 border-white/20"
                style={{ backgroundColor: isEnabled ? color : 'transparent' }}
              />
              <span className={`text-sm flex-1 text-left ${isEnabled ? 'text-white' : 'text-slate-500'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// Inline path finder panel (simplified from PathFinder)
import { Search, ArrowRight, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

function PathFinderPanel({ 
  nodes, 
  onPathFound 
}: { 
  nodes: GraphNode[]; 
  onPathFound: (path: { nodes: string[]; edges: string[] } | null) => void;
}) {
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromResults, setFromResults] = useState<GraphNode[]>([]);
  const [toResults, setToResults] = useState<GraphNode[]>([]);
  const [fromSelected, setFromSelected] = useState<GraphNode | null>(null);
  const [toSelected, setToSelected] = useState<GraphNode | null>(null);
  const [isFromFocused, setIsFromFocused] = useState(false);
  const [isToFocused, setIsToFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pathLength, setPathLength] = useState<number | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);

  const handleFromSearch = (val: string) => {
    setFromQuery(val);
    if (val.length > 1) {
      setFromResults(nodes.filter(n => n.label.toLowerCase().includes(val.toLowerCase())).slice(0, 6));
    } else {
      setFromResults([]);
    }
  };

  const handleToSearch = (val: string) => {
    setToQuery(val);
    if (val.length > 1) {
      setToResults(nodes.filter(n => n.label.toLowerCase().includes(val.toLowerCase())).slice(0, 6));
    } else {
      setToResults([]);
    }
  };

  const handleFindPath = async () => {
    if (!fromSelected || !toSelected) return;
    if (fromSelected.id === toSelected.id) {
      setPathError('Select two different nodes');
      return;
    }

    setIsLoading(true);
    setPathError(null);
    setPathLength(null);

    try {
      const response = await fetch(`/api/paths?from=${fromSelected.id}&to=${toSelected.id}&depth=10`);
      const paths = await response.json();
      
      if (paths && paths.length > 0) {
        const shortestPath = paths[0];
        const edgeIds = new Set<string>();
        shortestPath.edges.forEach((edge: any) => {
          const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
          const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
          edgeIds.add(`${sourceId}-${targetId}`);
          edgeIds.add(`${targetId}-${sourceId}`);
        });
        setPathLength(shortestPath.length);
        onPathFound({ nodes: shortestPath.nodes, edges: Array.from(edgeIds) });
      } else {
        setPathError('No path found');
        onPathFound(null);
      }
    } catch {
      setPathError('Failed to find path');
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
    setPathLength(null);
    setPathError(null);
    onPathFound(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-[400px] bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-violet-900/20 to-transparent">
        <h3 className="text-white font-semibold text-sm">Find Shortest Path</h3>
        <p className="text-xs text-slate-400 mt-1">Discover connections between nodes</p>
      </div>

      <div className="p-4 space-y-4">
        {/* From Node */}
        <div className="relative">
          <label className="block text-xs text-slate-400 mb-2">From</label>
          {fromSelected ? (
            <div className="flex items-center justify-between bg-violet-600/20 border border-violet-500/30 rounded-xl px-3 py-2">
              <span className="text-white text-sm">{fromSelected.label}</span>
              <button onClick={() => { setFromSelected(null); setFromQuery(''); }} className="text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={fromQuery}
                onChange={(e) => handleFromSearch(e.target.value)}
                onFocus={() => setIsFromFocused(true)}
                onBlur={() => setTimeout(() => setIsFromFocused(false), 200)}
                placeholder="Search node..."
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
              />
              {isFromFocused && fromResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/10 rounded-xl overflow-hidden z-50">
                  {fromResults.map(node => (
                    <button
                      key={node.id}
                      onClick={() => { setFromSelected(node); setFromQuery(node.label); setFromResults([]); }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                    >
                      {node.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <ArrowRight size={16} className="text-slate-500" />
        </div>

        {/* To Node */}
        <div className="relative">
          <label className="block text-xs text-slate-400 mb-2">To</label>
          {toSelected ? (
            <div className="flex items-center justify-between bg-violet-600/20 border border-violet-500/30 rounded-xl px-3 py-2">
              <span className="text-white text-sm">{toSelected.label}</span>
              <button onClick={() => { setToSelected(null); setToQuery(''); }} className="text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={toQuery}
                onChange={(e) => handleToSearch(e.target.value)}
                onFocus={() => setIsToFocused(true)}
                onBlur={() => setTimeout(() => setIsToFocused(false), 200)}
                placeholder="Search node..."
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
              />
              {isToFocused && toResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/10 rounded-xl overflow-hidden z-50">
                  {toResults.map(node => (
                    <button
                      key={node.id}
                      onClick={() => { setToSelected(node); setToQuery(node.label); setToResults([]); }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                    >
                      {node.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Result */}
        {pathLength !== null && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle2 size={16} />
            <span>Path found: {pathLength} steps</span>
          </div>
        )}
        {pathError && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>{pathError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleFindPath}
            disabled={!fromSelected || !toSelected || isLoading}
            className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Route size={16} />}
            {isLoading ? 'Finding...' : 'Find Path'}
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
          >
            Clear
          </button>
        </div>
      </div>
    </motion.div>
  );
}
