# PayVault – multi-currency wallet (Next.js + TypeScript + Prisma + PostgreSQL)

## Run it
1. `npm install`
2. `cp .env.example .env` and fill in `DATABASE_URL` (Supabase/Neon/local Postgres) and `AUTH_SECRET` (`openssl rand -base64 32`)
3. `npm run db:push` to create the tables
4. `npm run dev` then open http://localhost:3000
npm
## What's included
Signup/login (bcrypt + signed httpOnly cookie), per-currency wallets, deposit page with currency select,
withdrawals that start as PENDING, payment history, responsive light/dark UI.

## Money rules built in
- Amounts are stored as integers in minor units (kobo/cents).
- Every movement is a `Transaction` row with a unique `reference` (idempotency: double clicks can't double-credit).
- Balance changes and transaction rows are written in one database transaction; withdrawals use a conditional decrement so a balance can't go negative.

## Before real money
- **Deposits are simulated** (credited instantly). For real payments: make `/api/deposit` create a PENDING deposit, redirect to Paystack/Flutterwave checkout with the reference, and let `/api/webhooks/paystack` (included, HMAC-verified) complete it. Set `PAYSTACK_SECRET_KEY`.
- **Withdrawals stay PENDING** until an admin reviews them at `/admin` (Approve = Completed, Reject = Failed + refund). Approving does not send real money: connect a payout API (Paystack Transfers, Flutterwave Payouts) before you rely on it.
- Add email verification, rate limiting, 2FA/withdrawal PIN, KYC, and an audit log.

## Admin
1. Sign up normally, then run `npm run db:push` (adds the role column) and `npm run make-admin -- you@example.com`.
2. Log in again: an **Admin** button appears on the dashboard, opening `/admin`.
