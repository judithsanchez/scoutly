import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    // Check database connection by getting the client and sending a ping
    const client = await clientPromise;
    await client.db('admin').command({ ping: 1 });
    return NextResponse.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ status: 'error', database: 'disconnected' }, { status: 503 });
  }
}
