import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchNodes } from './graphService';
import { findPaths } from './pathService';
import { GraphEdge } from '../types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const analyzeText = async (text: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // Step 1: Extract Entities
  const prompt1 = `
    Extract exactly two main financial entities (companies, people, funds) from the following text.
    Return JSON only: { "entity1": "name", "entity2": "name" }.
    If only one or zero entities are found, return null for the missing entity.
    Text: "${text}"
  `;
  
  let result1: { entity1: string | null; entity2: string | null };
  try {
    const resp = await model.generateContent(prompt1);
    const txt = resp.response.text().replace(/```json|```/g, '').trim();
    result1 = JSON.parse(txt);
  } catch (e) {
    console.error("Gemini entity extraction failed:", e);
    return { error: "Failed to extract entities from text. Please try rephrasing." };
  }

  const e1 = result1.entity1;
  const e2 = result1.entity2;

  if (!e1 || !e2) {
    return { error: "Could not extract two distinct entities from the text. Please ensure the text mentions two relevant entities." };
  }

  // Step 2: Map to Graph Nodes
  const nodeA = searchNodes(e1)[0];
  const nodeB = searchNodes(e2)[0];

  if (!nodeA || !nodeB) {
    const missing = !nodeA ? e1 : e2;
    return { error: `Could not map "${missing}" to a known company in the graph. Please try a different entity.` };
  }

  // Step 3: Find Paths
  const paths = findPaths(nodeA.id, nodeB.id, 4); // Default depth 4

  // Step 4: Explain Connection
  let explanation = "Based on the currently loaded graph, no direct or indirect paths were found between these entities within the specified depth.";
  if (paths.length > 0) {
    const shortestPath = paths[0];
    const pathDescription = shortestPath.nodes.map(nodeId => searchNodes(nodeId)[0]?.label || nodeId).join(" -> ");
    const edgesDescription = shortestPath.edges.map((edge: GraphEdge) => 
      `${searchNodes(edge.source)[0]?.label || edge.source} --(${edge.type})--> ${searchNodes(edge.target)[0]?.label || edge.target}`
    ).join("; ");

    const prompt2 = `
      I found a connection between ${nodeA.label} and ${nodeB.label} in a knowledge graph.
      The shortest path found is: ${pathDescription}.
      The relationships involved are: ${edgesDescription}.
      
      Explain this relationship in 2-3 sentences max, focusing on financial/business implications and "why this might matter" for financial literacy. 
      Strictly reference only the graph data provided. Do not make trading advice.
    `;
    
    try {
      const resp2 = await model.generateContent(prompt2);
      explanation = resp2.response.text();
    } catch (e) {
      console.error("Gemini explanation generation failed:", e);
      explanation = "Failed to generate an explanation. Please try again.";
    }
  }

  return { nodeA, nodeB, paths, explanation };
};
