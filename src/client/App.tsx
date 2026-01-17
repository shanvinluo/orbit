import React, { useEffect, useState } from 'react';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import { GraphData } from '../shared/types';
import { RELATION_COLORS } from '../shared/constants';

function App() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  
  // Features
  const [circleJerkMode, setCircleJerkMode] = useState(false);
  const [pathResult, setPathResult] = useState<any>(null);
  const [cycleResult, setCycleResult] = useState<any>(null);
  
  // AI
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/graph')
      .then(res => res.json())
      .then(data => {
        // Pre-process links to ensure IDs match
        setGraphData(data);
      });
  }, []);

  const resetHighlights = () => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    setPathResult(null);
    setCycleResult(null);
  };

  const handleNodeClick = (node: any) => {
    resetHighlights();
    setSelectedNode(node);
    setSelectedEdge(null);

    if (circleJerkMode) {
      fetch(`/api/cycles?node=${node.id}`)
        .then(res => res.json())
        .then(data => {
          setCycleResult(data);
          const ids = new Set<string>();
          const links = new Set<string>();
          
          data.cycles.forEach((cycle: string[]) => {
            cycle.forEach((id, i) => {
              ids.add(id);
              if (i < cycle.length - 1) {
                // Find edge ID if possible, for now just logic
              }
            });
          });
          setHighlightNodes(ids);
          // Highlighting specific cycle edges requires complex link id matching
          // For MVP, we highlight nodes heavily
        });
    }
  };

  const handleAIAnalyze = async (text: string) => {
    setLoadingAI(true);
    setAiExplanation(null);
    resetHighlights();

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      
      setAiExplanation(data.explanation);
      
      if (data.foundPaths && data.paths) {
        setPathResult(data.paths);
        const ids = new Set<string>();
        data.paths.nodes.forEach((n: any) => ids.add(n.id));
        setHighlightNodes(ids);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* Navbar */}
      <div className="absolute top-0 left-0 w-full h-14 bg-black/80 backdrop-blur border-b border-gray-800 flex items-center px-6 z-10 justify-between">
        <h1 className="text-xl font-bold tracking-wider text-white">CORPORATE <span className="text-[#00f3ff]">CONSTELLATIONS</span></h1>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center cursor-pointer text-xs uppercase font-bold text-pink-500">
            <input 
              type="checkbox" 
              className="mr-2"
              checked={circleJerkMode} 
              onChange={e => setCircleJerkMode(e.target.checked)} 
            />
            Circle Jerk Mode
          </label>
        </div>
      </div>

      <GraphCanvas 
        data={graphData} 
        onNodeClick={handleNodeClick}
        onEdgeClick={(link) => { setSelectedEdge(link); setSelectedNode(null); }}
        highlightNodes={highlightNodes}
        highlightLinks={highlightLinks}
      />

      <Sidebar 
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        pathResult={pathResult}
        cycleResult={cycleResult}
        onAnalyzeAI={handleAIAnalyze}
        loadingAI={loadingAI}
        aiExplanation={aiExplanation}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-4 glass-panel rounded pointer-events-none">
        <h4 className="text-xs text-gray-500 mb-2 font-bold">RELATIONSHIPS</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(RELATION_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{backgroundColor: color}}></div>
              <span className="text-[10px] text-gray-300">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
