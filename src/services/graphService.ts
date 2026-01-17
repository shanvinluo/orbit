import fs from 'fs';
import { GraphData, GraphNode, NodeType, EdgeType } from '../types';
import path from 'path';

// In-memory cache
let graphCache: GraphData | null = null;

const GRAPH_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'companies.json');

export const loadGraph = (): GraphData => {
  if (graphCache) return graphCache;
  
  try {
    const raw = fs.readFileSync(GRAPH_FILE_PATH, 'utf-8');
    const rawData = JSON.parse(raw);
    
    // Map raw data to application types
    const nodes: GraphNode[] = rawData.nodes.map((n: any) => ({
      id: n.id,
      label: n.name || n.label || n.id,
      type: (n.type?.toUpperCase() as NodeType) || NodeType.Company,
      description: n.description,
      val: n.val,
      // Additional financial metrics can be stored in data or specific fields
      data: {
        price: n.price,
        change: n.change,
        tvl: n.tvl,
        volume: n.volume
      }
    }));

    const links = rawData.links.map((l: any) => ({
      source: l.source,
      target: l.target,
      type: (l.type?.toUpperCase() as EdgeType) || EdgeType.Partnership, // Default to Partnership if unknown
      description: l.description,
      data: l.data
    }));

    graphCache = { nodes, links };
    return graphCache!;
  } catch (e) {
    console.error("Failed to load companies.json", e);
    // Fallback to empty
    return { nodes: [], links: [] };
  }
};

export const getNodeById = (id: string): GraphNode | undefined => {
  const data = loadGraph();
  return data.nodes.find(n => n.id === id);
};

export const searchNodes = (query: string): GraphNode[] => {
  const data = loadGraph();
  const lowerQ = query.toLowerCase();
  return data.nodes.filter(n => 
    n.label.toLowerCase().includes(lowerQ)
  ).slice(0, 10);
};
