import { RelationType } from './types';

export const RELATION_COLORS: Record<RelationType, string> = {
  [RelationType.OWNERSHIP]: '#ef4444', // Red
  [RelationType.PARTNERSHIP]: '#3b82f6', // Blue
  [RelationType.CLIENT]: '#10b981', // Emerald
  [RelationType.SUPPLIER]: '#f59e0b', // Amber
  [RelationType.CREDITOR]: '#8b5cf6', // Violet
  [RelationType.DEBTOR]: '#ec4899', // Pink
  [RelationType.JOINT_VENTURE]: '#06b6d4', // Cyan
  [RelationType.LICENSING]: '#84cc16', // Lime
  [RelationType.SWAPS]: '#f97316', // Orange
  [RelationType.BOARD_INTERLOCK]: '#d946ef', // Fuchsia
};

export const DEFAULT_GRAPH_DEPTH = 3;
