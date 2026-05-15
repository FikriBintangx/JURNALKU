import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'jurnalstar_super_secret_key_123'
);

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { message: 'ID Token is required' },
        { status: 400 }
      );
    }

    // Verify Firebase ID Token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { email, name, uid, picture } = decodedToken;

    if (!email) {
      return NextResponse.json(
        { message: 'Email not found in token' },
        { status: 400 }
      );
    }

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Generate a random password for OAuth users
      const randomPassword = Math.random().toString(36).slice(-16);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: hashedPassword,
        }
      });
    }

    // Generate our system JWT (consistent with manual login)
    const token = await new SignJWT({ 
      userId: user.id, 
      email: user.email,
      name: user.name 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Set Cookie
    const cookieStore = await cookies();
    cookieStore.set('jurnalstar_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return NextResponse.json({
      message: 'Authentication successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error: any) {
    console.error('[AUTH_FIREBASE_ERROR]', error);
    return NextResponse.json(
      { message: 'Authentication failed: ' + (error.message || 'Internal Error') },
      { status: 500 }
    );
  }
}
