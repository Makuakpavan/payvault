-- Create new enum types
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "TxType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'BONUS', 'ADJUSTMENT');
CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "PromoBonusMode" AS ENUM ('SET_TO_100', 'ADD_100');

-- Users
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "balance" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "promoCodeId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastAppliedPromo" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;

-- Promo tables
CREATE TABLE IF NOT EXISTS "PromoCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "usageLimit" INTEGER,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "isSingleUse" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "bonusMode" "PromoBonusMode" NOT NULL DEFAULT 'SET_TO_100',
  "note" TEXT,
  CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PromoRedemption" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "promoCodeId" TEXT NOT NULL,
  "bonusAmount" BIGINT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AdminAdjustment" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" BIGINT NOT NULL,
  "originalCurrency" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CurrencyRate" (
  "id" TEXT NOT NULL,
  "base" TEXT NOT NULL,
  "rates" JSONB NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "requestedBy" TEXT,
  CONSTRAINT "CurrencyRate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminAdjustment" ADD CONSTRAINT "AdminAdjustment_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminAdjustment" ADD CONSTRAINT "AdminAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CurrencyRate" ADD CONSTRAINT "CurrencyRate_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "PromoCode_code_key" ON "PromoCode"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "PromoRedemption_userId_promoCodeId_key" ON "PromoRedemption"("userId", "promoCodeId");
CREATE INDEX IF NOT EXISTS "PromoCode_code_idx" ON "PromoCode"("code");
CREATE INDEX IF NOT EXISTS "PromoRedemption_userId_createdAt_idx" ON "PromoRedemption"("userId", "createdAt");

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "amountUsd" BIGINT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "promoCodeId" TEXT;
