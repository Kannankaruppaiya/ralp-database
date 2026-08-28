# Admin-provisioned accounts

**Date:** 2026-08-29
**Status:** Approved, not yet implemented

## Problem

Anyone who reaches the deployment sees three sign-in doors — clinician, patient,
and admin — and none of them can be used, because no account can be created from
inside the application. `app/(admin)/admin/users/page.tsx` already renders a
complete "Invite Clinical Staff" form, but its submit handler only raises a toast
saying invites are not wired up: creating a login needs the Supabase service role
key, and that key must never reach the browser. Accounts are provisioned by hand
in the Supabase dashboard instead.

The registry should have one public door. An administrator signs in, provisions
clinicians from the admin console, and each clinician signs in with credentials
that only they know.

## Requirements

1. The landing page offers administrator sign-in only.
2. Clinicians and patients still sign in; their pages are reachable by direct URL
   but are not advertised on the landing page. There is no self-service signup.
3. An administrator creates a clinician account from the admin console, setting a
   temporary password that is communicated out of band.
4. A clinician must change that password before reaching any other page.
5. An administrator can deactivate an account, reactivate it, or delete it.

## Design

### Provisioning route

`POST app/api/admin/staff/route.ts`, body
`{ fullName, email, role, surgeonCode?, gmcNumber?, tempPassword }`.

1. Read the caller's session from cookies. No session → **401**.
2. Read the caller's own `profiles.role`. Not `Data Manager` → **403**.
3. Validate the body: well-formed email, `role` within the `user_role` enum,
   `surgeonCode` within `surgeon_code` when present, `tempPassword` at least 12
   characters.
4. `auth.admin.createUser({ email, password: tempPassword, email_confirm: true })`
   using a service-role client constructed inside the route.
5. Upsert the `profiles` row on `id`, setting `full_name`, `role`,
   `surgeon_code`, `gmc_number`, and `must_change_password = true`. A signup
   trigger already writes this row today, so the write usually updates rather
   than inserts; upserting means the route still finishes if that trigger is
   ever changed or removed, instead of creating a login with no profile — the
   exact state that makes `signIn` fail with "No profile is provisioned".
6. Append an `audit_log` entry naming the administrator and the account created.
7. Respond with the created profile. The password is never echoed back.

Step 2 carries the authorisation on its own. `middleware.ts` guards pages, not
route handlers, so a route that trusted a caller-supplied role would hand account
creation to anyone who could shape an HTTP request.

The key lives in `SUPABASE_SERVICE_ROLE_KEY`, a Vercel environment variable
without the `NEXT_PUBLIC_` prefix, imported only by route handlers.

### Forced password change

A migration adds `must_change_password boolean not null default false` to
`profiles`. The default leaves existing accounts untouched; only the provisioning
route sets it true.

`middleware.ts` redirects an authenticated request to `/change-password` whenever
the flag is set and the path is not already `/change-password`.

The new page posts to `POST app/api/account/password/route.ts`, which verifies the
session, sets the new password, and clears the flag — all server-side, in one
place.

Clearing the flag from the browser would need an RLS policy letting a user update
their own `profiles` row. That policy would also let them clear the flag without
ever changing the password. Keeping both writes in one server route leaves the
existing policies — `own profile readable`, `admin reads profiles`,
`admin writes profiles` — untouched.

### Deactivating and deleting accounts

Two operations, because they answer different questions. A clinician who leaves
the department should stop being able to sign in while everything they recorded
stays attributable. An account created by mistake should disappear.

**Deactivate** — `POST app/api/admin/staff/[id]/deactivate/route.ts`, and the
matching reactivate. The route bans the auth user so sign-in fails, and stamps
`profiles.deactivated_at`. Reactivating lifts the ban and clears the stamp.

A migration adds `deactivated_at timestamptz` to `profiles`. The admin list reads
it through the policies it already uses, so showing who is active costs no extra
call. `middleware.ts` treats a stamped profile as signed out and redirects to the
login page — without that, a clinician deactivated mid-shift keeps working until
their access token expires.

**Delete** — `DELETE app/api/admin/staff/[id]/route.ts`. Removes the auth user and
the `profiles` row.

Deleting does not damage the audit trail. `audit_log` stores `actor_name`,
`actor_role`, and `gmc_number` as non-null snapshots taken when each entry is
written, and `actor_id` is nullable. The history still reads "Mr R. D. MacDonagh,
Consultant Surgeon" after the account is gone; only the link back to a live row is
lost. Delete nulls `actor_id` and leaves every other column untouched.

Both routes carry the same session and `Data Manager` checks as provisioning, and
both refuse when the target is the caller: an administrator who deactivates or
deletes their own account locks everyone out of the console, and no other door
grants admin.

The admin console asks for confirmation before either, and names deletion as
permanent. Deactivate is offered first.

### Entry surface

The landing page drops the clinician and patient sign-in calls to action and keeps
the administrator one. `/login` and `/patient-login` remain in `PUBLIC_PATHS` and
work when opened directly.

The "Quick Autofill Test Account" buttons come out of `/login` and `/admin-login`.
They are development scaffolding, and on a client-facing deployment they publish
the names of real accounts.

## Errors

| Condition | Status |
|---|---|
| No session | 401 |
| Caller is not a Data Manager | 403 |
| Email already registered | 409 |
| Body fails validation | 422 |
| Target of a deactivate or delete is the caller | 409 |
| Target account does not exist | 404 |

The admin console surfaces the response message through the toast it already uses.

## Testing

A test file covering the provisioning route's authorisation: a request with no
session is rejected, a request from a non-admin session is rejected, and a request
from a Data Manager creates the account and sets the flag.

The same authorisation cases cover the deactivate, reactivate, and delete routes,
plus the self-target refusal: an administrator cannot deactivate or delete their
own account.

Manually: provision a clinician, sign in as them, confirm the redirect to
`/change-password`, change the password, and confirm the next sign-in goes
straight through. Then deactivate that clinician while their session is live and
confirm the next page they open sends them to the login page, reactivate and
confirm they get back in, and finally delete them and confirm their name still
reads correctly in the audit log.

## Out of scope

Email invitations, which would need SMTP that the project does not yet have.
Password complexity rules beyond a length floor. Bulk import of an existing staff
list.
