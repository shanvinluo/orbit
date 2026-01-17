export enum NodeType {
  Company = 'COMPANY',
  Person = 'PERSON',
  Institution = 'INSTITUTION',
  Fund = 'FUND'
}

export enum EdgeType {
  Ownership = 'OWNERSHIP',
  Partnership = 'PARTNERSHIP',
  Client = 'CLIENT',
  Supplier = 'SUPPLIER',
  Creditor = 'CREDITOR',
  Debtor = 'DEBTOR',
  JointVenture = 'JOINT_VENTURE',
  Licensing = 'LICENSING',
  Swaps = 'SWAPS',
  BoardInterlock = 'BOARD_INTERLOCK'
}

export const EDGE_COLORS: Record<EdgeType, string> = {
  [EdgeType.Ownership]: '#e9d5ff', // Purple 200
  [EdgeType.Partnership]: '#d8b4fe', // Purple 300
  [EdgeType.Client]: '#c084fc', // Purple 400
  [EdgeType.Supplier]: '#a855f7', // Purple 500
  [EdgeType.Creditor]: '#e9d5ff',
  [EdgeType.Debtor]: '#d8b4fe',
  [EdgeType.JointVenture]: '#c084fc',
  [EdgeType.Licensing]: '#a855f7',
  [EdgeType.Swaps]: '#e9d5ff',
  [EdgeType.BoardInterlock]: '#d8b4fe'
};

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  ticker?: string;
  description?: string;
  industry?: string;
  val?: number; // Visual size
  x?: number;
  y?: number;
  z?: number;
}

export interface GraphEdge {
  source: string | any;
  target: string | any;
  type: EdgeType;
  description?: string; // Summary of relationship
  data?: any; // Specifics (pct, amount, etc.)
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}

export interface PathResult {
  nodes: string[];
  edges: GraphEdge[];
  length: number;
}

export interface CycleResult {
  path: string[];
  length: number;
}
