'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  Newspaper,
  Building2,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { AffectedCompany, NewsAnalysis } from '@/services/aiService';

interface NewsImpactPopupProps {
  analysis: NewsAnalysis;
  onClose: () => void;
}

const IMPACT_COLORS = {
  positive: {
    bg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/10',
    border: 'border-green-500/40',
    text: 'text-green-300',
    icon: 'text-green-400',
    badge: 'bg-green-500/30 text-green-400 border-green-500/50',
    glow: 'shadow-green-500/20'
  },
  negative: {
    bg: 'bg-gradient-to-br from-red-500/20 to-rose-500/10',
    border: 'border-red-500/40',
    text: 'text-red-300',
    icon: 'text-red-400',
    badge: 'bg-red-500/30 text-red-400 border-red-500/50',
    glow: 'shadow-red-500/20'
  },
  neutral: {
    bg: 'bg-gradient-to-br from-slate-500/20 to-slate-600/10',
    border: 'border-slate-500/40',
    text: 'text-slate-300',
    icon: 'text-slate-400',
    badge: 'bg-slate-500/30 text-slate-400 border-slate-500/50',
    glow: 'shadow-slate-500/20'
  },
  uncertain: {
    bg: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/10',
    border: 'border-yellow-500/40',
    text: 'text-yellow-300',
    icon: 'text-yellow-400',
    badge: 'bg-yellow-500/30 text-yellow-400 border-yellow-500/50',
    glow: 'shadow-yellow-500/20'
  }
};

const IMPACT_ICONS = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
  uncertain: AlertCircle
};

const NEWS_TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  merger: { label: 'Merger & Acquisition', icon: Building2, color: 'from-violet-500 to-purple-500' },
  partnership: { label: 'Partnership', icon: Sparkles, color: 'from-blue-500 to-cyan-500' },
  regulation: { label: 'Regulation', icon: BarChart3, color: 'from-orange-500 to-amber-500' },
  financial: { label: 'Financial News', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
  technology: { label: 'Technology', icon: Sparkles, color: 'from-indigo-500 to-purple-500' },
  market: { label: 'Market News', icon: BarChart3, color: 'from-cyan-500 to-blue-500' },
  other: { label: 'General News', icon: Newspaper, color: 'from-slate-500 to-gray-500' }
};

export default function NewsImpactPopup({ analysis, onClose }: NewsImpactPopupProps) {
  const { affectedCompanies, summary, newsType } = analysis;
  const newsTypeConfig = NEWS_TYPE_LABELS[newsType] || NEWS_TYPE_LABELS.other;
  const NewsTypeIcon = newsTypeConfig.icon;

  // Sort companies by impact type (negative first, then positive, then others)
  const sortedCompanies = [...affectedCompanies].sort((a, b) => {
    const order = { negative: 0, positive: 1, uncertain: 2, neutral: 3 };
    return (order[a.impactType] || 3) - (order[b.impactType] || 3);
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md pointer-events-auto"
        />

        {/* Popup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[92vh] bg-gradient-to-br from-slate-900/95 via-slate-900/95 to-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
        >
          {/* Header */}
          <div className={`relative px-8 py-6 border-b border-white/10 bg-gradient-to-r ${newsTypeConfig.color}/20 via-transparent to-transparent`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.1),transparent_70%)]" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className={`p-3 bg-gradient-to-br ${newsTypeConfig.color}/30 rounded-2xl border border-white/10 shadow-lg backdrop-blur-sm`}
                >
                  <NewsTypeIcon className={`text-white`} size={26} />
                </motion.div>
                <div>
                  <h2 className="font-bold text-white text-2xl mb-1">News Impact Analysis</h2>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${newsTypeConfig.color}/30 border border-white/10 text-xs font-medium text-white/90`}>
                      {newsTypeConfig.label}
                    </div>
                    <div className="text-xs text-slate-400">
                      {affectedCompanies.length} compan{affectedCompanies.length === 1 ? 'y' : 'ies'} affected
                    </div>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2.5 bg-black/30 hover:bg-black/50 rounded-xl text-slate-400 hover:text-white transition-all backdrop-blur-sm border border-white/10 hover:border-white/20"
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {/* Summary Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Newspaper className="text-violet-400" size={18} />
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Summary</h3>
                </div>
                <p className="text-slate-200 leading-relaxed text-base">{summary}</p>
              </div>
            </motion.div>

            {/* Companies Section */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-5"
              >
                <Building2 className="text-violet-400" size={20} />
                <h3 className="text-lg font-bold text-white">
                  Affected Companies
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                <div className="px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full text-xs font-medium text-violet-300">
                  {affectedCompanies.length}
                </div>
              </motion.div>

              {sortedCompanies.length > 0 ? (
                <div className="grid gap-4">
                  {sortedCompanies.map((company, idx) => {
                    const ImpactIcon = IMPACT_ICONS[company.impactType];
                    const colors = IMPACT_COLORS[company.impactType];
                    
                    return (
                      <motion.div
                        key={company.companyId}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.05, type: "spring" }}
                        className={`relative ${colors.bg} ${colors.border} border-2 rounded-2xl p-5 backdrop-blur-sm ${colors.glow} shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}
                      >
                        {/* Decorative gradient */}
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl ${
                          company.impactType === 'positive' ? 'bg-green-500/20' :
                          company.impactType === 'negative' ? 'bg-red-500/20' :
                          company.impactType === 'uncertain' ? 'bg-yellow-500/20' :
                          'bg-slate-500/20'
                        }`} />
                        
                        <div className="relative flex items-start justify-between gap-6">
                          {/* Left: Company Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className={`p-2 ${colors.bg} rounded-xl border ${colors.border}`}>
                                <ImpactIcon className={colors.icon} size={20} />
                              </div>
                              <h4 className="font-bold text-white text-lg">{company.companyName}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors.badge}`}>
                                {company.impactType.toUpperCase()}
                              </span>
                            </div>
                            
                            <p className={`${colors.text} text-sm leading-relaxed`}>
                              {company.impactDescription}
                            </p>
                          </div>

                          {/* Right: Confidence Meter */}
                          <div className="flex flex-col items-end gap-2 min-w-[120px]">
                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Confidence</div>
                            <div className="relative w-24 h-24">
                              {/* SVG Circular Progress */}
                              <svg className="transform -rotate-90 w-24 h-24" viewBox="0 0 36 36">
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="16"
                                  fill="none"
                                  stroke="rgba(255,255,255,0.1)"
                                  strokeWidth="3"
                                />
                                <motion.circle
                                  cx="18"
                                  cy="18"
                                  r="16"
                                  fill="none"
                                  stroke={company.impactType === 'positive' ? '#22c55e' : 
                                          company.impactType === 'negative' ? '#ef4444' :
                                          company.impactType === 'uncertain' ? '#facc15' : '#6b7280'}
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeDasharray={`${company.confidence * 100}, 100`}
                                  initial={{ strokeDasharray: "0, 100" }}
                                  animate={{ strokeDasharray: `${company.confidence * 100}, 100` }}
                                  transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-lg font-bold ${colors.text}`}>
                                  {Math.round(company.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 bg-slate-800/30 border border-white/10 rounded-2xl"
                >
                  <AlertCircle size={48} className="mx-auto mb-4 text-slate-500" />
                  <p className="text-slate-400 text-lg">No companies from the graph were identified in this news.</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/30 backdrop-blur-sm">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 hover:from-violet-500 hover:via-purple-500 hover:to-violet-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-violet-900/40 hover:shadow-violet-500/60 text-base"
            >
              Close Analysis
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
