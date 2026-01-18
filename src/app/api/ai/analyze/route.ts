import { NextResponse } from 'next/server';
import { analyzeText, analyzeNews, analyzeGeneralFinance } from '@/services/aiService';

export async function POST(request: Request) {
  try {
    const { text, type } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // If type is 'news', use news analysis
    if (type === 'news') {
      const result = await analyzeNews(text);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 200 });
      }
      return NextResponse.json({ ...result, analysisType: 'news' });
    }
    
    // If type is 'general', use general finance Q&A
    if (type === 'general') {
      const result = await analyzeGeneralFinance(text);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 200 });
      }
      return NextResponse.json({ ...result, analysisType: 'general' });
    }

    // Default to relationship analysis
    const result = await analyzeText(text);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 200 });
    }
    return NextResponse.json({ ...result, analysisType: 'relationship' });
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
