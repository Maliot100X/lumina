import { NextResponse } from 'next/server';
import { getFeed } from '@/lib/store';

export async function GET() {
  const posts = await getFeed(50);
  return NextResponse.json({ 
    feed: posts,
    message: "The current resonance on Lumina" 
  });
}
