'use client';

import React, { useState } from 'react';
import { Filter, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EdgeType, EDGE_COLORS, EDGE_LABELS } from '@/types';

interface RelationshipFilterProps {
  enabledTypes: Set<EdgeType>;
  onToggle: (type: EdgeType) => void;
  onToggleAll: () => void;
}

export default function RelationshipFilter({ enabledTypes, onToggle, onToggleAll }: RelationshipFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const allTypes = Object.values(EdgeType);
  const allEnabled = allTypes.every(type => enabledTypes.has(type));
  const noneEnabled = allTypes.every(type => !enabledTypes.has(type));

  return (
    <div className="absolute top-24 left-8 z-40">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl px-5 py-3 shadow-lg hover:border-white/20 transition-all flex items-center gap-3 group"
        >
          <Filter className="text-violet-400" size={18} />
          <span className="text-white font-medium text-sm">Relationships</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">
              {enabledTypes.size}/{allTypes.length}
            </span>
            {isOpen ? (
              <ChevronUp className="text-slate-400 group-hover:text-white transition-colors" size={16} />
            ) : (
              <ChevronDown className="text-slate-400 group-hover:text-white transition-colors" size={16} />
            )}
          </div>
        </button>

        {/* Filter Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute top-full left-0 mt-2 w-[340px] bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-violet-900/20 to-transparent">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">Filter Relationships</h3>
                  <button
                    onClick={onToggleAll}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
                  >
                    {allEnabled ? 'Hide All' : 'Show All'}
                  </button>
                </div>
                <div className="text-xs text-slate-400">
                  {enabledTypes.size} of {allTypes.length} relationship types visible
                </div>
              </div>

              {/* Relationship Types List */}
              <div className="max-h-96 overflow-y-auto">
                {allTypes.map((type) => {
                  const isEnabled = enabledTypes.has(type);
                  const color = EDGE_COLORS[type];
                  const label = EDGE_LABELS[type];

                  return (
                    <button
                      key={type}
                      onClick={() => onToggle(type)}
                      className="w-full px-5 py-3.5 border-b border-white/5 last:border-none flex items-center gap-3 hover:bg-white/5 transition-colors group"
                    >
                      {/* Color Indicator */}
                      <div className="relative">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white/20"
                          style={{ backgroundColor: isEnabled ? color : 'transparent' }}
                        >
                          {isEnabled && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute inset-0 rounded-full"
                              style={{ backgroundColor: color, opacity: 0.8 }}
                            />
                          )}
                        </div>
                        {!isEnabled && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-0.5 bg-slate-600 rotate-45" />
                          </div>
                        )}
                      </div>

                      {/* Label */}
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">
                          {label}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{type}</div>
                      </div>

                      {/* Toggle Icon */}
                      {isEnabled ? (
                        <Eye className="text-violet-400" size={16} />
                      ) : (
                        <EyeOff className="text-slate-600" size={16} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-slate-800/50 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Click to toggle visibility</span>
                  <span className="text-violet-400 font-medium">
                    {enabledTypes.size} active
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
