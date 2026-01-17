'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { GraphData, GraphNode, EDGE_COLORS, EdgeType } from '@/types';
import SpriteText from 'three-spritetext';

// Dynamically import ForceGraph3D to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">Loading Constellations...</div>
});

interface Props {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
  onBackgroundClick?: () => void;
  highlightNodes: Set<string>;
  highlightEdges: Set<string>;
  focusedNodeId?: string;
  enabledEdgeTypes?: Set<EdgeType>;
}

export default function GraphViz({ data, onNodeClick, onBackgroundClick, highlightNodes, highlightEdges, focusedNodeId, enabledEdgeTypes }: Props) {
  const fgRef = useRef<any>();

  // Filter graph data based on enabled edge types
  const filteredData = useMemo(() => {
    if (!enabledEdgeTypes) return data;
    
    const filteredLinks = data.links.filter(link => enabledEdgeTypes.has(link.type));
    return {
      nodes: data.nodes,
      links: filteredLinks
    };
  }, [data, enabledEdgeTypes]);

  useEffect(() => {
    // Initial camera position
    if (fgRef.current) {
       fgRef.current.d3Force('charge').strength(-120);
    }
  }, []);

  // Zoom to focused node
  useEffect(() => {
    if (focusedNodeId && fgRef.current) {
        // Need to wait for graph to have nodes
        const node = data.nodes.find(n => n.id === focusedNodeId);
        if (node && typeof node.x === 'number') {
            const distance = 250; // Increased distance to zoom out further
            const distRatio = 1 + distance/Math.hypot(node.x, node.y!, node.z!);
            fgRef.current.cameraPosition(
                { x: node.x * distRatio, y: node.y! * distRatio, z: node.z! * distRatio },
                node as any,
                2000
            );
        }
    }
  }, [focusedNodeId, data.nodes]);

  return (
    <div className="w-full h-full">
      <ForceGraph3D
        ref={fgRef}
        graphData={filteredData}
        nodeLabel="label"
        nodeColor={(node: any) => highlightNodes.has(node.id) ? '#d946ef' : '#8b5cf6'} // Highlight: Fuchsia, Default: Violet (High-tech purple)
        nodeVal={(node: any) => (node.val || 1) * 1.5}
        nodeResolution={16}
        nodeOpacity={0.9}
        linkColor={(link: any) => {
            const id = typeof link.source === 'object' 
                ? `${link.source.id}-${link.target.id}`
                : `${link.source}-${link.target}`;
            
            // If path is highlighted, use highlight color
            if (highlightEdges.has(id)) {
                return '#d946ef'; // Magenta for highlighted path
            }
            
            // If any node is highlighted, fade out non-highlighted edges
            if (highlightNodes.size > 0) {
                return 'rgba(100, 100, 100, 0.02)'; // Very transparent
            }
            
            // Use relationship type color with appropriate opacity
            const edgeType = link.type as EdgeType;
            const baseColor = EDGE_COLORS[edgeType] || '#8b5cf6';
            // Convert hex to rgba with opacity
            const r = parseInt(baseColor.slice(1, 3), 16);
            const g = parseInt(baseColor.slice(3, 5), 16);
            const b = parseInt(baseColor.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, 0.4)`;
        }}
        linkWidth={(link: any) => {
            const id = typeof link.source === 'object' 
                ? `${link.source.id}-${link.target.id}`
                : `${link.source}-${link.target}`;
            // Thicker lines for highlighted path edges
            return highlightEdges.has(id) ? 3 : 1.5;
        }}
        linkOpacity={(link: any) => {
            const id = typeof link.source === 'object' 
                ? `${link.source.id}-${link.target.id}`
                : `${link.source}-${link.target}`;
            // Full opacity for highlighted edges, reduced for others
            if (highlightEdges.has(id)) return 1;
            if (highlightNodes.size > 0) return 0.1;
            return 0.6;
        }}
        onNodeClick={(node) => {
            onNodeClick(node as GraphNode);
        }}
        onBackgroundClick={onBackgroundClick}
        nodeThreeObjectExtend={true}
        nodeThreeObject={(node: any) => {
            // Show text for highlighted nodes
            if (highlightNodes.has(node.id)) {
                const sprite = new SpriteText(node.label);
                sprite.color = '#d946ef';
                sprite.textHeight = 6;
                sprite.padding = 2;
                sprite.backgroundColor = 'rgba(0,0,0,0.7)';
                sprite.borderRadius = 4;
                return sprite;
            }
            // If no nodes are highlighted, show text for all (or just important ones)
            // But user said "too messy", so maybe show nothing or very faint text?
            // Let's only show text on hover or highlight. 
            // For now, strict highlight only.
            return false;
        }}
        backgroundColor="rgba(0,0,0,0)" // Transparent for the radial gradient in parent
        showNavInfo={false}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        maxZoom={1000}
        minZoom={0.1}
      />
    </div>
  );
}
