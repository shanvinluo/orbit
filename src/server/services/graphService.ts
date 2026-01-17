import fs from 'fs';
import path from 'path';
import { GraphData, NodeData, EdgeData, PathResult, CycleResult } from '../../shared/types';

// Load seed data into memory
const seedPath = path.join(process.cwd(), 'assets/seed/graph.json');
const rawData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
const GRAPH: GraphData = rawData;

// Create adjacency list for faster traversal
const adjacency: Map<string, string[]> = new Map();
GRAPH.nodes.forEach(n => adjacency.set(n.id, []));
GRAPH.links.forEach(l => {
  if (adjacency.has(l.source)) adjacency.get(l.source)?.push(l.target);
});

export const getGraph = () => GRAPH;

export const getNode = (id: string) => GRAPH.nodes.find(n => n.id === id);

export const getPaths = (startId: string, endId: string, maxDepth: number = 5): PathResult => {
  const queue: { id: string, path: string[] }[] = [{ id: startId, path: [startId] }];
  const validPaths: string[][] = [];
  const visitedAtDepth: Map<string, number> = new Map(); // id -> minDepth

  let shortest = Infinity;

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    
    if (path.length > maxDepth + 1) continue;

    if (id === endId) {
      validPaths.push(path);
      if (path.length < shortest) shortest = path.length;
      if (validPaths.length >= 20) break; // Cap results
      continue;
    }

    // Optimization: Don't revisit node if we found it earlier on a shorter path
    if (visitedAtDepth.has(id) && visitedAtDepth.get(id)! < path.length) continue;
    visitedAtDepth.set(id, path.length);

    const neighbors = adjacency.get(id) || [];
    for (const neighbor of neighbors) {
      if (!path.includes(neighbor)) {
        queue.push({ id: neighbor, path: [...path, neighbor] });
      }
    }
  }

  // Construct subgraph
  const nodeIds = new Set<string>(validPaths.flat());
  const nodes = GRAPH.nodes.filter(n => nodeIds.has(n.id));
  const edges = GRAPH.links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));

  return { nodes, edges, pathSequence: validPaths, shortestPathLength: shortest === Infinity ? 0 : shortest - 1 };
};

export const getCycles = (startId: string, maxDepth: number = 6): CycleResult => {
  const cycles: string[][] = [];
  
  const dfs = (current: string, path: string[]) => {
    if (path.length > maxDepth) return;
    
    const neighbors = adjacency.get(current) || [];
    
    for (const next of neighbors) {
      if (next === startId) {
        cycles.push([...path, next]);
        if (cycles.length > 30) return; // Cap
      } else if (!path.includes(next)) {
        dfs(next, [...path, next]);
      }
    }
  };

  dfs(startId, [startId]);
  return { cycles, count: cycles.length };
};

// Simple Fuzzy Search for Mapping
export const resolveEntity = (name: string): string | null => {
  const normalized = name.toLowerCase();
  const exact = GRAPH.nodes.find(n => n.name.toLowerCase() === normalized || n.id.toLowerCase() === normalized || n.ticker?.toLowerCase() === normalized);
  if (exact) return exact.id;
  
  // Basic substring match
  const fuzzy = GRAPH.nodes.find(n => n.name.toLowerCase().includes(normalized));
  return fuzzy ? fuzzy.id : null;
};
