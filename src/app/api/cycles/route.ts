import { NextResponse } from 'next/server';
import { findCycles } from '@/services/pathService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const node = searchParams.get('node');
  const maxDepth = searchParams.get('maxDepth');

  if (!node) {
    return NextResponse.json({ error: 'Missing node parameter' }, { status: 400 });
  }

  const cycles = findCycles(node, maxDepth ? parseInt(maxDepth) : undefined);
  return NextResponse.json(cycles);
}
