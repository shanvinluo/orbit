import { loadGraph } from './graphService';
import { PathResult, CycleResult, GraphEdge } from '../types';

export const findPaths = (fromId: string, toId: string, maxDepth: number = 5): PathResult[] => {
  const graph = loadGraph();
  const adj = new Map<string, GraphEdge[]>();
  
  // Build adjacency list with edge details
  graph.links.forEach(link => {
    if (!adj.has(link.source as string)) adj.set(link.source as string, []);
    adj.get(link.source as string)!.push(link);
    
    // For pathfinding, treat as undirected for now (can be refined)
    if (!adj.has(link.target as string)) adj.set(link.target as string, []);
    adj.get(link.target as string)!.push({ ...link, source: link.target, target: link.source }); // Reverse edge for undirected traversal
  });

  const queue: { id: string; pathNodes: string[]; pathEdges: GraphEdge[] }[] = [{ id: fromId, pathNodes: [fromId], pathEdges: [] }];
  const results: PathResult[] = [];
  const visited = new Set<string>(); 

  while (queue.length > 0) {
    const { id, pathNodes, pathEdges } = queue.shift()!;
    
    if (pathNodes.length > maxDepth + 1) continue;

    if (id === toId) {
      results.push({ nodes: pathNodes, edges: pathEdges, length: pathNodes.length - 1 });
      if (results.length >= 10) break; // Cap results
      continue;
    }

    // Simple path: do not revisit nodes within the current path
    // For non-simple paths, this logic would change
    if (visited.has(id) && pathNodes.length > 1) continue; 
    visited.add(id);

    const neighbors = adj.get(id) || [];
    for (const link of neighbors) {
      const neighborId = link.target as string;
      if (!pathNodes.includes(neighborId)) {
        queue.push({ 
          id: neighborId, 
          pathNodes: [...pathNodes, neighborId], 
          pathEdges: [...pathEdges, link] 
        });
      }
    }
  }
  
  return results.sort((a, b) => a.length - b.length);
};

/**
 * Finds the shortest path between two nodes using BFS
 * Returns null if no path exists
 */
export const findShortestPath = (fromId: string, toId: string, maxDepth: number = 10): PathResult | null => {
  const graph = loadGraph();
  const adj = new Map<string, GraphEdge[]>();
  
  // Build adjacency list with edge details (undirected)
  graph.links.forEach(link => {
    const sourceId = link.source as string;
    const targetId = link.target as string;
    
    if (!adj.has(sourceId)) adj.set(sourceId, []);
    adj.get(sourceId)!.push(link);
    
    // Add reverse edge for undirected traversal
    if (!adj.has(targetId)) adj.set(targetId, []);
    adj.get(targetId)!.push({ ...link, source: targetId, target: sourceId });
  });

  // BFS to find shortest path
  const queue: { id: string; pathNodes: string[]; pathEdges: GraphEdge[] }[] = [{ id: fromId, pathNodes: [fromId], pathEdges: [] }];
  const visited = new Set<string>([fromId]);

  while (queue.length > 0) {
    const { id, pathNodes, pathEdges } = queue.shift()!;
    
    if (pathNodes.length > maxDepth + 1) continue;

    if (id === toId) {
      return { nodes: pathNodes, edges: pathEdges, length: pathNodes.length - 1 };
    }

    const neighbors = adj.get(id) || [];
    for (const link of neighbors) {
      const neighborId = link.target as string;
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({ 
          id: neighborId, 
          pathNodes: [...pathNodes, neighborId], 
          pathEdges: [...pathEdges, link] 
        });
      }
    }
  }
  
  return null; // No path found
};

export const findCycles = (nodeId: string, maxDepth: number = 6): CycleResult[] => {
  const graph = loadGraph();
  const cycles: CycleResult[] = [];
  const adj = new Map<string, GraphEdge[]>();

  // Build adjacency list for directed edges
  graph.links.forEach(link => {
    if (!adj.has(link.source as string)) adj.set(link.source as string, []);
    adj.get(link.source as string)!.push(link);
  });

  const dfs = (u: string, path: string[], visitedEdges: Set<string>) => {
    path.push(u);

    if (path.length > maxDepth + 1) {
      path.pop();
      return;
    }

    const neighbors = adj.get(u) || [];
    for (const link of neighbors) {
      const v = link.target as string;
      // const edgeKey = `${link.source}-${link.target}`; // Unused

      if (v === nodeId && path.length > 2) { // Found a cycle back to the start node
        const cyclePath = [...path, v];
        // Deduplicate cycles (e.g., by sorting node IDs in path)
        const canonicalPath = [...cyclePath].sort().join('-');
        if (!visitedEdges.has(canonicalPath)) {
          cycles.push({ path: cyclePath, length: cyclePath.length - 1 });
          visitedEdges.add(canonicalPath);
        }
        if (cycles.length >= 50) return; // Cap results
      } else if (!path.includes(v)) { // Avoid immediate back-tracking
        dfs(v, path, visitedEdges);
        if (cycles.length >= 50) return;
      }
    }
    path.pop();
  };

  dfs(nodeId, [], new Set<string>());
  
  return cycles;
};
