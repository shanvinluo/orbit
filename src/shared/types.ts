export enum RelationType {
  OWNERSHIP = 'Ownership',
  PARTNERSHIP = 'Partnership',
  CLIENT = 'Client',
  SUPPLIER = 'Supplier',
  CREDITOR = 'Creditor',
  DEBTOR = 'Debtor',
  JOINT_VENTURE = 'Joint Venture',
  LICENSING = 'Licensing Agreement',
  SWAPS = 'Swaps',
  BOARD_INTERLOCK = 'Board Interlock'
}

export interface NodeData {
  id: string;
  name: string;
  type: 'Company' | 'Institution' | 'Person' | 'Fund';
  ticker?: string;
  industry?: string;
  description?: string;
  val?: number; // Visual size
}

export interface EdgeData {
  source: string;
  target: string;
  type: RelationType;
  summary?: string;
  // Metadata for MVP
  pct?: number;
  amount?: string;
}

export interface GraphData {
  nodes: NodeData[];
  links: EdgeData[];
}

export interface PathResult {
  nodes: NodeData[];
  edges: EdgeData[];
  pathSequence: string[][]; // Array of node IDs
  shortestPathLength: number;
}

export interface CycleResult {
  cycles: string[][]; // Array of cycles (array of node IDs)
  count: number;
}

export interface AIResponse {
  entityA: string | null;
  entityB: string | null;
  foundPaths: boolean;
  explanation: string;
}
