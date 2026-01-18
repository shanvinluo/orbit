'use client';

import React, { useState } from 'react';
import { 
  X, 
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
  const { affectedCompanies, summary, newsType } = analysis;

  const sortedCompanies = [...affectedCompanies].sort((a, b) => {
    const order: Record<string, number> = { negative: 0, positive: 1, mixed: 2, neutral: 3 };
    return (order[a.impactType] || 3) - (order[b.impactType] || 3);
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998
        }}
      />

      {/* Bottom Sheet */}
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '900px',
          maxHeight: isCollapsed ? 'auto' : '70vh',
          backgroundColor: '#0f172a',
          borderTop: '3px solid #8b5cf6',
          borderRadius: '24px 24px 0 0',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
        }}
      >
        {/* Drag Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 48, height: 6, backgroundColor: '#475569', borderRadius: 3 }} />
        </div>

        {/* Header */}
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(to right, rgba(139, 92, 246, 0.2), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                padding: 10, 
                backgroundColor: 'rgba(139, 92, 246, 0.3)', 
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <Newspaper color="white" size={20} />
              </div>
              <div>
                <h2 style={{ color: 'white', fontSize: 18, fontWeight: 'bold', margin: 0 }}>
                  News Impact Analysis
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    backgroundColor: 'rgba(139, 92, 246, 0.3)',
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
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
                {isCollapsed ? <ChevronUp color="#94a3b8" size={18} /> : <ChevronDown color="#94a3b8" size={18} />}
              </button>
              <button 
                onClick={onClose}
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
                <X color="#94a3b8" size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}>
            {/* Summary */}
            <div style={{ 
              padding: 20, 
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Newspaper color="#a78bfa" size={16} />
                <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Summary
                </span>
              </div>
              <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                {summary}
              </p>
            </div>

            {/* Companies */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
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
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sortedCompanies.map((company) => {
                  const styles = IMPACT_STYLES[company.impactType] || IMPACT_STYLES.neutral;
                  const ImpactIcon = IMPACT_ICONS[company.impactType] || Minus;
                  
                  return (
                    <div 
                      key={company.companyId}
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!isCollapsed && (
          <div style={{ 
            padding: '16px 24px', 
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(to right, rgba(15, 23, 42, 0.5), rgba(30, 41, 59, 0.3))'
          }}>
            <button 
              onClick={onClose}
              style={{ 
                width: '100%',
                padding: '12px 24px',
                background: 'linear-gradient(to right, #7c3aed, #9333ea, #7c3aed)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
              }}
            >
              Close Analysis
            </button>
          </div>
        )}
      </div>
    </>
  );
}
