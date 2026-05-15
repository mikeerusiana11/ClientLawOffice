# Admin Hardening Changes

Security and logic fixes to the admin portal and `/api/admin/*` routes.

## Why

Pre-change, the admin portal had several issues:

- Auth middleware was defined in `src/proxy.ts`, which Next.js does not load — only `src/middleware.ts` is recognized. Result: `/admin` and every `/api/admin/*` route was publicly reachable.
- `attorney-availability` routes used the browser/anon Supabase client server-side, so writes silently failed under RLS.
- Email templates interpolated client-supplied fields (`clientName`, `notes`, etc.) directly into HTML — vulnerable to template injection / phishing once routes were reachable.
- `/api/admin/enroll` returned a freshly generated password in the JSON response and was unused.
- Blocking an unavailable slot did not update conflicting appointments — the data and the email were inconsistent.
- The conflict list was trusted from the request body (race window between check and block).

## Files added

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Real Next.js middleware. Auth-guards `/admin`, `/client`, and `/api/admin/*`. Redirects HTML routes; returns 401/403 JSON for API routes. |
| `src/lib/supabase-admin.ts` | Cached service-role Supabase client for admin server routes. |
| `src/lib/html.ts` | `escapeHtml()` helper and shared `EMAIL_FROM` constant. |

## Files modified

| File | Change |
|------|--------|
| `src/app/api/admin/appointment/route.ts` | Dropped the `auth.admin.listUsers()` lookup (no client login). Status validated against an allowlist; defaults to `Confirmed`. Uses service-role client. |
| `src/app/api/admin/attorney-availability/route.ts` | Service-role client. Re-queries conflicts inside the handler. Marks conflicting appointments as `Needs Reschedule`. Upserts the slot row. Forwards cookies on the self-fetch so middleware passes. |
| `src/app/api/admin/attorney-availability/check-conflicts/route.ts` | Service-role client. |
| `src/app/api/admin/attorney-availability/send-notifications/route.ts` | (No structural change — escape HTML and switch sender; see email routes below.) |
| `src/app/api/admin/send-confirmation/route.ts` | All interpolated values run through `escapeHtml()`. Sender switched to `appointments@millerlawoffice.me`. |
| `src/app/api/admin/send-reschedule/route.ts` | Same: HTML escaping + new sender. |

## Files deleted

| File | Reason |
|------|--------|
| `src/proxy.ts` | Replaced by `src/middleware.ts`. |
| `src/app/api/admin/enroll/route.ts` | No client enrollment in this app. Eliminates the password-leak path. |
| `src/app/components/dashboard/AdminEnrollClient.tsx` | Dead component, never wired into the admin page. |

## Required env vars

In `.env.local` (and on the deployment platform):

```
ADMIN_EMAIL=<the email Abigail uses to log in to Supabase auth>
NEXT_PUBLIC_SITE_URL=https://<your-prod-domain>   # used by the reschedule email button
```

> `NEXT_PUBLIC_*` values are bundled into the browser. Drop the `NEXT_PUBLIC_` prefix from `ADMIN_EMAIL` if it is not actually consumed by client code.

After editing `.env.local`, restart `npm run dev`. On Vercel/Netlify/etc., add the same vars in the host's environment-variable settings and redeploy.

## Required SQL (run in Supabase SQL Editor)

```sql
-- 1. Allow 'Needs Reschedule' as a status value.
--    If `appointments.status` has a CHECK constraint or enum, extend it:

-- For a CHECK-constrained text column (adjust constraint name as shown in your schema):
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('Requested', 'Confirmed', 'Cancelled', 'Completed', 'Needs Reschedule'));

-- 2. Prevent duplicate unavailable-slot rows and enable upsert.
CREATE UNIQUE INDEX IF NOT EXISTS attorney_unavailable_slots_date_time_idx
  ON public.attorney_unavailable_slots (date, time);
```

If `status` is a Postgres enum instead of a CHECK column, use:

```sql
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'Needs Reschedule';
```

## Resend domain

`millerlawoffice.me` is verified in Resend (DKIM, SPF, MX all green). All admin-side emails now send from `Miller Law Office <appointments@millerlawoffice.me>`.

## Deployment checklist

- [ ] `ADMIN_EMAIL` set to the real admin email in `.env.local` and on the host.
- [ ] `NEXT_PUBLIC_SITE_URL` set to the production URL on the host.
- [ ] SQL migrations above run against the production database.
- [ ] Service-role and Resend API keys rotated (keys were exposed during development).
- [ ] `.env.local` is in `.gitignore` before pushing to any remote.
- [ ] Smoke test: log in as admin, confirm an appointment, block a slot with an existing booking, verify the email arrives and the appointment status flipped to `Needs Reschedule`.
- [ ] Negative test: log out, hit `/api/admin/appointment` with curl — expect `401 Unauthorized`.

## Known follow-ups (not blocking)

- The `attorney-availability` POST still self-fetches `send-notifications` over HTTP. Cookie forwarding makes it work behind the middleware, but extracting the email send into a shared lib function would be cleaner.
- `appointment.attorney` is still hardcoded to `'Abigail Miller'`. Move to config alongside `ADMIN_EMAIL` if you ever add another attorney.
- Several admin components are exported from `components/admin/index.ts` but never rendered (`AdminAppointmentsTable`, `AdminWeeklyList`, `AdminHistory`). Worth deleting once you confirm they're unused.
