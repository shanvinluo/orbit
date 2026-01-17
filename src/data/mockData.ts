// src/data/mockData.ts

import companiesData from './companies.json';

export type NodeType = 'company' | 'person' | 'fund';

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  val: number; // size
  description: string;
  price?: number;
  change?: number;
  tvl?: number;
  volume?: number;
}

export interface Link {
  source: string;
  target: string;
  type: 'partnership' | 'ownership' | 'investment';
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

// Use real company data from JSON file
export const MOCK_DATA: GraphData = companiesData as GraphData;
