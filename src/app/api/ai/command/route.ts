import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadGraph, searchNodes } from '@/services/graphService';
import { EdgeType } from '@/types';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAKBC8isX--9XLnm8Xmm_BU_jOsLXopcuU';
const genAI = new GoogleGenerativeAI(API_KEY);

// Types for AI commands
export type AICommandType = 'search' | 'filter' | 'find_path' | 'clear_filter' | 'none';

export interface AICommand {
  type: AICommandType;
  params: {
    companyName?: string;
    companyId?: string;
    edgeTypes?: string[];
    fromCompany?: string;
    fromId?: string;
    toCompany?: string;
    toId?: string;
  };
  explanation: string;
}

export interface AICommandResponse {
  command: AICommand;
  message: string;
}

// Helper function to generate content with model fallback
const generateContentWithFallback = async (prompt: string): Promise<string> => {
  const modelNames = ['gemini-2.0-flash-exp', 'gemini-2.0-flash'];
  let lastError: any;
  
  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const resp = await model.generateContent(prompt);
      return resp.response.text();
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      lastError = e;
      
      if (!errorMsg.includes('404') && !errorMsg.includes('not found') && !errorMsg.includes('models/')) {
        throw e;
      }
      console.warn(`Model ${modelName} failed, trying next:`, errorMsg);
    }
  }
  
  throw new Error(`All models failed: ${lastError?.message}`);
};

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Load graph data for context
    const graphData = loadGraph();
    const companyNames = graphData.nodes.map(n => n.label).slice(0, 150);
    const edgeTypes = Object.values(EdgeType);

    const prompt = `
You are an AI assistant for a financial graph visualization tool called Orbit. Analyze the user's request and determine if they want to perform one of these actions:

1. **search** - Focus on/select a specific company in the graph
   Examples: "Show me Apple", "Find Microsoft", "Look up Tesla", "Select NVIDIA", "Go to Amazon"

2. **filter** - Show only specific types of relationships
   Examples: "Show only ownership relationships", "Filter to suppliers", "Hide partnerships", "Only show client relationships"
   Available relationship types: ${edgeTypes.join(', ')}

3. **find_path** - Find the shortest path/connection between two companies
   Examples: "Find the path from Apple to Microsoft", "How is Tesla connected to NVIDIA", "Show connection between Amazon and Google", "What's the relationship chain from Meta to AMD"

4. **clear_filter** - Reset filters to show all relationships
   Examples: "Show all relationships", "Clear filters", "Reset view", "Show everything"

5. **none** - Not a command, just a question or conversation
   Examples: "What is a P/E ratio?", "Tell me about Apple", "How does the stock market work?"

Available companies in the database (use EXACT names):
${companyNames.join(', ')}

User request: "${text}"

Respond with ONLY valid JSON (no markdown):
{
  "type": "search|filter|find_path|clear_filter|none",
  "params": {
    "companyName": "Company name if searching (use exact name from list)",
    "edgeTypes": ["EDGE_TYPE"] // Array of edge types if filtering
    "fromCompany": "Start company if finding path",
    "toCompany": "End company if finding path"
  },
  "explanation": "Brief explanation of what action you're taking",
  "message": "Friendly message to show the user"
}
`;

    let txt = await generateContentWithFallback(prompt);
    
    // Clean up JSON
    txt = txt.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = txt.indexOf('{');
    const lastBrace = txt.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      return NextResponse.json({
        command: { type: 'none', params: {}, explanation: 'Could not parse response' },
        message: "I couldn't understand that command. Try asking me to search for a company, filter relationships, or find a path between two companies."
      });
    }
    
    txt = txt.substring(firstBrace, lastBrace + 1);
    const result = JSON.parse(txt);
    
    // Map company names to IDs
    const command: AICommand = {
      type: result.type || 'none',
      params: {},
      explanation: result.explanation || ''
    };
    
    if (result.type === 'search' && result.params?.companyName) {
      const matches = searchNodes(result.params.companyName);
      if (matches.length > 0) {
        command.params.companyName = matches[0].label;
        command.params.companyId = matches[0].id;
      } else {
        return NextResponse.json({
          command: { type: 'none', params: {}, explanation: 'Company not found' },
          message: `I couldn't find "${result.params.companyName}" in the database. Try a different company name.`
        });
      }
    }
    
    if (result.type === 'find_path') {
      if (result.params?.fromCompany) {
        const fromMatches = searchNodes(result.params.fromCompany);
        if (fromMatches.length > 0) {
          command.params.fromCompany = fromMatches[0].label;
          command.params.fromId = fromMatches[0].id;
        } else {
          return NextResponse.json({
            command: { type: 'none', params: {}, explanation: 'From company not found' },
            message: `I couldn't find "${result.params.fromCompany}" in the database.`
          });
        }
      }
      
      if (result.params?.toCompany) {
        const toMatches = searchNodes(result.params.toCompany);
        if (toMatches.length > 0) {
          command.params.toCompany = toMatches[0].label;
          command.params.toId = toMatches[0].id;
        } else {
          return NextResponse.json({
            command: { type: 'none', params: {}, explanation: 'To company not found' },
            message: `I couldn't find "${result.params.toCompany}" in the database.`
          });
        }
      }
    }
    
    if (result.type === 'filter' && result.params?.edgeTypes) {
      // Validate edge types
      const validTypes = result.params.edgeTypes.filter((t: string) => 
        edgeTypes.includes(t as EdgeType)
      );
      command.params.edgeTypes = validTypes.length > 0 ? validTypes : undefined;
      
      if (!command.params.edgeTypes) {
        return NextResponse.json({
          command: { type: 'none', params: {}, explanation: 'Invalid edge types' },
          message: `I couldn't understand which relationship types you want to filter. Available types: ${edgeTypes.join(', ')}`
        });
      }
    }
    
    return NextResponse.json({
      command,
      message: result.message || result.explanation
    });
    
  } catch (error: any) {
    console.error('AI Command error:', error);
    return NextResponse.json({
      command: { type: 'none', params: {}, explanation: 'Error' },
      message: 'Sorry, I had trouble processing that command. Please try again.'
    }, { status: 200 });
  }
}
