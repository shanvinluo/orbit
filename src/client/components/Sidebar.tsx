import React, { useState } from 'react';
import { RELATION_COLORS } from '../../shared/constants';
import { RelationType } from '../../shared/types';

interface Props {
  selectedNode: any | null;
  selectedEdge: any | null;
  pathResult: any | null;
  cycleResult: any | null;
  onAnalyzeAI: (text: string) => void;
  loadingAI: boolean;
  aiExplanation: string | null;
}

const Sidebar: React.FC<Props> = ({ selectedNode, selectedEdge, pathResult, cycleResult, onAnalyzeAI, loadingAI, aiExplanation }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'ai'>('info');
  const [aiInput, setAiInput] = useState('');

  return (
    <div className="absolute top-16 right-4 w-80 h-[85vh] glass-panel rounded-lg flex flex-col text-sm z-10">
      <div className="flex border-b border-gray-700">
        <button className={`flex-1 p-3 ${activeTab==='info' ? 'bg-gray-800 text-white' : 'text-gray-400'}`} onClick={()=>setActiveTab('info')}>DATA</button>
        <button className={`flex-1 p-3 ${activeTab==='ai' ? 'bg-gray-800 text-white' : 'text-gray-400'}`} onClick={()=>setActiveTab('ai')}>GEMINI AI</button>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        {activeTab === 'info' && (
          <>
            {!selectedNode && !selectedEdge && <div className="text-gray-500 italic">Select a node or edge...</div>}
            
            {selectedNode && (
              <div className="animate-in fade-in">
                <h2 className="text-xl font-bold text-[#00f3ff] mb-2">{selectedNode.name}</h2>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-900 p-2 rounded">
                    <span className="block text-xs text-gray-500">TICKER</span>
                    {selectedNode.ticker || 'N/A'}
                  </div>
                  <div className="bg-gray-900 p-2 rounded">
                    <span className="block text-xs text-gray-500">TYPE</span>
                    {selectedNode.type}
                  </div>
                </div>
                {cycleResult && (
                  <div className="mb-4 border border-pink-500 p-2 rounded bg-pink-900/20">
                    <h3 className="font-bold text-pink-400">CIRCLE JERK DETECTED</h3>
                    <p>{cycleResult.count} Cycles Found</p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      {cycleResult.cycles.slice(0,3).map((c:any, i:number) => (
                         <li key={i}>{c.join(' -> ')}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {selectedEdge && (
              <div className="mt-4 border-t border-gray-700 pt-4">
                 <h3 className="text-lg font-bold" style={{color: RELATION_COLORS[selectedEdge.type as RelationType]}}>{selectedEdge.type}</h3>
                 <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                    <span>{selectedEdge.source.name || selectedEdge.source}</span>
                    <span>→</span>
                    <span>{selectedEdge.target.name || selectedEdge.target}</span>
                 </div>
                 <div className="bg-gray-900 p-3 rounded mb-2">
                    {selectedEdge.summary || "Relationship classified."}
                 </div>
                 <div className="text-xs text-gray-500">Evidence: 1 item loaded (Mock DB)</div>
              </div>
            )}

            {pathResult && (
               <div className="mt-4 border-t border-gray-700 pt-4">
                 <h3 className="text-lg font-bold text-green-400">Explorer Results</h3>
                 <p>Shortest Path: {pathResult.shortestPathLength} hops</p>
                 <div className="mt-2 text-xs font-mono bg-black p-2 rounded">
                   {pathResult.pathSequence[0]?.join(' > ')}
                 </div>
               </div>
            )}
          </>
        )}

        {activeTab === 'ai' && (
          <div className="flex flex-col h-full">
            <p className="text-xs text-gray-400 mb-4">Paste news or tweet to analyze relationships.</p>
            <textarea 
              className="w-full bg-black border border-gray-700 p-2 rounded text-white text-xs mb-2 h-24"
              placeholder='e.g., "Microsoft investment in OpenAI creates dependency..."'
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
            />
            <button 
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded font-bold text-xs"
              onClick={() => onAnalyzeAI(aiInput)}
              disabled={loadingAI}
            >
              {loadingAI ? 'ANALYZING...' : 'DECODE WITH GEMINI'}
            </button>
            
            {aiExplanation && (
              <div className="mt-4 p-3 bg-gray-800 rounded border-l-4 border-blue-500 text-xs leading-relaxed">
                <h4 className="font-bold mb-1 text-blue-400">ANALYSIS</h4>
                {aiExplanation}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
