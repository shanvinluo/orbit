import { NextResponse } from 'next/server';
import { analyzeText, analyzeNews } from '@/services/aiService';

export async function POST(request: Request) {
  try {
    const { text, type } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // If type is 'news', use news analysis, otherwise use regular analysis
    if (type === 'news') {
      const result = await analyzeNews(text);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 200 });
      }
      return NextResponse.json({ ...result, analysisType: 'news' });
    }

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
