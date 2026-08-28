import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Routes reachable without a session. Everything else requires a login. */
const PUBLIC_PATHS = ['/', '/login', '/admin-login', '/patient-login', '/forgot-password', '/verify', '/change-password'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Refreshes an expiring session cookie on every request.
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, must_change_password, deactivated_at')
      .eq('id', user.id)
      .maybeSingle();

    // A clinician deactivated mid-shift would otherwise keep working until
    // their access token expired.
    if (profile?.deactivated_at) {
      await supabase.auth.signOut();
      const login = request.nextUrl.clone();
      login.pathname = '/login';
      login.search = '';
      login.searchParams.set('deactivated', '1');
      return NextResponse.redirect(login);
    }

    if (profile?.must_change_password && path !== '/change-password') {
      const change = request.nextUrl.clone();
      change.pathname = '/change-password';
      change.search = '';
      return NextResponse.redirect(change);
    }

    // Governance console. Authentication alone is not enough: row level
    // security already hides the audit trail from non-admins, but without this
    // a consultant or registrar could still open /admin and run a full registry
    // export, which RLS permits them to read.
    if (path.startsWith('/admin') && profile?.role !== 'Data Manager') {
      const denied = request.nextUrl.clone();
      denied.pathname = '/dashboard';
      denied.searchParams.set('denied', 'admin');
      return NextResponse.redirect(denied);
    }
  }

  if (!user && !PUBLIC_PATHS.includes(path)) {
    const login = request.nextUrl.clone();
    login.pathname = path.startsWith('/admin')
      ? '/admin-login'
      : path.startsWith('/assessment') || path.startsWith('/home')
        ? '/patient-login'
        : '/login';
    login.searchParams.set('next', path);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
