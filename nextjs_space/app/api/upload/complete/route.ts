import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { cloud_storage_path, isPublic } = body;

    if (!cloud_storage_path) {
      return NextResponse.json({ error: 'Missing cloud_storage_path' }, { status: 400 });
    }

    return NextResponse.json({ success: true, cloud_storage_path, isPublic });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to complete upload' }, { status: 500 });
  }
}
