# Starfix database authorization and Razorpay checkout

## Current implementation

- The production database has RLS enabled on the public application tables.
- Mentor directory reads use the column-limited `public_mentor_directory` view.
- Authenticated users cannot self-assign profile roles or change their profile email through a profile update.
- Student booking inserts are checked against an active session type and the server-side session price is written to the booking.
- Students may cancel their own bookings but cannot change price, identity, schedule, or mark them completed.
- Mentor artifacts (notes, goals, feedback, shared resources, and follow-ups) require an eligible mentor/student relationship.
- Student access to mentor notes requires `visible_to_student = true`.
- The `payments` table is read-only to authenticated clients. Payment writes are done by the Edge Function.
- `razorpay-payments` supports `create-order`, `verify-payment`, `confirm-free-booking`, and signed `webhook` actions.

## Required Supabase Edge Function secrets

Before using checkout, set these in **Supabase Dashboard → Edge Functions → Secrets** for the Starfix project:

- `RAZORPAY_KEY_ID` — Razorpay TEST key ID
- `RAZORPAY_KEY_SECRET` — matching Razorpay TEST key secret
- `RAZORPAY_WEBHOOK_SECRET` — webhook secret configured in Razorpay
- `PAYMENTS_ALLOWED_ORIGIN` — `https://starfix-website.vercel.app`

Supabase's default `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` must be available to the function. Never put Razorpay secret keys or the service-role key in Vite variables or the browser.

## Razorpay webhook

Configure a Razorpay webhook to call:

`https://mndyaxvkjzzgyvfrxgvm.supabase.co/functions/v1/razorpay-payments?action=webhook`

Subscribe to at least `payment.captured`, `payment.failed`, and `order.paid`. Use the exact same webhook secret as `RAZORPAY_WEBHOOK_SECRET`. The function verifies the HMAC signature over the raw request body and checks the paid amount/currency against the ledger.

## Test before enabling live mode

1. Set TEST keys only.
2. Use a test student account and a paid session.
3. Confirm the browser cannot change amount, currency, student ID, session type, or booking status.
4. Test successful payment, failed payment, checkout dismissal, retry, duplicate webhook delivery, invalid webhook signature, wrong amount, and wrong currency.
5. Verify the booking is confirmed only after verified payment; verify a free session can be confirmed without a payment row.
6. Verify another student's token cannot create or verify the booking's payment.
7. Check admin views show payment status without exposing secret/provider credentials.
8. Only after all tests pass, replace the TEST credentials with live credentials and complete a small real transaction/refund test.

## Known release gates

- Razorpay secrets are not stored in this repository and must be added in the dashboard before live checkout can work.
- Mentor/session names and prices are currently synchronized from the frontend's session catalog; confirm these prices and mentor details with the actual mentors before enabling live payments.
- Supabase Auth leaked-password protection is a dashboard setting and must be enabled manually.
- The public mentor directory view is intentionally a restricted-field view; re-run the Supabase Security Advisor after schema changes and review the `security_definer_view` finding as part of the deployment checklist.
- No claim of production readiness should be made until the test cases above have been executed against the deployed app.
