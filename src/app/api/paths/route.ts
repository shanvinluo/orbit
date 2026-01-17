import { NextResponse } from 'next/server';
import { findPaths } from '@/services/pathService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const depth = searchParams.get('depth');

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from or to parameters' }, { status: 400 });
  }

  const paths = findPaths(from, to, depth ? parseInt(depth) : undefined);
  return NextResponse.json(paths);
}
