export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyResponse {
  nodes: SankeyNode[];
  links: SankeyLink[];
}
