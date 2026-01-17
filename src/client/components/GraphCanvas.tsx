import React, { useEffect, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { GraphData, RelationType } from '../../shared/types';
import { RELATION_COLORS } from '../../shared/constants';

interface Props {
  data: GraphData;
  onNodeClick: (node: any) => void;
  onEdgeClick: (link: any) => void;
  highlightNodes: Set<string>;
  highlightLinks: Set<string>;
}

const GraphCanvas: React.FC<Props> = ({ data, onNodeClick, onEdgeClick, highlightNodes, highlightLinks }) => {
  const fgRef = useRef<any>();

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={data}
      nodeLabel="name"
      nodeColor={node => highlightNodes.size > 0 && !highlightNodes.has((node as any).id) ? '#333' : '#00f3ff'}
      nodeVal={node => (node as any).val || 10}
      nodeOpacity={1}
      
      linkColor={link => {
        if (highlightLinks.size > 0 && !highlightLinks.has((link as any).id)) return '#222';
        return RELATION_COLORS[(link as any).type as RelationType] || '#ffffff';
      }}
      linkWidth={link => highlightLinks.has((link as any).id) ? 3 : 1}
      linkOpacity={0.8}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      
      onNodeClick={(node) => {
        fgRef.current?.cameraPosition(
          { x: node.x, y: node.y, z: node.z + 100 }, 
          node, 
          2000
        );
        onNodeClick(node);
      }}
      onLinkClick={onEdgeClick}
      backgroundColor="#0b0f14"
    />
  );
};

export default GraphCanvas;
