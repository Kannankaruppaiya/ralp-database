import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@/server/auth/jwt';

/** Routes reachable without a session. Everything else requires a login. */
const PUBLIC_PATHS = ['/', '/login', '/admin-login', '/patient-login', '/forgot-password', '/verify', '/update-password'];

const SESSION_COOKIE = 'ralp_session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // API routes enforce their own authentication and return JSON (a 401), so the
  // middleware never redirects them to the HTML login page.
  if (path.startsWith('/api')) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySession(token) : null;

  // Governance console. Authentication alone is not enough: a consultant or
  // registrar must not reach /admin, where they could run a full registry
  // export. The role travels in the signed session token; data access is still
  // enforced by row level security underneath.
  if (claims && path.startsWith('/admin')) {
    if (claims.role !== 'Data Manager') {
      const denied = request.nextUrl.clone();
      denied.pathname = '/dashboard';
      denied.searchParams.set('denied', 'admin');
      return NextResponse.redirect(denied);
    }
  }

  if (!claims && !PUBLIC_PATHS.includes(path)) {
    const login = request.nextUrl.clone();
    login.pathname = path.startsWith('/admin')
      ? '/admin-login'
      : path.startsWith('/assessment') || path.startsWith('/home')
        ? '/patient-login'
        : '/login';
    login.searchParams.set('next', path);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
