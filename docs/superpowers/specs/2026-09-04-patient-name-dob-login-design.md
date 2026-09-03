# Patient login by name and date of birth

**Status:** approved 2026-09-04

## The problem

The patient portal signs in through `POST /api/auth/login`, the same
email-and-password route the clinicians use. A patient therefore cannot log in
until an administrator has separately provisioned an account for them with an
email address and a password — registering the patient in `/patients/new` is not
enough. That second step is the reason patients do not reach the portal, and the
PROMs questionnaires (IPSS, SHIM, continence) that depend on it go uncompleted.

The registration form already collects, as mandatory fields, the three things a
patient reliably knows about themselves: first name, surname and date of birth.
They are stored on `patients` as `first_name`, `surname` and `date_of_birth`.

## The decision

Patients sign in with **first name + surname + date of birth**, and nothing
else. As soon as a clinician or administrator has created the patient record,
that patient can sign in. There is no account-provisioning step and no
backfill: the design works for patients who already exist as well as for new
ones.

This was a product decision taken with the confidentiality trade-off stated and
understood. None of the three fields is a secret — they appear on any clinic
letter — so anyone who knows a patient can reach that patient's record,
including PSA, Gleason grade and the potency and continence scores. The
mitigation carried in this design is a brute-force throttle, which is a floor
rather than a substitute for a secret. Revisit this if the registry ever holds
data whose exposure would be reportable.

## How it works

### The route

A new `POST /api/auth/patient-login`, separate from the clinician route so that
neither has to carry a branch on which credential shape it was given.

The body is `{ firstName, surname, dateOfBirth }`, validated with zod. The
lookup runs on a privileged connection, matching case-insensitively on the two
names and exactly on the date.

Only `Deceased` patients are refused. `Discharged` and `Under Surveillance` are
not: the follow-up schedule runs to thirty-six months and those patients may
still owe PROMs, so locking them out would quietly defeat the purpose of the
change.

Three outcomes:

| Matches | Response | Why |
| :--- | :--- | :--- |
| 0 | 401, one generic message | Never reveal which of the three fields was wrong, and never reveal whether a person is in the registry at all. |
| 2 or more | 409, asking them to contact the clinic | Two patients can share a name and a birthday. Choosing one of them would open the wrong person's oncology record — a clinical safety incident, not a UX inconvenience. |
| exactly 1 | 200, session started | |

### The session

The patient's account row is created on first sign-in rather than at
registration, so one code path serves existing and new patients alike.

On a successful match the route ensures a `users` row and a `profiles` row exist
for that patient — role `Patient`, `patient_id` pointing at the matched record.
The `users.email` is the patient's own if the record carries one, otherwise a
synthetic `patient+<patientId>@ralp.local`, since the column is `not null
unique`. The `password_hash` is stored as the literal `disabled`, which
`verifyPassword` rejects because it does not carry the `scrypt$` scheme — so
this account can never be used against the email-and-password route.

Everything downstream is then unchanged. `startSession(profileId, 'Patient')`
issues the same JWT, `loadProfile` reads the same `profiles` row, row level
security keeps scoping on `auth.uid()`, and the middleware's route gate and the
patient home page need no edits.

The alternative — carrying `patientId` in the JWT and teaching the session,
profile and RLS layers to resolve a patient without a profile row — was
rejected. It touches every authorisation surface in the application for no gain.

### The throttle

Because the credential is not a secret, guessing is the realistic attack. Ten
failed attempts from one IP address in fifteen minutes returns 429.

The counter is an in-process map. The deployment runs a single container, so
this holds; it is marked with a `ponytail:` comment naming the ceiling and the
upgrade path, which is to move the counter into a table if the application is
ever run as more than one instance.

### The form

`app/(patient)/patient-login/page.tsx` swaps its email and password inputs for
First Name, Surname and Date of Birth, and posts to the new route. The "SMS
Magic Code" tab is left exactly as it is — it already reports that NHS Notify is
not enabled for this deployment.

## Tests

One test file covering the behaviour that would hurt if it broke:

- one matching patient signs in and receives a `Patient` session
- no match returns 401 and starts no session
- two patients sharing a name and date of birth return 409 and start no session
- a deceased patient cannot sign in
- an account created by patient sign-in cannot be used on `/api/auth/login`

The throttle is tested on its own, at unit level, rather than by driving eleven
requests through the route: the counting and the window are the parts that can
break, and they are pure.

## Out of scope

Patient self-registration, changing how clinicians authenticate, and enabling
the SMS route.
