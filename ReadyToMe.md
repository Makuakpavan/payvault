# PayVault – Ready-to-Host Guide

This document covers the exact steps to take so your PayVault app can be hosted online, secured, and launched with a custom domain.

## 1) Prepare the app for deployment

### 1.1 Install dependencies

```bash
npm install
```

### 1.2 Create environment variables

Create a `.env` file in the project root.

Example:

```env
DATABASE_URL="postgresql://username:password@host:5432/payvault?schema=public"
AUTH_SECRET="replace_with_a_strong_random_secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For production, replace `http://localhost:3000` with your live domain, for example:

```env
NEXT_PUBLIC_APP_URL="https://payvault.example.com"
```

### 1.3 Generate a strong auth secret

```bash
openssl rand -base64 32
```

Use that value as `AUTH_SECRET`.

### 1.4 Sync database schema

```bash
npx prisma db push
```

If you want a migration history as well:

```bash
npx prisma migrate dev --name init
```

### 1.5 Run the app locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

If everything loads correctly, the app is ready for deployment.

---

## 2) Choose a hosting provider

You can host this app on any Node.js-compatible platform. The easiest are:

- Vercel (recommended for Next.js)
- Render
- Railway
- DigitalOcean App Platform
- Fly.io

For a Next.js app like this, Vercel is the easiest and most reliable option.

---

## 3) Deploy to Vercel (recommended)

### 3.1 Push your project to GitHub

1. Create a GitHub repository.
2. Push your project:

```bash
git init
git add .
git commit -m "Initial PayVault deployment setup"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 3.2 Import the project in Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import the repository
5. Keep the default Next.js settings
6. Add the environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_APP_URL`
7. Click "Deploy"

Vercel will build and deploy the app automatically.

---

## 4) Use a production database

Your app needs a real PostgreSQL database in production.

Good choices:

- Supabase Postgres
- Neon Postgres
- Railway Postgres
- Render Postgres
- DigitalOcean Managed Postgres

### Example database setup with Supabase

1. Create a Supabase project
2. Copy the connection string
3. Paste it into `DATABASE_URL`
4. Run:

```bash
npx prisma db push
```

Use the production database URL in Vercel environment variables.

---

## 5) Set up your custom domain

### 5.1 Buy a domain name

Popular domain providers:

- Namecheap
- Porkbun
- Cloudflare Registrar
- GoDaddy
- Google Domains (if still available in your region)

### Good domain strategy

Use a clean brandable domain such as:

- `payvault.com`
- `payvault.ng`
- `payvault.finance`
- `payvault.app`
- `yourbrandwallet.com`

### 5.2 Add to Vercel

1. In Vercel, open your project
2. Go to "Settings" → "Domains"
3. Add your domain name
4. Follow Vercel’s DNS instructions

### 5.3 Configure DNS

Common setup:

- A record or CNAME record to Vercel
- Cloudflare is recommended for easy DNS management

Example:

- `www` → CNAME → `cname.vercel-dns.com`
- root domain (`@`) → A record → Vercel IPs

If you use Cloudflare:

1. Add the domain to Cloudflare
2. Update nameservers
3. In Vercel, add the domain and confirm DNS records

---

## 6) Make the app production-safe

Before going live, confirm the following:

- `DATABASE_URL` is production-ready
- `AUTH_SECRET` is strong and secret
- app is using HTTPS only
- cookie settings are secure in production
- no mock or test promo system is enabled in production
- admin accounts are protected
- you have a valid fallback if payment provider APIs are not configured

---

## 7) Add real payment providers (optional but important)

This app currently contains simulated deposit and payout logic. To go fully live:

### Recommended providers

- Paystack for Africa
- Flutterwave for Africa
- Stripe for international payments

### Required setup

1. Create an account with the provider
2. Generate secret keys and public keys
3. Add them to environment variables
4. Replace the simulated hooks with live checkout/payment webhooks

Example keys:

```env
PAYSTACK_SECRET_KEY="sk_test_xxx"
PAYSTACK_PUBLIC_KEY="pk_test_xxx"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxx"
```

---

## 8) Set up a custom admin account

After deployment, create your first admin user:

1. Sign up through the app normally
2. Run:

```bash
npm run make-admin -- you@example.com
```

Example:

```bash
npm run make-admin -- admin@yourdomain.com
```

Then log in again and the admin dashboard will be available.

---

## 9) Test before launch

Before going public, test:

1. Signup and login
2. Promo code generation with `PV-...`
3. Deposit flow
4. Dashboard balance updates
5. Admin actions
6. User suspension/removal flow
7. Withdrawal flow
8. Database writes and reads
9. HTTPS domain is working

---

## 10) Final launch steps

1. Deploy to Vercel
2. Add production `DATABASE_URL`
3. Add `AUTH_SECRET`
4. Set `NEXT_PUBLIC_APP_URL` to your custom domain
5. Purchase or connect your domain name
6. Add DNS records to Vercel
7. Wait for SSL to be issued automatically
8. Test the live website in a browser
9. Open the app and verify login/signup/admin flows
10. Put your app into production and monitor logs

---

## 11) Suggested production setup checklist

- [ ] Production PostgreSQL database created
- [ ] `.env` values set correctly in Vercel
- [ ] `npx prisma db push` ran successfully
- [ ] GitHub repo connected
- [ ] Live domain purchased
- [ ] DNS configured
- [ ] SSL certificate active
- [ ] Admin account created
- [ ] Payment provider configured
- [ ] App tested in live environment

---

## 12) Quick command summary

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL and AUTH_SECRET
npx prisma db push
npm run dev
```

For hosted deployment:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

Then deploy on Vercel and connect your domain.

---

## 13) Best domain and brand recommendation

If you want a strong professional online presence, pick a domain that matches the product and is easy to remember.

Examples:

- `payvault.com`
- `payvault.africa`
- `payvault.ng`
- `vaultpay.io`
- `cashvault.africa`

Use a domain with:

- short name
- easy spelling
- no confusing hyphens
- industry relevance

---

## 14) Recommended next upgrade

Once the app is live:

- add real bank transfer or card payment API
- add email verification
- add admin audit logs
- add rate-limited API protection
- add analytics and crash monitoring

---

This app is ready for hosting once your database, environment variables, and live domain are configured correctly.
