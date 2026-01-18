'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphNode, NodeType } from '@/types';
import { X, TrendingUp, DollarSign, Activity, Globe, Building2 } from 'lucide-react';

interface TradingCardProps {
  node: GraphNode;
  onClose: () => void;
}

export default function TradingCard({ node, onClose }: TradingCardProps) {
  // Determine if we have financial data
  const hasFinancials = node.data && (node.data.price || node.data.volume);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-6 top-6 bottom-6 w-[400px] bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl z-40 overflow-hidden flex flex-col relative"
      >
            <button 
                onClick={onClose}
                style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 50 }}
                className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-md"
            >
                <X size={18} />
            </button>

        {/* Header Image/Gradient */}
        <div className="h-32 bg-gradient-to-br from-violet-900/50 to-indigo-900/50 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.2),transparent_70%)]" />
        </div>

        {/* Content */}
        <div className="mt-10 px-8 pb-8 flex-1 overflow-y-auto pt-4">
            <div className="mb-6 pr-8">
                <h2 className="text-2xl font-bold text-white mb-1">{node.label}</h2>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-xs uppercase tracking-wide">{node.type}</span>
                    {node.ticker && <span>• {node.ticker}</span>}
                    {node.industry && <span>• {node.industry}</span>}
                </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-8">
                {node.description || "No description available for this entity."}
            </p>

            {/* Financials / Metrics */}
            {hasFinancials && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><DollarSign size={12}/> Price</div>
                        <div className="text-lg font-semibold text-white">${node.data.price}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><TrendingUp size={12}/> Change</div>
                        <div className={`text-lg font-semibold ${node.data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {node.data.change}%
                        </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Activity size={12}/> Volume</div>
                        <div className="text-lg font-semibold text-white">{(node.data.volume / 1000000).toFixed(1)}M</div>
                    </div>
                     <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Globe size={12}/> Market Cap</div>
                        <div className="text-lg font-semibold text-white">{(node.data.tvl / 1000000000).toFixed(1)}B</div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
                <button className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-violet-900/20">
                    Trade {node.ticker}
                </button>
                <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-medium transition-colors">
                    View Full Analysis
                </button>
            </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
