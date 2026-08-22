/**
 * graph_memory.ts
 *
 * Graph Memory & Privacy Redactor for L.U.C.I. (Inspired by Jarvis Knowledge Graph)
 *
 * Stores entities, relationships, user preferences and facts in a relational graph,
 * with automatic redactor layer to filter sensitive tokens (API keys, passwords, credentials).
 */

export interface GraphNode {
  id: string;
  label: string;
  type: 'PERSON' | 'PREFERENCE' | 'FACT' | 'DEVICE' | 'PROJECT';
  properties: Record<string, any>;
  createdAt: Date;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  relation: 'LIKES' | 'OWNS' | 'WORKS_ON' | 'PREFERS' | 'LOCATED_IN';
  weight: number;
}

export class GraphMemory {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];

  constructor() {
    this.initDefaultGraph();
  }

  /**
   * Redacts sensitive patterns (passwords, tokens, credentials) from text before saving.
   */
  public redactSensitiveData(text: string): string {
    let sanitized = text;

    // Redact API keys / tokens
    sanitized = sanitized.replace(/(sk-[a-zA-Z0-9]{20,})/g, '[REDACTED_API_KEY]');
    sanitized = sanitized.replace(/(ghp_[a-zA-Z0-9]{30,})/g, '[REDACTED_GITHUB_TOKEN]');
    sanitized = sanitized.replace(/(bearer\s+[a-zA-Z0-9\._\-]{20,})/gi, 'Bearer [REDACTED_TOKEN]');

    // Redact passwords explicitly mentioned ("minha senha é 12345")
    sanitized = sanitized.replace(/(senha|password)\s*(é|is|=|:)\s*([^\s,.]+)/gi, '$1 $2 [REDACTED_PASSWORD]');

    // Redact CPF / SSN patterns (e.g., 123.456.789-00)
    sanitized = sanitized.replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[REDACTED_CPF]');

    return sanitized;
  }

  /**
   * Add or update a node in the Knowledge Graph with sanitization.
   */
  public addFactNode(id: string, label: string, type: GraphNode['type'], rawFact: string): GraphNode {
    const cleanFact = this.redactSensitiveData(rawFact);
    const node: GraphNode = {
      id,
      label,
      type,
      properties: { fact: cleanFact },
      createdAt: new Date(),
    };

    this.nodes.set(id, node);
    console.log(`[GraphMemory] Added node [${id}]: ${label} (${type})`);
    return node;
  }

  /**
   * Connect two nodes with a relationship edge.
   */
  public addEdge(sourceId: string, targetId: string, relation: GraphEdge['relation'], weight: number = 1.0): void {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      console.warn(`[GraphMemory] Cannot connect missing nodes: ${sourceId} -> ${targetId}`);
      return;
    }

    this.edges.push({ sourceId, targetId, relation, weight });
    console.log(`[GraphMemory] Linked: ${sourceId} --[${relation}]--> ${targetId}`);
  }

  /**
   * Retrieve graph context for prompt enrichment.
   */
  public getContextSummary(query?: string): string {
    const summaryLines: string[] = ['[MEMÓRIA DE GRAFO DE CONHECIMENTO]'];

    for (const node of this.nodes.values()) {
      summaryLines.push(`- ${node.label} (${node.type}): ${node.properties.fact}`);
    }

    return summaryLines.join('\n');
  }

  private initDefaultGraph(): void {
    this.addFactNode('user_primary', 'Lucas Vilella', 'PERSON', 'Usuário primário e criador da L.U.C.I.');
    this.addFactNode('pref_theme', 'Tema Visual', 'PREFERENCE', 'Prefere interfaces futuristas em modo escuro com tons neon.');
  }
}
