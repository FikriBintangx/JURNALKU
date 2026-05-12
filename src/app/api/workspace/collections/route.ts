import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'session_workspace';

    const collections = await prisma.researchCollection.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { documents: true } }
      }
    });

    return NextResponse.json({ collections });
  } catch (error: any) {
    console.error('[API_WORKSPACE_COLLECTIONS] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId = 'session_workspace', name, color } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const collection = await prisma.researchCollection.create({
      data: {
        userId,
        name,
        color: color || 'yellow'
      }
    });

    return NextResponse.json({ collection });
  } catch (error: any) {
    console.error('[API_WORKSPACE_COLLECTIONS_CREATE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
