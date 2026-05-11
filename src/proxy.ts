import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'jurnalstar_super_secret_key_123'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Izinkan akses ke file statis, API auth, dan halaman login/register itu sendiri
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    return NextResponse.next();
  }

  // 2. Ambil token dari cookie
  const token = request.cookies.get('jurnalstar_auth_token')?.value;

  // 3. Jika tidak ada token, lempar ke halaman REGISTER (Sesuai permintaan: "arahkan ke form register")
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/register';
    return NextResponse.redirect(url);
  }

  try {
    // 4. Verifikasi token
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    // Jika token tidak valid/expired, hapus cookie dan lempar ke login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('jurnalstar_auth_token');
    return response;
  }
}

export default proxy;

// Terapkan middleware ke semua halaman kecuali folder public/api tertentu
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
