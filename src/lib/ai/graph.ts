import { aiEngine } from './orchestrator';

export interface GraphData {
  nodes: { id: string; label: string; type: string }[];
  links: { source: string; target: string; label: string }[];
}

export class GraphCognitionEngine {
  async extractFromContext(context: string): Promise<GraphData> {
    const result = await aiEngine.executeAIFeature<any>('graph', context);
    
    if (!result.success) {
      return { nodes: [], links: [] };
    }

    // Standardize for react-force-graph if needed
    return {
      nodes: result.data.entities,
      links: result.data.relations
    };
  }
}

export const graphEngine = new GraphCognitionEngine();
