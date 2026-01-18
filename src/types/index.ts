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
  BoardInterlock = 'BOARD_INTERLOCK',
  Competitor = 'COMPETITOR'
}

export const EDGE_COLORS: Record<EdgeType, string> = {
  [EdgeType.Ownership]: '#8b5cf6', // Violet 500
  [EdgeType.Partnership]: '#3b82f6', // Blue 500
  [EdgeType.Client]: '#10b981', // Emerald 500
  [EdgeType.Supplier]: '#f59e0b', // Amber 500
  [EdgeType.Creditor]: '#ef4444', // Red 500
  [EdgeType.Debtor]: '#ec4899', // Pink 500
  [EdgeType.JointVenture]: '#06b6d4', // Cyan 500
  [EdgeType.Licensing]: '#6366f1', // Indigo 500
  [EdgeType.Swaps]: '#14b8a6', // Teal 500
  [EdgeType.BoardInterlock]: '#a855f7', // Purple 500
  [EdgeType.Competitor]: '#f97316' // Orange 500
};

// Human-readable labels for relationship types
export const EDGE_LABELS: Record<EdgeType, string> = {
  [EdgeType.Ownership]: 'Ownership',
  [EdgeType.Partnership]: 'Partnership',
  [EdgeType.Client]: 'Client',
  [EdgeType.Supplier]: 'Supplier',
  [EdgeType.Creditor]: 'Creditor',
  [EdgeType.Debtor]: 'Debtor',
  [EdgeType.JointVenture]: 'Joint Venture',
  [EdgeType.Licensing]: 'Licensing Agreement',
  [EdgeType.Swaps]: 'Swaps',
  [EdgeType.BoardInterlock]: 'Board Interlock',
  [EdgeType.Competitor]: 'Competitor'
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
  data?: {
    price?: number;
    change?: number;
    volume?: number;
    tvl?: number;
    [key: string]: any;
  };
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

export interface ExposureBreakdown {
  lengthPenalty: number;
  relationshipWeightScore: number;
  amountScore: number;
  ownershipScore: number;
  confidencePenalty: number;
}

export interface PathItem extends PathResult {
  pathId: string;
  exposureIndex: number;
  exposureBreakdown: ExposureBreakdown;
  summary: string;
}

export interface PathsResponse {
  shortestPath: PathItem | null;
  paths: PathItem[];
}

export interface CycleResult {
  path: string[];
  length: number;
}
