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
        className="fixed right-6 top-6 bottom-6 w-[360px] bg-black/40 backdrop-blur-3xl border border-white/[0.06] rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.5)] z-40 overflow-hidden flex flex-col"
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 z-50 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] rounded-full text-white/50 hover:text-white transition-all"
        >
          <X size={16} />
        </button>

        {/* Subtle top accent */}
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 opacity-60" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6 pr-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center mb-4">
              <Building2 size={22} className="text-violet-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">{node.label}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-white/50 uppercase tracking-wider bg-white/[0.04] px-2 py-1 rounded-lg">{node.type}</span>
              {node.ticker && <span className="text-[11px] text-violet-400/80 bg-violet-500/10 px-2 py-1 rounded-lg">{node.ticker}</span>}
            </div>
          </div>

          <p className="text-white/50 text-[13px] leading-relaxed mb-6">
            {node.description || "No description available for this entity."}
          </p>

          {/* Financials */}
          {hasFinancials && (
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between bg-white/[0.03] rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <DollarSign size={16} className="text-white/40" />
                  </div>
                  <span className="text-[13px] text-white/50">Price</span>
                </div>
                <span className="text-[15px] font-medium text-white">${node.data.price}</span>
              </div>
              
              <div className="flex items-center justify-between bg-white/[0.03] rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <TrendingUp size={16} className="text-white/40" />
                  </div>
                  <span className="text-[13px] text-white/50">Change</span>
                </div>
                <span className={`text-[15px] font-medium ${node.data.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {node.data.change >= 0 ? '+' : ''}{node.data.change}%
                </span>
              </div>
              
              <div className="flex items-center justify-between bg-white/[0.03] rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <Activity size={16} className="text-white/40" />
                  </div>
                  <span className="text-[13px] text-white/50">Volume</span>
                </div>
                <span className="text-[15px] font-medium text-white">{(node.data.volume / 1000000).toFixed(1)}M</span>
              </div>
              
              {node.data.tvl && (
                <div className="flex items-center justify-between bg-white/[0.03] rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
                      <Globe size={16} className="text-white/40" />
                    </div>
                    <span className="text-[13px] text-white/50">Market Cap</span>
                  </div>
                  <span className="text-[15px] font-medium text-white">{(node.data.tvl / 1000000000).toFixed(1)}B</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white rounded-2xl text-[13px] font-medium transition-all">
              Trade {node.ticker || node.label}
            </button>
            <button className="w-full py-3 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white rounded-2xl text-[13px] font-medium transition-all">
              View Analysis
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
