import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'jurnalstar_super_secret_key_123'
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('jurnalstar_auth_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Get fresh user data from DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { id: true, name: true, email: true }
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
