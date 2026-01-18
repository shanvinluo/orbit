'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Route, Search, X, ArrowRight, CheckCircle2, Loader2, AlertCircle, CheckSquare, Square, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphNode, EdgeType, PathItem, PathsResponse } from '@/types';

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
    <div className="absolute top-24 left-6 z-40">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3"
      >
        {/* Pill-style toolbar */}
        <div className="flex gap-1.5 bg-black/30 backdrop-blur-2xl border border-white/[0.06] rounded-full p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <button
            onClick={() => handleToolClick('filter')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
              activeTool === 'filter'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Filter size={16} />
            <span className="text-[13px] font-medium">Filters</span>
          </button>
          <button
            onClick={() => handleToolClick('path')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
              activeTool === 'path'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Route size={16} />
            <span className="text-[13px] font-medium">Path</span>
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
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      className="w-[300px] bg-black/40 backdrop-blur-2xl border border-white/[0.06] rounded-[1.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"
    >
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-medium text-[14px]">Relationships</h3>
          <p className="text-[11px] text-white/40 mt-0.5">{enabledTypes.size} of {allTypes.length} active</p>
        </div>
        <button
          onClick={onToggleAll}
          className="text-[11px] text-white/50 hover:text-white/80 transition-colors px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08]"
        >
          {allEnabled ? 'None' : 'All'}
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto px-3 pb-3">
        <div className="grid grid-cols-2 gap-1.5">
          {allTypes.map((type) => {
            const isEnabled = enabledTypes.has(type);
            const color = EDGE_COLORS[type];
            const label = EDGE_LABELS[type];
            return (
              <button
                key={type}
                onClick={() => onToggle(type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150 ${
                  isEnabled ? 'bg-white/[0.08]' : 'bg-transparent hover:bg-white/[0.04]'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isEnabled ? color : 'rgba(255,255,255,0.15)' }}
                />
                <span className={`text-[12px] truncate ${isEnabled ? 'text-white/90' : 'text-white/40'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// Inline path finder panel (simplified from PathFinder)
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
  const [pathError, setPathError] = useState<string | null>(null);
  const [paths, setPaths] = useState<PathItem[]>([]);
  const [selectedPathIds, setSelectedPathIds] = useState<Set<string>>(new Set());
  const [maxDepth, setMaxDepth] = useState<number>(4);

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

  // Update highlighting when selection changes
  useEffect(() => {
    if (selectedPathIds.size === 0) {
      onPathFound(null);
      return;
    }

    const selectedPaths = paths.filter(p => selectedPathIds.has(p.pathId));
    if (selectedPaths.length === 0) {
      onPathFound(null);
      return;
    }

    // Union of all nodes and edges from selected paths
    const allNodes = new Set<string>();
    const allEdgeIds = new Set<string>();

    selectedPaths.forEach(path => {
      path.nodes.forEach(nodeId => allNodes.add(nodeId));
      path.edges.forEach((edge: any) => {
        const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
        const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
        allEdgeIds.add(`${sourceId}-${targetId}`);
        allEdgeIds.add(`${targetId}-${sourceId}`);
      });
    });

    onPathFound({ nodes: Array.from(allNodes), edges: Array.from(allEdgeIds) });
  }, [selectedPathIds, paths, onPathFound]);

  // Clear selection when A/B changes
  useEffect(() => {
    setPaths([]);
    setSelectedPathIds(new Set());
    setPathError(null);
  }, [fromSelected?.id, toSelected?.id]);

  const handleFindPaths = async () => {
    if (!fromSelected || !toSelected) return;
    if (fromSelected.id === toSelected.id) {
      setPathError('Please select two different nodes');
      onPathFound(null);
      setPaths([]);
      setSelectedPathIds(new Set());
      return;
    }

    setIsLoading(true);
    setPathError(null);
    setPaths([]);
    setSelectedPathIds(new Set());

    try {
      const response = await fetch(`/api/paths?from=${fromSelected.id}&to=${toSelected.id}&depth=${maxDepth}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      let data: PathsResponse;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError, 'Response text:', text);
        throw new Error('Invalid JSON response from server');
      }
      
      if (data.paths && data.paths.length > 0) {
        setPaths(data.paths);
        // Default: select the shortest path (first one)
        if (data.shortestPath) {
          setSelectedPathIds(new Set([data.shortestPath.pathId]));
        }
      } else {
        setPathError('No paths found within depth ' + maxDepth + '.');
        setPaths([]);
        setSelectedPathIds(new Set());
        onPathFound(null);
      }
    } catch (error) {
      console.error('Failed to find paths:', error);
      setPathError(error instanceof Error ? error.message : 'Failed to find paths. Please try again.');
      setPaths([]);
      setSelectedPathIds(new Set());
      onPathFound(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePath = (pathId: string) => {
    setSelectedPathIds(prev => {
      const next = new Set(prev);
      if (next.has(pathId)) {
        next.delete(pathId);
      } else {
        next.add(pathId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedPathIds(new Set(paths.map(p => p.pathId)));
  };

  const handleClearSelection = () => {
    setSelectedPathIds(new Set());
  };

  const formatPathSequence = (path: PathItem): string => {
    const nodeLabels = path.nodes.map(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      return node ? node.label : nodeId;
    });
    return nodeLabels.join(' → ');
  };

  const handleClear = () => {
    setFromSelected(null);
    setToSelected(null);
    setFromQuery('');
    setToQuery('');
    setPaths([]);
    setSelectedPathIds(new Set());
    setPathError(null);
    onPathFound(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-[320px] bg-black/40 backdrop-blur-2xl border border-white/[0.06] rounded-[1.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"
    >
      <div className="px-5 py-4">
        <h3 className="text-white font-medium text-[14px]">Find Path</h3>
        <p className="text-[11px] text-white/40 mt-0.5">Discover connections</p>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* From Node */}
        <div className="relative">
          {fromSelected ? (
            <div className="flex items-center justify-between bg-white/[0.06] rounded-xl px-3.5 py-2.5">
              <span className="text-white/90 text-[13px]">{fromSelected.label}</span>
              <button onClick={() => { setFromSelected(null); setFromQuery(''); }} className="text-white/30 hover:text-white/70">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
              <input
                value={fromQuery}
                onChange={(e) => handleFromSearch(e.target.value)}
                onFocus={() => setIsFromFocused(true)}
                onBlur={() => setTimeout(() => setIsFromFocused(false), 200)}
                placeholder="From..."
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2.5 text-white text-[13px] placeholder-white/30 focus:outline-none focus:border-white/[0.12] transition-colors"
              />
              {isFromFocused && fromResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-black/80 backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden z-50">
                  {fromResults.map(node => (
                    <button
                      key={node.id}
                      onClick={() => { setFromSelected(node); setFromQuery(node.label); setFromResults([]); }}
                      className="w-full px-3.5 py-2.5 text-left text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
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
          <div className="w-6 h-6 rounded-full bg-white/[0.04] flex items-center justify-center">
            <ArrowRight size={12} className="text-white/30" />
          </div>
        </div>

        {/* To Node */}
        <div className="relative">
          {toSelected ? (
            <div className="flex items-center justify-between bg-white/[0.06] rounded-xl px-3.5 py-2.5">
              <span className="text-white/90 text-[13px]">{toSelected.label}</span>
              <button onClick={() => { setToSelected(null); setToQuery(''); }} className="text-white/30 hover:text-white/70">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
              <input
                value={toQuery}
                onChange={(e) => handleToSearch(e.target.value)}
                onFocus={() => setIsToFocused(true)}
                onBlur={() => setTimeout(() => setIsToFocused(false), 200)}
                placeholder="To..."
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2.5 text-white text-[13px] placeholder-white/30 focus:outline-none focus:border-white/[0.12] transition-colors"
              />
              {isToFocused && toResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-black/80 backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden z-50">
                  {toResults.map(node => (
                    <button
                      key={node.id}
                      onClick={() => { setToSelected(node); setToQuery(node.label); setToResults([]); }}
                      className="w-full px-3.5 py-2.5 text-left text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                    >
                      {node.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Depth Selector */}
        <div className="relative">
          <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            Max Depth (Hops)
          </label>
          <select
            value={maxDepth}
            onChange={(e) => setMaxDepth(parseInt(e.target.value))}
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-white text-[12px] focus:outline-none focus:border-white/[0.12] transition-colors"
          >
            <option value={2}>2 hops</option>
            <option value={3}>3 hops</option>
            <option value={4}>4 hops</option>
            <option value={5}>5 hops</option>
            <option value={6}>6 hops</option>
            <option value={7}>7 hops</option>
          </select>
        </div>

        {/* Path Results */}
        <AnimatePresence>
          {paths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2 max-h-[400px] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
                  Found {paths.length} path{paths.length !== 1 ? 's' : ''}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleSelectAll}
                    className="text-[10px] text-violet-400 hover:text-violet-300 px-2 py-1 rounded border border-violet-500/30 hover:border-violet-400/50 transition-colors"
                  >
                    All
                  </button>
                  <button
                    onClick={handleClearSelection}
                    className="text-[10px] text-white/40 hover:text-white/60 px-2 py-1 rounded border border-white/10 hover:border-white/20 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {selectedPathIds.size > 0 && (
                <div className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/30 rounded-lg px-2 py-1.5">
                  Selected: {selectedPathIds.size} path{selectedPathIds.size !== 1 ? 's' : ''}
                </div>
              )}
              <div className="space-y-1.5">
                {paths.map((path, idx) => {
                  const isSelected = selectedPathIds.has(path.pathId);
                  return (
                    <motion.button
                      key={path.pathId}
                      onClick={() => handleTogglePath(path.pathId)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all text-[11px] ${
                        isSelected
                          ? 'bg-violet-600/20 border-violet-500/50'
                          : 'bg-white/[0.04] border-white/[0.06] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {isSelected ? (
                            <CheckSquare className="text-violet-400" size={14} />
                          ) : (
                            <Square className="text-white/30" size={14} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className="text-white/90 font-medium text-[11px]">
                              #{idx + 1} ({path.length} {path.length === 1 ? 'hop' : 'hops'})
                            </span>
                            <div className="flex items-center gap-1 group relative">
                              <span className="text-white/40 text-[10px]">
                                Exposure Index:
                              </span>
                              <span className="text-white/70 text-[10px]">
                                {path.exposureIndex.toFixed(1)}
                              </span>
                              <div className="relative">
                                <Info 
                                  size={11} 
                                  className="text-white/30 hover:text-white/50 cursor-help transition-colors" 
                                />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 w-56 p-2 bg-black/95 border border-white/20 rounded-lg text-[10px] text-white/80 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                  Relative measure of financial or structural exposure along this path. Not a percentage or probability.
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-white/60 text-[10px] mb-1 truncate">
                            {formatPathSequence(path)}
                          </div>
                          <div className="text-white/40 text-[10px] italic">
                            {path.summary}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {pathError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-red-400/90 text-[11px] bg-red-500/10 rounded-lg px-3 py-2"
            >
              <AlertCircle size={12} />
              <span>{pathError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleFindPaths}
            disabled={!fromSelected || !toSelected || isLoading}
            className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 disabled:opacity-30 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Route size={14} />}
            {isLoading ? 'Finding...' : 'Find Paths'}
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white/80 rounded-xl text-[13px] transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </motion.div>
  );
}
