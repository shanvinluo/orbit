'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  Newspaper,
  Building2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { NewsAnalysis } from '@/services/aiService';

interface NewsImpactPopupProps {
  analysis: NewsAnalysis;
  onClose: () => void;
}

const IMPACT_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  positive: { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#86efac' },
  negative: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#fca5a5' },
  neutral: { bg: 'rgba(100, 116, 139, 0.15)', border: '#64748b', text: '#cbd5e1' },
  mixed: { bg: 'rgba(250, 204, 21, 0.15)', border: '#facc15', text: '#fef08a' }
};

const IMPACT_ICONS: Record<string, any> = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
  mixed: AlertCircle
};

export default function NewsImpactPopup({ analysis, onClose }: NewsImpactPopupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const prevAnalysisRef = useRef<string>('');
  
  const { affectedCompanies, summary, newsType } = analysis;

  // Detect when analysis changes
  useEffect(() => {
    const currentAnalysisKey = JSON.stringify(analysis);
    if (prevAnalysisRef.current && prevAnalysisRef.current !== currentAnalysisKey) {
      // New analysis received
      setHasNewUpdate(true);
      setIsCollapsed(false); // Auto-expand on new update
    }
    prevAnalysisRef.current = currentAnalysisKey;
    setIsFirstRender(false);
  }, [analysis]);

  const handleSheetClick = () => {
    if (hasNewUpdate) {
      setHasNewUpdate(false);
    }
  };

  const sortedCompanies = [...affectedCompanies].sort((a, b) => {
    const order: Record<string, number> = { negative: 0, positive: 1, mixed: 2, neutral: 3 };
    return (order[a.impactType] || 3) - (order[b.impactType] || 3);
  });

  return (
    <AnimatePresence>
      {/* Bottom Sheet - Persistent with animations */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={handleSheetClick}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          marginLeft: 'auto',
          marginRight: 'auto',
          width: '100%',
          maxWidth: '900px',
          maxHeight: isCollapsed ? 'auto' : '70vh',
          backgroundColor: '#0f172a',
          borderTop: hasNewUpdate ? '3px solid #fca5a5' : '3px solid #8b5cf6',
          borderRadius: '24px 24px 0 0',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: hasNewUpdate 
            ? '0 -10px 60px rgba(252, 165, 165, 0.3), 0 0 30px rgba(252, 165, 165, 0.15)' 
            : '0 -10px 40px rgba(0,0,0,0.5)'
        }}
      >

        {/* Pulsing border effect for new updates */}
        {hasNewUpdate && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '24px 24px 0 0',
              border: '2px solid #fca5a5',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Drag Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <motion.div 
            style={{ width: 48, height: 6, backgroundColor: hasNewUpdate ? '#fca5a5' : '#475569', borderRadius: 3 }}
            animate={hasNewUpdate ? { scaleX: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        </div>

        {/* Header */}
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: hasNewUpdate 
            ? 'linear-gradient(to right, rgba(252, 165, 165, 0.15), transparent)'
            : 'linear-gradient(to right, rgba(139, 92, 246, 0.2), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.div 
                style={{ 
                  padding: 10, 
                  backgroundColor: hasNewUpdate ? 'rgba(252, 165, 165, 0.25)' : 'rgba(139, 92, 246, 0.3)', 
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                animate={hasNewUpdate ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Newspaper color="white" size={20} />
              </motion.div>
              <div>
                <h2 style={{ color: 'white', fontSize: 18, fontWeight: 'bold', margin: 0 }}>
                  News Impact Analysis
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    backgroundColor: hasNewUpdate ? 'rgba(252, 165, 165, 0.25)' : 'rgba(139, 92, 246, 0.3)',
                    borderRadius: 20,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {newsType}
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    {affectedCompanies.length} companies affected
                  </span>
                </div>
              </div>
            </div>
            <motion.button 
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
                if (hasNewUpdate) setHasNewUpdate(false);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{ 
                padding: 8, 
                backgroundColor: 'rgba(0,0,0,0.3)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
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
                <ChevronUp color="#94a3b8" size={18} />
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
              style={{ overflow: 'hidden' }}
            >
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                maxHeight: '50vh'
              }}>
                {/* Summary */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ 
                    padding: 20, 
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Newspaper color="#a78bfa" size={16} />
                    <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                      Summary
                    </span>
                  </div>
                  <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    {summary}
                  </p>
                </motion.div>

                {/* Companies */}
                <div>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}
                  >
                    <Building2 color="#a78bfa" size={18} />
                    <span style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                      Affected Companies
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)' }} />
                    <span style={{ 
                      padding: '4px 12px',
                      backgroundColor: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: 20,
                      fontSize: 12,
                      color: '#c4b5fd'
                    }}>
                      {affectedCompanies.length}
                    </span>
                  </motion.div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {sortedCompanies.map((company, idx) => {
                      const styles = IMPACT_STYLES[company.impactType] || IMPACT_STYLES.neutral;
                      const ImpactIcon = IMPACT_ICONS[company.impactType] || Minus;
                      
                      return (
                        <motion.div 
                          key={company.companyId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          style={{ 
                            padding: 16,
                            backgroundColor: styles.bg,
                            border: `2px solid ${styles.border}40`,
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 16
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <div style={{ 
                                padding: 6, 
                                backgroundColor: styles.bg, 
                                borderRadius: 8,
                                border: `1px solid ${styles.border}40`
                              }}>
                                <ImpactIcon color={styles.text} size={16} />
                              </div>
                              <span style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>
                                {company.companyName}
                              </span>
                              <span style={{ 
                                padding: '2px 10px',
                                backgroundColor: styles.bg,
                                border: `1px solid ${styles.border}60`,
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 600,
                                color: styles.text,
                                textTransform: 'uppercase'
                              }}>
                                {company.impactType}
                              </span>
                            </div>
                            <p style={{ color: styles.text, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                              {company.impactDescription}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: 80 }}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
                              Confidence
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 'bold', color: styles.text }}>
                              {Math.round(company.confidence * 100)}%
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
