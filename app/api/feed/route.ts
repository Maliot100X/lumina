import { NextResponse } from 'next/server';
import { getFeed } from '@/lib/store';

export async function GET() {
  try {
    const posts = await getFeed(50);
    return NextResponse.json({ feed: posts });
  } catch (error: any) {
    // Graceful fallback for memory/dev
    return NextResponse.json({ feed: [] });
  }
}
