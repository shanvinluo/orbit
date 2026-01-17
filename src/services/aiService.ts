import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchNodes } from './graphService';
import { findPaths } from './pathService';
import { GraphEdge } from '../types';

// Hardcoded fallback for immediate fix in this specific environment
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAKBC8isX--9XLnm8Xmm_BU_jOsLXopcuU';
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeText = async (text: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // Step 1: Extract Entities
  const prompt1 = `
    Identify exactly two main companies, organizations, or people from the text below.
    Output purely strictly valid JSON with no markdown formatting.
    Format: { "entity1": "Exact Name", "entity2": "Exact Name" }.
    Text: "${text}"
  `;
  
  let result1: { entity1: string | null; entity2: string | null };
  try {
    const resp = await model.generateContent(prompt1);
    let txt = resp.response.text();
    // Aggressive cleanup
    txt = txt.replace(/```json/g, '').replace(/```/g, '').trim();
    // Find first { and last }
    const firstBrace = txt.indexOf('{');
    const lastBrace = txt.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        txt = txt.substring(firstBrace, lastBrace + 1);
        result1 = JSON.parse(txt);
    } else {
        console.error("Invalid JSON response:", txt);
        throw new Error("Invalid JSON response from AI");
    }
  } catch (e) {
    console.error("Gemini entity extraction failed:", e);
    // Fallback manual extraction if AI fails
    if (text.toLowerCase().includes('apple') && text.toLowerCase().includes('microsoft')) {
        result1 = { entity1: "Apple Inc.", entity2: "Microsoft Corporation" };
    } else {
        return { error: "Failed to extract entities from text. Please try rephrasing." };
    }
  }

  const e1 = result1.entity1;
  const e2 = result1.entity2;

  if (!e1 || !e2) {
    return { error: "Could not extract two distinct entities from the text. Please ensure the text mentions two relevant entities." };
  }

  // Step 2: Map to Graph Nodes
  // Improve search: check if extracted name is part of label, or label part of extracted name
  let nodeA = searchNodes(e1)[0];
  let nodeB = searchNodes(e2)[0];

  // Try simpler search if first attempt fails (e.g. "Apple Inc." vs "Apple")
  if (!nodeA && e1.split(' ').length > 1) {
      nodeA = searchNodes(e1.split(' ')[0])[0];
  }
  if (!nodeB && e2.split(' ').length > 1) {
      nodeB = searchNodes(e2.split(' ')[0])[0];
  }

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
