'use client';

import React, { useEffect, useState, useCallback } from 'react';
import GraphViz from '@/components/GraphViz';
import SearchBar from '@/components/SearchBar';
import Chatbot from '@/components/Chatbot';
import TradingCard from '@/components/TradingCard';
import ToolsNavbar from '@/components/ToolsNavbar';
import NewsImpactPopup from '@/components/NewsImpactPopup';
import { GraphData, GraphNode, GraphEdge, EdgeType } from '@/types';
import { NewsAnalysis } from '@/services/aiService';

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightEdges, setHighlightEdges] = useState<Set<string>>(new Set());
  const [pathMode, setPathMode] = useState(false);
  const [newsMode, setNewsMode] = useState(false);
  const [newsAnalysis, setNewsAnalysis] = useState<NewsAnalysis | null>(null);
  const [enabledEdgeTypes, setEnabledEdgeTypes] = useState<Set<EdgeType>>(
    new Set(Object.values(EdgeType)) // All types enabled by default
  );

  // Load data
  useEffect(() => {
    fetch('/api/graph')
      .then(res => res.json())
      .then(data => setGraphData(data))
      .catch(error => console.error("Failed to fetch graph data:", error));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setHighlightNodes(new Set());
    setHighlightEdges(new Set());
    setPathMode(false);
    setNewsMode(false);
    setNewsAnalysis(null);
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    // If in path mode or news mode, don't change highlighting on node click
    if (pathMode || newsMode) return;

    setSelectedNode(node);

    // Simple neighbor highlighting
    const newHighlightNodes = new Set<string>([node.id]);
    const newHighlightEdges = new Set<string>();

    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      if (sourceId === node.id) {
        newHighlightNodes.add(targetId);
        newHighlightEdges.add(`${sourceId}-${targetId}`);
      } else if (targetId === node.id) {
        newHighlightNodes.add(sourceId);
        newHighlightEdges.add(`${sourceId}-${targetId}`);
      }
    });

    setHighlightNodes(newHighlightNodes);
    setHighlightEdges(newHighlightEdges);
  }, [graphData.links, pathMode]);

  const handlePathFound = useCallback((path: { nodes: string[]; edges: string[] } | null) => {
    if (path) {
      setPathMode(true);
      setHighlightNodes(new Set(path.nodes));
      setHighlightEdges(new Set(path.edges));
    } else {
      setPathMode(false);
      setHighlightNodes(new Set());
      setHighlightEdges(new Set());
    }
  }, []);

  const handleSearchSelect = useCallback((node: GraphNode) => {
    handleNodeClick(node);
  }, [handleNodeClick]);

  const handleToggleEdgeType = useCallback((type: EdgeType) => {
    setEnabledEdgeTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleToggleAllEdgeTypes = useCallback(() => {
    setEnabledEdgeTypes(prev => {
      const allTypes = Object.values(EdgeType);
      const allEnabled = allTypes.every(type => prev.has(type));
      return allEnabled ? new Set<EdgeType>() : new Set(allTypes);
    });
  }, []);

  const handleNewsAnalysis = useCallback((analysis: NewsAnalysis) => {
    setNewsAnalysis(analysis);
    setNewsMode(true);
    setPathMode(false);
    
    // Highlight affected companies
    const affectedIds = new Set(analysis.affectedCompanies.map(c => c.companyId));
    setHighlightNodes(affectedIds);
    
    // Also highlight edges connected to affected companies
    const affectedEdges = new Set<string>();
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (affectedIds.has(sourceId) || affectedIds.has(targetId)) {
        affectedEdges.add(`${sourceId}-${targetId}`);
        affectedEdges.add(`${targetId}-${sourceId}`);
      }
    });
    setHighlightEdges(affectedEdges);
  }, [graphData.links]);

  const handleCloseNewsPopup = useCallback(() => {
    setNewsAnalysis(null);
    // Keep highlighting but allow node clicks
    setNewsMode(false);
  }, []);
  
  // Create map of affected companies for GraphViz
  const affectedCompaniesMap = newsAnalysis 
    ? new Map(newsAnalysis.affectedCompanies.map(c => [c.companyId, c.impactType]))
    : undefined;

  return (
    <main className="relative w-screen h-screen bg-[#000011] overflow-hidden font-sans selection:bg-violet-500/30">
      {/* Background Gradient - Deep space nebula */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-[#000011] to-[#000011] pointer-events-none z-0" />

      {/* Graph Layer */}
      <div className="absolute inset-0 z-0">
        <GraphViz 
          data={graphData} 
          onNodeClick={handleNodeClick} 
          onBackgroundClick={clearSelection}
          highlightNodes={highlightNodes}
          highlightEdges={highlightEdges}
          focusedNodeId={selectedNode?.id}
          enabledEdgeTypes={enabledEdgeTypes}
          affectedCompanies={affectedCompaniesMap}
        />
      </div>

      {/* UI Layer */}
      <SearchBar nodes={graphData.nodes} onSelect={handleSearchSelect} />
      
      <ToolsNavbar 
        nodes={graphData.nodes}
        enabledTypes={enabledEdgeTypes}
        onToggle={handleToggleEdgeType}
        onToggleAll={handleToggleAllEdgeTypes}
        onPathFound={handlePathFound}
      />
      
      <Chatbot onNewsAnalysis={handleNewsAnalysis} />

      {newsAnalysis && (
        <NewsImpactPopup analysis={newsAnalysis} onClose={handleCloseNewsPopup} />
      )}

      {selectedNode && (
        <TradingCard node={selectedNode} onClose={clearSelection} />
      )}
      
      {/* Overlay Title */}
      <div className="absolute top-8 left-8 z-30 pointer-events-none select-none">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400 font-light text-4xl tracking-[0.3em] font-mono drop-shadow-[0_0_25px_rgba(139,92,246,0.4)]">
          ORBIT
        </h1>
      </div>
    </main>
  );
}
