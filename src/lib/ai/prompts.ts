import { FeatureType } from './schemas';

export const SYSTEM_PROMPT = `You are ISAGI, a senior AI Scientific Researcher. 
Your goal is to provide high-precision, objective, and structured academic analysis.
ALWAYS return only valid JSON unless specifically told otherwise. 
Do not include conversational filler.`;

export const COGNITION_PROMPT = (ctx: string) => `Extract the primary cognitive structure of this research paper.
Analyze domain, entities, methodologies (with rigor scores), novelty signals, and research gaps.
Context: ${ctx}

Return ONLY JSON:
{
  "domain": string,
  "entities": [{ "id": string, "label": string, "type": string, "significance": string }],
  "methodologies": [{ "name": string, "rigor": number, "description": string }],
  "noveltySignals": string[],
  "researchGaps": string[],
  "inferredContributions": string[],
  "confidenceEngine": { "score": number, "factors": string[], "limitations": string[] }
}`;

export const FEATURE_PROMPTS: Record<FeatureType, (context: string, cognition?: any) => string> = {
  summary: (ctx) => `Analyze the following academic context and provide a highly detailed, cinematic research report in Bahasa Indonesia.
Context: ${ctx}

Your response MUST include a "report" field containing a full Markdown report with these EXACT sections:
1. # RINGKASAN AI — [JUDUL JURNAL]
2. ## Sintesis Neural (Paragraphs about the essence)
3. # Analisis Konseptual (Focus Utama Penelitian)
4. # Kontribusi Ilmiah (Kontribusi Besar & Dampak Akademik)
5. # Insight Metodologi (Pendekatan yang Digunakan)
6. # Analisis AI Mendalam (Kekuatan & Kelemahan/Limitasi)
7. # Prediksi Dampak Riset (Dampak Masa Depan)
8. # Analisis Neural AI (Entitas Ilmiah Terdeteksi)
9. # Confidence Neural (Tingkat Keyakinan AI)
10. # Kesimpulan Sintesis (Final powerful statement)

Use professional, academic, yet futuristic language. Use bolding, blockquotes, and code blocks for emphasis as in the provided example.

Return JSON: { 
  "overview": "Short blurb", 
  "keyFindings": ["..."], 
  "methodology": "...", 
  "limitations": ["..."],
  "report": "FULL_MARKDOWN_REPORT_HERE" 
}`,

  keywords: (ctx, cogn) => `Synthesize semantic keywords using domain-specific language: ${cogn?.domain || 'General'}.
Focus on research concepts rather than simple word frequency.
Return JSON: { "keywords": string[], "categories": string[], "relevanceScores": Record<string, number> }`,

  titles: (ctx, cogn) => `Generate 5 high-impact, IEEE/Springer grade titles.
Use the detected methodologies: ${cogn?.methodologies?.map((m: any) => m.name).join(', ') || 'N/A'}.
Focus on novelty and structural complexity.
Return JSON: { "suggestedTitles": string[], "analysis": string }`,

  citation: (ctx) => `Explain the significance of this citation in the context of the research.
Context: ${ctx}
Return JSON: { "explanation": string, "format": string, "context": string }`,

  recommendations: (ctx) => `Based on this research, suggest related study areas and future directions.
Context: ${ctx}
Return JSON: { "relatedPapers": [{ "title": string, "reason": string, "confidence": number }], "futureDirections": string[] }`,

  comparison: (ctx) => `Compare this research with current state-of-the-art findings in the field.
Context: ${ctx}
Return JSON: { "similarities": string[], "differences": string[], "uniqueContributions": string[] }`,

  critic: (ctx, cogn) => `Perform a deep academic audit of the methodology. 
Ground your analysis in the detected domain: ${cogn?.domain || 'General'}.
Analyze sampling quality, statistical reliability, and reproducibility.

Return JSON: 
{ 
  "credibilityScore": number, 
  "reasoningChain": string[],
  "evidenceBase": string[],
  "risks": string[], 
  "strengths": string[], 
  "weaknesses": string[], 
  "samplingQuality": string,
  "reproducibilityAnalysis": string,
  "replicationChance": "High" | "Medium" | "Low" | "Very Low" 
}`,

  graph: (ctx) => `Extract scientific entities and their relationships to build a knowledge graph.
Context: ${ctx}
Return JSON: { "entities": [{ "id": string, "label": string, "type": "Concept" | "Method" | "Dataset" | "Author" | "Theory" | "Finding" }], "relations": [{ "source": string, "target": string, "label": "supports" | "contradicts" | "improves" | "inspired_by" | "measured_by" | "uses" }] }`
};
