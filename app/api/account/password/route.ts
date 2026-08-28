import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const MIN_PASSWORD = 12;

export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Sign in to continue.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const newPassword = body?.newPassword;

  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD) {
    return Response.json(
      { error: `Your password must be at least ${MIN_PASSWORD} characters.` },
      { status: 422 }
    );
  }

  // Setting the password and clearing the flag happen together, server-side.
  // Clearing it from the browser would need an RLS policy letting a user update
  // their own profile row, and that policy would also let them clear the flag
  // without ever changing the password.
  const admin = supabaseAdmin();

  const { error } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) return Response.json({ error: error.message }, { status: 502 });

  const { error: flagError } = await admin
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', user.id);
  if (flagError) return Response.json({ error: flagError.message }, { status: 502 });

  return Response.json({ ok: true });
}
