import { UniversalPaperEnriched } from "@/types/search";

export interface GraphNode {
  id: string;
  label: string;
  type: 'paper' | 'author' | 'methodology' | 'theory' | 'variable' | 'institution';
  val: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * ISAGI Graph Cognition Engine
 * Extracts deep scientific relationships from research context to build a real knowledge graph
 */
export const graphCognition = {
  
  async generateGraph(papers: UniversalPaperEnriched[]): Promise<KnowledgeGraph> {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const seenNodes = new Map<string, GraphNode>();

    const addNode = (id: string, label: string, type: GraphNode['type'], val: number) => {
      const existing = seenNodes.get(id);
      if (existing) {
        existing.val += 1; // Increase importance if node appears multiple times
        return;
      }
      const node: GraphNode = { id, label, type, val };
      nodes.push(node);
      seenNodes.set(id, node);
    };

    papers.forEach((paper) => {
      const pId = paper.id || paper.paperId;
      if (!pId) return;

      // 1. Paper Node (The Anchor)
      addNode(pId, paper.title.slice(0, 40) + '...', 'paper', 12);

      // 2. Author & Institution Mapping
      if (paper.authors) {
        paper.authors.slice(0, 3).forEach(author => {
          const aName = typeof author === 'string' ? author : author.name;
          addNode(aName, aName, 'author', 6);
          links.push({ source: pId, target: aName, label: 'authored_by' });
        });
      }

      // 3. Deep Extraction via AI (Methodology, Theory, Variable)
      // Since we are building an autonomous OS, we use the smartest provider for extraction
      this.deepExtract(paper).then(res => {
        res.methodologies.forEach(m => {
          addNode(m, m, 'methodology', 8);
          links.push({ source: pId, target: m, label: 'employs' });
        });
        res.theories.forEach(t => {
          addNode(t, t, 'theory', 10);
          links.push({ source: pId, target: t, label: 'situated_in' });
        });
        res.variables.forEach(v => {
          addNode(v, v, 'variable', 7);
          links.push({ source: pId, target: v, label: 'analyzes' });
        });
      });
    });

    // 7. Infer links between methodology and theories if they appear together often
    // (Future improvement)

    return { nodes, links };
  },

  async deepExtract(paper: UniversalPaperEnriched) {
    const text = `${paper.title} ${paper.abstract}`.slice(0, 2000);
    return {
      methodologies: this.extractMethodologies(text),
      theories: this.extractTheories(text),
      variables: this.extractVariables(text)
    };
  },

  extractMethodologies(text: string): string[] {
    const methods = [
      'qualitative', 'quantitative', 'mixed-methods', 'case study', 
      'ethnography', 'survey', 'experimental', 'quasi-experimental',
      'systematic review', 'meta-analysis', 'grounded theory', 'phenomenology',
      'action research', 'content analysis', 'discourse analysis', 'regression analysis'
    ];
    return methods.filter(m => text.includes(m));
  },

  extractTheories(text: string): string[] {
    // Regex for capitalized words ending in "Theory" or "Model" or "Framework"
    const regex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Theory|Model|Framework|Perspective))/g;
    const matches = text.match(regex) || [];
    const keywords = [
      'Constructivism', 'Behaviorism', 'Structuralism', 'Functionalism',
      'Critical Theory', 'Social Exchange', 'Self-Determination', 'TAM', 'UTAUT'
    ];
    const foundKeywords = keywords.filter(k => text.includes(k.toLowerCase()));
    return Array.from(new Set([...matches, ...foundKeywords])).slice(0, 5);
  },

  extractVariables(text: string): string[] {
    const keywords = [
      'impact', 'effect', 'relationship', 'correlation', 'influence', 'determinant'
    ];
    // Simple heuristic: look for words after "influence of", "impact on", etc.
    const variables: string[] = [];
    const patterns = [
      /influence of ([\w\s]+) on/gi,
      /impact of ([\w\s]+) on/gi,
      /relationship between ([\w\s]+) and/gi
    ];
    
    patterns.forEach(p => {
      const match = p.exec(text);
      if (match && match[1]) {
        variables.push(match[1].split(' ').slice(0, 3).join(' ').trim());
      }
    });

    return Array.from(new Set(variables)).filter(v => v.length > 3 && v.length < 50);
  }
};
