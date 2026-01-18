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
  bullish: { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#86efac' },
  bearish: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#fca5a5' },
  neutral: { bg: 'rgba(100, 116, 139, 0.15)', border: '#64748b', text: '#cbd5e1' },
  mixed: { bg: 'rgba(250, 204, 21, 0.15)', border: '#facc15', text: '#fef08a' }
};

const IMPACT_ICONS: Record<string, any> = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
  mixed: AlertCircle
};

export default function NewsImpactPopup({ analysis, onClose }: NewsImpactPopupProps) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Start minimized
  const [hasNewUpdate, setHasNewUpdate] = useState(true);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const prevAnalysisRef = useRef<string>('');
  
  const { affectedCompanies, summary, newsType } = analysis;

  // Detect when analysis changes - trigger shine but stay minimized
  useEffect(() => {
    const currentAnalysisKey = JSON.stringify(analysis);
    if (prevAnalysisRef.current !== currentAnalysisKey) {
      // New analysis received - trigger shine alert
      setHasNewUpdate(true);
      setPulseIntensity(1);
      // Keep minimized - don't auto-expand
    }
    prevAnalysisRef.current = currentAnalysisKey;
  }, [analysis]);
  
  // Gradually reduce pulse intensity over time if not interacted with
  useEffect(() => {
    if (!hasNewUpdate) return;
    
    const interval = setInterval(() => {
      setPulseIntensity(prev => Math.max(0.3, prev - 0.1));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [hasNewUpdate]);

  const dismissAlert = () => {
    setHasNewUpdate(false);
    setPulseIntensity(0);
  };

  const handleSheetClick = () => {
    dismissAlert();
  };

  const sortedCompanies = [...affectedCompanies].sort((a, b) => {
    const order: Record<string, number> = { bearish: 0, bullish: 1, mixed: 2, neutral: 3 };
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
          borderTop: hasNewUpdate ? '3px solid #ef4444' : '3px solid #8b5cf6',
          borderRadius: '24px 24px 0 0',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: hasNewUpdate 
            ? `0 -10px 60px rgba(239, 68, 68, ${0.4 * pulseIntensity}), 0 0 40px rgba(239, 68, 68, ${0.25 * pulseIntensity}), 0 0 80px rgba(239, 68, 68, ${0.15 * pulseIntensity})` 
            : '0 -10px 40px rgba(0,0,0,0.5)'
        }}
      >

        {/* Glowing shine effect for new updates */}
        {hasNewUpdate && (
          <>
            {/* Outer glow ring */}
            <motion.div
              animate={{ 
                opacity: [0.3 * pulseIntensity, 0.8 * pulseIntensity, 0.3 * pulseIntensity],
                scale: [1, 1.02, 1]
              }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: -4,
                borderRadius: '28px 28px 0 0',
                background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.4) 0%, transparent 50%)',
                pointerEvents: 'none',
                filter: 'blur(8px)'
              }}
            />
            {/* Inner border pulse */}
            <motion.div
              animate={{ 
                opacity: [0.4, 1, 0.4],
                boxShadow: [
                  'inset 0 2px 20px rgba(239, 68, 68, 0.3)',
                  'inset 0 2px 40px rgba(239, 68, 68, 0.6)',
                  'inset 0 2px 20px rgba(239, 68, 68, 0.3)'
                ]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '24px 24px 0 0',
                border: '2px solid #ef4444',
                pointerEvents: 'none'
              }}
            />
          </>
        )}

        {/* Drag Handle */}
        <div onClick={dismissAlert} style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px', cursor: 'pointer' }}>
          <motion.div 
            style={{ 
              width: 48, 
              height: 6, 
              backgroundColor: hasNewUpdate ? '#ef4444' : '#475569', 
              borderRadius: 3,
              boxShadow: hasNewUpdate ? '0 0 12px rgba(239, 68, 68, 0.6)' : 'none'
            }}
            animate={hasNewUpdate ? { 
              scaleX: [1, 1.3, 1],
              opacity: [0.8, 1, 0.8]
            } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        </div>

        {/* Header */}
        <div 
          onClick={dismissAlert}
          style={{ 
            padding: '16px 24px', 
            borderBottom: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.1)',
            background: hasNewUpdate 
              ? 'linear-gradient(to right, rgba(239, 68, 68, 0.15), transparent)'
              : 'linear-gradient(to right, rgba(139, 92, 246, 0.2), transparent)',
            cursor: 'pointer'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.div 
                style={{ 
                  padding: 10, 
                  backgroundColor: hasNewUpdate ? 'rgba(239, 68, 68, 0.25)' : 'rgba(139, 92, 246, 0.3)', 
                  borderRadius: 12,
                  border: hasNewUpdate ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: hasNewUpdate ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none'
                }}
                animate={hasNewUpdate ? { 
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    '0 0 20px rgba(239, 68, 68, 0.4)',
                    '0 0 35px rgba(239, 68, 68, 0.7)',
                    '0 0 20px rgba(239, 68, 68, 0.4)'
                  ]
                } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Newspaper color={hasNewUpdate ? '#fca5a5' : 'white'} size={20} />
              </motion.div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ color: 'white', fontSize: 18, fontWeight: 'bold', margin: 0 }}>
                    News Impact
                  </h2>
                  {hasNewUpdate && (
                    <motion.span
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      style={{
                        padding: '2px 8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.3)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#fca5a5',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      New
                    </motion.span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    backgroundColor: hasNewUpdate ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.3)',
                    borderRadius: 20,
                    fontSize: 12,
                    color: hasNewUpdate ? '#fca5a5' : 'rgba(255,255,255,0.9)',
                    border: hasNewUpdate ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {newsType}
                  </span>
                  <motion.span 
                    style={{ fontSize: 12, color: hasNewUpdate ? '#fca5a5' : '#94a3b8' }}
                    animate={hasNewUpdate ? { opacity: [0.7, 1, 0.7] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {affectedCompanies.length} companies affected
                  </motion.span>
                </div>
              </div>
            </div>
            <motion.button 
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
                dismissAlert();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{ 
                padding: 8, 
                backgroundColor: hasNewUpdate ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,0,0,0.3)', 
                border: hasNewUpdate ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.1)',
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
                <ChevronUp color={hasNewUpdate ? '#fca5a5' : '#94a3b8'} size={18} />
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
