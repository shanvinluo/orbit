'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphEdge, EdgeType, EDGE_LABELS, GraphNode } from '@/types';
import { X, FileText, PieChart as PieChartIcon, Calendar, DollarSign, Percent, TrendingUp, Newspaper, AlertTriangle, Package, Handshake, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RelationshipCardProps {
  edge: GraphEdge;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  allRelationships?: Array<{ edge: GraphEdge; source: GraphNode; target: GraphNode }>;
  onRelationshipChange?: (edge: GraphEdge, source: GraphNode, target: GraphNode) => void;
  onClose: () => void;
}

interface RelationshipData {
  description: string;
  pieChartData?: Array<{ name: string; value: number; color: string }>;
  secFilings?: Array<{ date: string; type: string; title: string; link?: string }>;
  financialData?: Array<{ label: string; value: string; icon?: React.ReactNode }>;
  supplyChainInfo?: {
    tiers?: Array<{ tier: string; suppliers: string[] }>;
    locations?: string[];
    riskLevel?: 'Low' | 'Medium' | 'High';
    riskFactors?: string[];
  };
  partnershipInfo?: {
    projects?: Array<{ name: string; status: string; value: string }>;
    milestones?: Array<{ date: string; event: string }>;
    collaboration?: string[];
  };
  news?: Array<{ date: string; title: string; source: string; summary: string; link?: string }>;
}

// Generate relationship data based on type
function getRelationshipData(type: EdgeType, sourceNode: GraphNode, targetNode: GraphNode, edgeData?: any): RelationshipData {
  const base = {
    description: `${sourceNode.label} ${EDGE_LABELS[type].toLowerCase()} ${targetNode.label}`,
  };

  switch (type) {
    case EdgeType.Ownership:
      return {
        ...base,
        description: `Investment ownership: ${sourceNode.label} holds ${edgeData?.percentage || '15.2'}% equity stake in ${targetNode.label} through institutional investment`,
        pieChartData: [
          { name: sourceNode.label, value: edgeData?.percentage || 15.2, color: '#8b5cf6' },
          { name: 'Public Float', value: 45.8, color: '#3b82f6' },
          { name: 'Institutional', value: 32.5, color: '#06b6d4' },
          { name: 'Other', value: 6.5, color: '#64748b' },
        ],
        secFilings: [
          { date: '2024-12-15', type: '13D', title: 'Statement of Beneficial Ownership', link: 'https://www.sec.gov' },
          { date: '2024-11-20', type: '13G', title: 'Schedule 13G Filing', link: 'https://www.sec.gov' },
          { date: '2024-09-05', type: '4', title: 'Statement of Changes in Beneficial Ownership', link: 'https://www.sec.gov' },
          { date: '2024-06-12', type: '13D/A', title: 'Amendment to Beneficial Ownership Statement', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Ownership %', value: `${edgeData?.percentage || 15.2}%`, icon: <Percent size={16} /> },
          { label: 'Market Value', value: '$2.4B', icon: <DollarSign size={16} /> },
          { label: 'Voting Power', value: '15.2%', icon: <TrendingUp size={16} /> },
        ],
      };

    case EdgeType.Partnership:
      return {
        ...base,
        description: `Strategic partnership between ${sourceNode.label} and ${targetNode.label} covering joint R&D and market expansion`,
        pieChartData: [
          { name: sourceNode.label, value: 45, color: '#3b82f6' },
          { name: targetNode.label, value: 35, color: '#06b6d4' },
          { name: 'Joint Investment', value: 20, color: '#10b981' },
        ],
        secFilings: [
          { date: '2024-12-01', type: '8-K', title: 'Strategic Partnership Announcement', link: 'https://www.sec.gov' },
          { date: '2024-11-15', type: '10-Q', title: 'Q3 Partnership Revenue: $120M', link: 'https://www.sec.gov' },
          { date: '2024-08-22', type: '8-K', title: 'Partnership Agreement Amendment', link: 'https://www.sec.gov' },
          { date: '2024-05-10', type: '10-Q', title: 'Q2 Joint Venture Performance Report', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Joint Revenue', value: '$120M', icon: <DollarSign size={16} /> },
          { label: 'Equity Split', value: '45/35%', icon: <Percent size={16} /> },
          { label: 'Duration', value: '5 Years', icon: <Calendar size={16} /> },
        ],
        partnershipInfo: {
          projects: [
            { name: 'Cloud Infrastructure Initiative', status: 'Active', value: '$85M' },
            { name: 'AI Research Collaboration', status: 'Active', value: '$45M' },
            { name: 'Market Expansion Program', status: 'Planning', value: '$35M' },
            { name: 'Sustainable Technology Lab', status: 'Active', value: '$28M' },
          ],
          milestones: [
            { date: '2024-12-15', event: 'Partnership extended through 2029' },
            { date: '2024-09-20', event: 'Reached $500M cumulative joint revenue milestone' },
            { date: '2024-06-10', event: 'Launched joint AI research center' },
            { date: '2024-03-05', event: 'Expanded partnership to 12 new markets' },
            { date: '2023-11-18', event: 'Initial partnership agreement signed' },
          ],
          collaboration: ['Joint R&D', 'Market Development', 'Technology Licensing', 'Supply Chain Integration', 'Customer Co-Marketing'],
        },
        news: [
          { date: '2024-12-18', title: `${sourceNode.label} and ${targetNode.label} Announce Partnership Extension Through 2029`, source: 'Tech Business Today', summary: 'Strategic partners commit to extended collaboration with increased investment in joint R&D initiatives totaling $150M', link: '#' },
          { date: '2024-11-28', title: 'Partnership Reaches $500M Revenue Milestone Ahead of Schedule', source: 'Financial Times', summary: 'Collaboration between tech giants exceeds revenue projections, demonstrating strong market traction', link: '#' },
          { date: '2024-10-12', title: 'Joint AI Research Center Opens in Silicon Valley', source: 'Innovation Weekly', summary: 'New collaborative research facility to house 200 engineers and scientists working on next-generation AI technologies', link: '#' },
          { date: '2024-08-30', title: `${sourceNode.label} and ${targetNode.label} Expand Partnership to 12 New Markets`, source: 'Global Business News', summary: 'Strategic alliance expands international presence with focus on emerging markets in Asia and Latin America', link: '#' },
          { date: '2024-07-15', title: 'Partnership Drives Innovation in Sustainable Technology Solutions', source: 'Environmental Tech Review', summary: 'Collaboration produces breakthrough in sustainable manufacturing processes, reducing carbon footprint by 35%', link: '#' },
          { date: '2024-05-22', title: 'Q2 Partnership Performance Exceeds Analyst Expectations', source: 'Market Watch Daily', summary: 'Strong quarterly results driven by successful product launches and effective market penetration strategies', link: '#' },
          { date: '2024-04-05', title: 'Industry Leaders Collaborate on Industry 4.0 Standards', source: 'Manufacturing Today', summary: 'Joint effort to establish industry standards for smart manufacturing and digital transformation', link: '#' },
        ],
      };

    case EdgeType.Client:
      const clientServices = edgeData?.services || ['Enterprise Software Solutions', 'Cloud Infrastructure Services', 'Professional Consulting'];
      return {
        ...base,
        description: `${targetNode.label} is a major client of ${sourceNode.label}, representing ${edgeData?.revenuePercent || '12.3'}% of annual revenue. Services provided: ${clientServices.join(', ')}`,
        pieChartData: [
          { name: targetNode.label, value: edgeData?.revenuePercent || 12.3, color: '#10b981' },
          { name: 'Top 10 Clients', value: 35.7, color: '#06b6d4' },
          { name: 'Other Clients', value: 52.0, color: '#64748b' },
        ],
        secFilings: [
          { date: '2024-11-30', type: '10-K', title: 'Annual Report - Client Concentration Risk', link: 'https://www.sec.gov' },
          { date: '2024-09-10', type: '8-K', title: 'Major Client Contract Renewal', link: 'https://www.sec.gov' },
          { date: '2024-06-18', type: '10-Q', title: 'Q2 Client Revenue Breakdown', link: 'https://www.sec.gov' },
          { date: '2024-03-15', type: '10-K', title: 'Client Relationship Disclosure', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Annual Revenue', value: '$450M', icon: <DollarSign size={16} /> },
          { label: 'Contract Value', value: '$2.1B', icon: <DollarSign size={16} /> },
          { label: 'Contract Length', value: '3 Years', icon: <Calendar size={16} /> },
        ],
      };

    case EdgeType.Supplier:
      const supplierGoods = edgeData?.goods || ['Semiconductor Chips', 'Raw Materials', 'Manufacturing Components'];
      return {
        ...base,
        description: `${targetNode.label} supplies critical components to ${sourceNode.label}, representing ${edgeData?.costPercent || '8.5'}% of COGS. Goods supplied: ${supplierGoods.join(', ')}`,
        pieChartData: [
          { name: targetNode.label, value: edgeData?.costPercent || 8.5, color: '#f59e0b' },
          { name: 'Top 5 Suppliers', value: 28.3, color: '#fb923c' },
          { name: 'Other Suppliers', value: 63.2, color: '#64748b' },
        ],
        secFilings: [
          { date: '2024-12-05', type: '10-Q', title: 'Supply Chain Risk Assessment', link: 'https://www.sec.gov' },
          { date: '2024-10-22', type: '8-K', title: 'Long-term Supplier Agreement Signed', link: 'https://www.sec.gov' },
          { date: '2024-07-08', type: '10-Q', title: 'Supplier Dependency Disclosure', link: 'https://www.sec.gov' },
          { date: '2024-04-12', type: '10-K', title: 'Annual Supply Chain Report', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Annual Purchase', value: '$180M', icon: <DollarSign size={16} /> },
          { label: 'COGS %', value: '8.5%', icon: <Percent size={16} /> },
          { label: 'Agreement Term', value: '4 Years', icon: <Calendar size={16} /> },
        ],
        supplyChainInfo: {
          tiers: [
            { tier: 'Tier 1 (Direct)', suppliers: [targetNode.label, 'Advanced Materials Co.', 'Precision Components Ltd.'] },
            { tier: 'Tier 2 (Sub-suppliers)', suppliers: ['Global Raw Materials Inc.', 'Specialized Manufacturing Corp.'] },
            { tier: 'Tier 3 (Raw Materials)', suppliers: ['Mining Operations Group', 'Chemical Suppliers Network'] },
          ],
          locations: ['Taiwan', 'Singapore', 'South Korea', 'Mexico', 'United States'],
          riskLevel: 'Medium' as const,
          riskFactors: ['Geopolitical tensions in region', 'Single-source dependency for 15% of critical components', 'Currency fluctuation exposure'],
        },
        news: [
          { date: '2024-12-10', title: `${targetNode.label} Expands Manufacturing Capacity to Meet ${sourceNode.label} Demand`, source: 'Supply Chain Times', summary: 'Supplier announces $200M expansion to support growing demand from key client, expected to increase capacity by 40%', link: '#' },
          { date: '2024-11-22', title: `${sourceNode.label} and ${targetNode.label} Sign 5-Year Supply Agreement`, source: 'Tech Manufacturing News', summary: 'Long-term agreement secures supply chain stability with guaranteed pricing and volume commitments', link: '#' },
          { date: '2024-10-15', title: 'Supply Chain Diversification: What Companies Are Learning', source: 'Business Weekly', summary: 'Analysis of supply chain strategies including how major manufacturers manage critical supplier relationships', link: '#' },
          { date: '2024-09-08', title: `${targetNode.label} Reports Strong Q3 Performance Driven by ${sourceNode.label} Partnership`, source: 'Financial Markets Daily', summary: 'Supplier\'s quarterly earnings exceed expectations, attributed to strong relationship with major tech client', link: '#' },
          { date: '2024-08-20', title: 'ESG Standards in Supply Chain: New Requirements for Suppliers', source: 'Sustainable Business Review', summary: 'How supply chain partnerships are evolving to meet environmental and social governance requirements', link: '#' },
        ],
      };

    case EdgeType.Creditor:
      const loanTypes = edgeData?.loanTypes || ['Term Loan', 'Revolving Credit Facility', 'Interest Rate Swaps'];
      return {
        ...base,
        description: `${sourceNode.label} is a creditor to ${targetNode.label} with outstanding debt of ${edgeData?.amount || '$350M'}. Instruments: ${loanTypes.join(', ')}`,
        pieChartData: [
          { name: sourceNode.label, value: edgeData?.percentage || 18.5, color: '#ef4444' },
          { name: 'Bank Loans', value: 42.3, color: '#ec4899' },
          { name: 'Bonds', value: 28.7, color: '#f59e0b' },
          { name: 'Other Debt', value: 10.5, color: '#64748b' },
        ],
        secFilings: [
          { date: '2024-11-25', type: '8-K', title: 'Debt Restructuring Agreement', link: 'https://www.sec.gov' },
          { date: '2024-10-08', type: '10-Q', title: 'Q3 Debt Obligations Report', link: 'https://www.sec.gov' },
          { date: '2024-07-14', type: '8-K', title: 'Credit Facility Amendment', link: 'https://www.sec.gov' },
          { date: '2024-04-20', type: '10-K', title: 'Annual Debt Schedule', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Outstanding Debt', value: edgeData?.amount || '$350M', icon: <DollarSign size={16} /> },
          { label: 'Interest Rate', value: '4.25%', icon: <Percent size={16} /> },
          { label: 'Maturity', value: '2027-06-30', icon: <Calendar size={16} /> },
        ],
      };

    case EdgeType.Debtor:
      const debtTypes = edgeData?.debtTypes || ['Trade Credit', 'Currency Swaps', 'Short-term Notes'];
      return {
        ...base,
        description: `${sourceNode.label} owes ${edgeData?.amount || '$125M'} to ${targetNode.label}. Debt instruments: ${debtTypes.join(', ')}`,
        pieChartData: [
          { name: targetNode.label, value: edgeData?.percentage || 22.3, color: '#ec4899' },
          { name: 'Trade Credit', value: 35.8, color: '#ef4444' },
          { name: 'Other Payables', value: 41.9, color: '#64748b' },
        ],
        secFilings: [
          { date: '2024-12-10', type: '10-Q', title: 'Accounts Payable Aging Report', link: 'https://www.sec.gov' },
          { date: '2024-09-28', type: '8-K', title: 'Payment Schedule Amendment', link: 'https://www.sec.gov' },
          { date: '2024-06-25', type: '10-Q', title: 'Q2 Debt Obligations', link: 'https://www.sec.gov' },
          { date: '2024-03-18', type: '10-K', title: 'Annual Payables Disclosure', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Amount Owed', value: edgeData?.amount || '$125M', icon: <DollarSign size={16} /> },
          { label: 'Due Date', value: '2025-03-15', icon: <Calendar size={16} /> },
          { label: 'Payment Terms', value: 'Net 60', icon: <FileText size={16} /> },
        ],
      };

    case EdgeType.Licensing:
      return {
        ...base,
        description: `Licensing agreement where ${sourceNode.label} licenses ${edgeData?.technology || 'patents'} to ${targetNode.label}`,
        pieChartData: [
          { name: 'Royalty Revenue', value: edgeData?.percentage || 15.2, color: '#6366f1' },
          { name: 'Product Revenue', value: 62.8, color: '#3b82f6' },
          { name: 'Services', value: 22.0, color: '#06b6d4' },
        ],
        secFilings: [
          { date: '2024-11-18', type: '8-K', title: 'New Licensing Agreement Executed', link: 'https://www.sec.gov' },
          { date: '2024-09-05', type: '10-Q', title: 'Q3 Royalty Revenue: $45M', link: 'https://www.sec.gov' },
          { date: '2024-06-12', type: '8-K', title: 'License Agreement Amendment', link: 'https://www.sec.gov' },
          { date: '2024-03-22', type: '10-K', title: 'Annual Licensing Portfolio Report', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Annual Royalty', value: '$45M', icon: <DollarSign size={16} /> },
          { label: 'Royalty Rate', value: '3.5%', icon: <Percent size={16} /> },
          { label: 'Term', value: '7 Years', icon: <Calendar size={16} /> },
        ],
      };

    case EdgeType.JointVenture:
      return {
        ...base,
        description: `Joint venture between ${sourceNode.label} and ${targetNode.label} with ${edgeData?.equitySplit || '50/50'} equity split`,
        pieChartData: [
          { name: sourceNode.label, value: 50, color: '#06b6d4' },
          { name: targetNode.label, value: 50, color: '#14b8a6' },
        ],
        secFilings: [
          { date: '2024-11-12', type: '8-K', title: 'Joint Venture Agreement Execution', link: 'https://www.sec.gov' },
          { date: '2024-09-28', type: '10-Q', title: 'Joint Venture Financial Results', link: 'https://www.sec.gov' },
          { date: '2024-06-15', type: '8-K', title: 'Joint Venture Capital Contribution', link: 'https://www.sec.gov' },
          { date: '2024-03-10', type: '10-K', title: 'Annual Joint Venture Report', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Equity Split', value: edgeData?.equitySplit || '50/50%', icon: <Percent size={16} /> },
          { label: 'Joint Revenue', value: edgeData?.revenue || '$85M', icon: <DollarSign size={16} /> },
          { label: 'Duration', value: edgeData?.duration || '10 Years', icon: <Calendar size={16} /> },
        ],
      };

    case EdgeType.Swaps:
      const swapTypes = edgeData?.swapTypes || ['Interest Rate Swaps', 'Currency Swaps', 'Credit Default Swaps'];
      return {
        ...base,
        description: `Derivative swap agreements between ${sourceNode.label} and ${targetNode.label}. Swap types: ${swapTypes.join(', ')}`,
        pieChartData: [
          { name: 'Interest Rate Swaps', value: 45, color: '#14b8a6' },
          { name: 'Currency Swaps', value: 30, color: '#06b6d4' },
          { name: 'Credit Swaps', value: 25, color: '#0d9488' },
        ],
        secFilings: [
          { date: '2024-12-08', type: '10-Q', title: 'Q3 Derivative Holdings Report', link: 'https://www.sec.gov' },
          { date: '2024-09-22', type: '8-K', title: 'Swap Agreement Modification', link: 'https://www.sec.gov' },
          { date: '2024-06-30', type: '10-Q', title: 'Derivative Risk Disclosure', link: 'https://www.sec.gov' },
          { date: '2024-03-28', type: '10-K', title: 'Annual Derivatives Report', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Notional Value', value: edgeData?.notionalValue || '$450M', icon: <DollarSign size={16} /> },
          { label: 'Swap Rate', value: edgeData?.rate || 'LIBOR + 1.25%', icon: <Percent size={16} /> },
          { label: 'Maturity', value: edgeData?.maturity || '2026-12-31', icon: <Calendar size={16} /> },
        ],
      };

    case EdgeType.BoardInterlock:
      const memberName = edgeData?.memberName || 'John Smith';
      const committees = edgeData?.committees || ['Audit Committee', 'Compensation Committee', 'Nominating Committee'];
      return {
        ...base,
        description: `Board interlock: ${memberName} serves as director on both ${sourceNode.label} and ${targetNode.label} boards. Committees: ${committees.join(', ')}`,
        pieChartData: [
          { name: 'Independent Directors', value: 60, color: '#a855f7' },
          { name: 'Interlocked Directors', value: 25, color: '#8b5cf6' },
          { name: 'Executive Directors', value: 15, color: '#6366f1' },
        ],
        secFilings: [
          { date: '2024-12-02', type: 'DEF 14A', title: 'Proxy Statement - Board Composition', link: 'https://www.sec.gov' },
          { date: '2024-10-15', type: '8-K', title: 'Board Member Appointment', link: 'https://www.sec.gov' },
          { date: '2024-07-20', type: 'DEF 14A', title: 'Annual Meeting Proxy - Director Independence', link: 'https://www.sec.gov' },
          { date: '2024-04-28', type: '8-K', title: 'Board Committee Changes', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Board Tenure', value: edgeData?.tenure || '5 Years', icon: <Calendar size={16} /> },
          { label: 'Committees', value: `${committees.length}`, icon: <FileText size={16} /> },
          { label: 'Independence Status', value: edgeData?.independenceStatus || 'Independent', icon: <TrendingUp size={16} /> },
        ],
      };

    default:
      return {
        ...base,
        description: `${sourceNode.label} has a relationship with ${targetNode.label} (Type: ${type})`,
        pieChartData: [
          { name: sourceNode.label, value: 50, color: '#6366f1' },
          { name: targetNode.label, value: 50, color: '#3b82f6' },
        ],
        secFilings: [
          { date: '2024-12-01', type: '10-K', title: 'Annual Report', link: 'https://www.sec.gov' },
          { date: '2024-09-15', type: '10-Q', title: 'Quarterly Report', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Relationship Type', value: type, icon: <FileText size={16} /> },
        ],
      };
  }
}

export default function RelationshipCard({ edge, sourceNode, targetNode, allRelationships, onRelationshipChange, onClose }: RelationshipCardProps) {
  const relationshipData = useMemo(() => 
    getRelationshipData(edge.type, sourceNode, targetNode, edge.data),
    [edge.type, sourceNode, targetNode, edge.data]
  );

  const COLORS = relationshipData.pieChartData?.map(d => d.color) || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-6 top-6 bottom-6 w-[450px] bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-40 overflow-hidden flex flex-col relative"
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 50 }}
          className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-md"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="h-32 bg-gradient-to-br from-violet-900/50 to-indigo-900/50 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.2),transparent_70%)]" />
          <div className="absolute bottom-4 left-8 right-8">
            {/* Relationship Type Selector - show if multiple relationships exist */}
            {allRelationships && allRelationships.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {allRelationships.map((rel, idx) => (
                  <button
                    key={idx}
                    onClick={() => onRelationshipChange && onRelationshipChange(rel.edge, rel.source, rel.target)}
                    className={`px-3 py-1 rounded-lg text-xs uppercase tracking-wide transition-colors ${
                      rel.edge.type === edge.type
                        ? 'bg-violet-600 text-white border border-violet-400'
                        : 'bg-white/10 text-violet-300 border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {EDGE_LABELS[rel.edge.type]}
                  </button>
                ))}
              </div>
            )}
            <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-xs uppercase tracking-wide text-violet-300 inline-block mb-2">
              {EDGE_LABELS[edge.type]}
            </div>
            <h2 className="text-xl font-bold text-white">
              {/* Show directional arrow for ownership, bidirectional arrow for others */}
              {edge.type === EdgeType.Ownership ? (
                <>{sourceNode.label} → {targetNode.label}</>
              ) : (
                <>{sourceNode.label} ↔ {targetNode.label}</>
              )}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 pb-8 pt-6 overflow-y-auto space-y-6 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139, 92, 246, 0.5) transparent' }}>
          {/* Description */}
          <p className="text-slate-300 text-sm leading-relaxed">
            {relationshipData.description}
          </p>

          {/* Financial Data */}
          {relationshipData.financialData && (
            <div className="grid grid-cols-1 gap-3">
              {relationshipData.financialData.map((item, idx) => (
                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      {item.icon}
                      {item.label}
                    </div>
                    <div className="text-lg font-semibold text-white">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pie Chart */}
          {relationshipData.pieChartData && (
            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon size={18} className="text-violet-400" />
                <h3 className="text-white font-semibold">Distribution Breakdown</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={relationshipData.pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {relationshipData.pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${value}%`}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* SEC Filings */}
          {relationshipData.secFilings && relationshipData.secFilings.length > 0 && (
            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-violet-400" />
                <h3 className="text-white font-semibold">Recent SEC Filings</h3>
              </div>
              <div className="space-y-3">
                {relationshipData.secFilings.map((filing, idx) => (
                  <div 
                    key={idx} 
                    className="bg-black/20 p-3 rounded-lg border border-white/5 hover:border-violet-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="bg-violet-500/20 text-violet-300 text-xs px-2 py-0.5 rounded font-mono">
                        {filing.type}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Calendar size={12} />
                        {filing.date}
                      </span>
                    </div>
                    <p className="text-white text-sm">{filing.title}</p>
                    {filing.link && (
                      <a 
                        href={filing.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-violet-400 text-xs hover:text-violet-300 mt-1 inline-block"
                      >
                        View on SEC.gov →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supply Chain Info */}
          {relationshipData.supplyChainInfo && (
            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} className="text-violet-400" />
                <h3 className="text-white font-semibold">Supply Chain Details</h3>
              </div>
              
              {relationshipData.supplyChainInfo.tiers && (
                <div className="mb-4">
                  <h4 className="text-slate-300 text-sm font-medium mb-2">Supply Chain Tiers</h4>
                  <div className="space-y-2">
                    {relationshipData.supplyChainInfo.tiers.map((tier, idx) => (
                      <div key={idx} className="bg-black/20 p-3 rounded-lg">
                        <div className="text-violet-300 text-xs font-semibold mb-1">{tier.tier}</div>
                        <div className="text-slate-400 text-xs">{tier.suppliers.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relationshipData.supplyChainInfo.locations && (
                <div className="mb-4">
                  <h4 className="text-slate-300 text-sm font-medium mb-2">Geographic Locations</h4>
                  <div className="flex flex-wrap gap-2">
                    {relationshipData.supplyChainInfo.locations.map((loc, idx) => (
                      <span key={idx} className="bg-violet-500/20 text-violet-300 text-xs px-2 py-1 rounded">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {relationshipData.supplyChainInfo.riskLevel && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-yellow-400" />
                    <h4 className="text-slate-300 text-sm font-medium">Risk Assessment</h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      relationshipData.supplyChainInfo.riskLevel === 'Low' ? 'bg-green-500/20 text-green-300' :
                      relationshipData.supplyChainInfo.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {relationshipData.supplyChainInfo.riskLevel} Risk
                    </span>
                  </div>
                  {relationshipData.supplyChainInfo.riskFactors && (
                    <ul className="list-disc list-inside text-slate-400 text-xs space-y-1 ml-4">
                      {relationshipData.supplyChainInfo.riskFactors.map((factor, idx) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Partnership Info */}
          {relationshipData.partnershipInfo && (
            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Handshake size={18} className="text-violet-400" />
                <h3 className="text-white font-semibold">Partnership Details</h3>
              </div>

              {relationshipData.partnershipInfo.projects && (
                <div className="mb-4">
                  <h4 className="text-slate-300 text-sm font-medium mb-3">Active Projects</h4>
                  <div className="space-y-2">
                    {relationshipData.partnershipInfo.projects.map((project, idx) => (
                      <div key={idx} className="bg-black/20 p-3 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="text-white text-sm font-medium">{project.name}</div>
                          <div className="text-slate-400 text-xs mt-1">{project.value}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          project.status === 'Active' ? 'bg-green-500/20 text-green-300' :
                          project.status === 'Planning' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-slate-500/20 text-slate-300'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relationshipData.partnershipInfo.milestones && (
                <div className="mb-4">
                  <h4 className="text-slate-300 text-sm font-medium mb-3">Key Milestones</h4>
                  <div className="space-y-2">
                    {relationshipData.partnershipInfo.milestones.map((milestone, idx) => (
                      <div key={idx} className="bg-black/20 p-3 rounded-lg flex items-start gap-3">
                        <div className="flex items-center gap-1 text-slate-400 text-xs whitespace-nowrap">
                          <Calendar size={12} />
                          {milestone.date}
                        </div>
                        <div className="text-slate-300 text-sm">{milestone.event}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relationshipData.partnershipInfo.collaboration && (
                <div>
                  <h4 className="text-slate-300 text-sm font-medium mb-2">Collaboration Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {relationshipData.partnershipInfo.collaboration.map((area, idx) => (
                      <span key={idx} className="bg-violet-500/20 text-violet-300 text-xs px-2 py-1 rounded">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* News Articles */}
          {relationshipData.news && relationshipData.news.length > 0 && (
            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper size={18} className="text-violet-400" />
                <h3 className="text-white font-semibold">Recent News & Articles</h3>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139, 92, 246, 0.5) transparent' }}>
                {relationshipData.news.map((article, idx) => (
                  <div 
                    key={idx} 
                    className="bg-black/20 p-4 rounded-lg border border-white/5 hover:border-violet-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Calendar size={12} />
                        {article.date}
                      </span>
                      <span className="text-violet-400 text-xs">{article.source}</span>
                    </div>
                    <h4 className="text-white text-sm font-medium mb-2 hover:text-violet-300 transition-colors">
                      {article.link ? (
                        <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {article.title}
                        </a>
                      ) : (
                        article.title
                      )}
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed">{article.summary}</p>
                    {article.link && (
                      <a 
                        href={article.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-violet-400 text-xs hover:text-violet-300 mt-2 inline-block"
                      >
                        Read more →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
