import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import { resolveEntity, getPaths } from './graphService';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const analyzeText = async (text: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // 1. Extract Entities
  const extractPrompt = `
    Extract exactly two distinct entities (companies/people) from this text that are likely to be in a financial graph.
    Return JSON only: { "entityA": "Name1", "entityB": "Name2" }.
    Text: "${text}"
  `;
  
  let entityA_ID: string | null = null;
  let entityB_ID: string | null = null;
  let extractedNames = { entityA: "", entityB: "" };

  try {
    const result = await model.generateContent(extractPrompt);
    const response = await result.response;
    const jsonStr = response.text().replace(/```json|```/g, "").trim();
    extractedNames = JSON.parse(jsonStr);
    
    entityA_ID = resolveEntity(extractedNames.entityA);
    entityB_ID = resolveEntity(extractedNames.entityB);
  } catch (e) {
    console.error("AI Extraction failed", e);
    return { error: "Failed to extract entities" };
  }

  if (!entityA_ID || !entityB_ID) {
    return { 
      entityA: extractedNames.entityA, 
      entityB: extractedNames.entityB,
      foundPaths: false, 
      explanation: "Could not map one or both entities to the database." 
    };
  }

  // 2. Find Paths
  const paths = getPaths(entityA_ID, entityB_ID, 4);

  // 3. Explain
  if (paths.pathSequence.length === 0) {
    return { entityA: entityA_ID, entityB: entityB_ID, foundPaths: false, explanation: "No direct connection found in current graph." };
  }

  const pathDesc = paths.pathSequence.slice(0, 3).map(p => p.join(" -> ")).join("\n");
  const explainPrompt = `
    Context: A user asked about relationship between ${extractedNames.entityA} and ${extractedNames.entityB}.
    The graph database found these paths:
    ${pathDesc}
    
    Task: Write a short, financial literacy explanation (3 sentences max) connecting the user's text to these specific paths. Explain *why* this connection matters (e.g. risk, dependency). Do not give financial advice.
  `;

  const explainResult = await model.generateContent(explainPrompt);
  
  return {
    entityA: entityA_ID,
    entityB: entityB_ID,
    foundPaths: true,
    paths: paths,
    explanation: explainResult.response.text()
  };
};
