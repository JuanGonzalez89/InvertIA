-- Migration: add phone, country, cbu to users
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS cbu TEXT;

-- OPTIONAL: Create indexes if needed
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ===== Seed data (example) =====
-- Replace EMAIL_PLACEHOLDER with the real email to seed (e.g. juanignaciogonzalez.ca@gmail.com)
-- Run these statements in your production DB (psql / Supabase SQL editor)

-- 1) Insert a test user (will be linked by email by getCurrentUser() on first login)
INSERT INTO users (id, "externalAuthId", name, email, "avatarUrl", "investorType", "baseCurrency", "createdAt", "updatedAt")
VALUES (
  'user_seed_juan',
  'seed_juan_external',
  'Juan Ignacio (seed)',
  'EMAIL_PLACEHOLDER',
  NULL,
  'MODERADO',
  'ARS',
  now(),
  now()
)
ON CONFLICT (email) DO NOTHING;

-- 2) Insert sample assets
INSERT INTO assets (id, symbol, name, type, market, currency, "yahooSymbol", "cedearRatio", "underlyingSymbol")
VALUES
  ('asset_nvda', 'NVDA', 'NVIDIA Corporation', 'STOCK', 'NASDAQ', 'USD', 'NVDA', NULL, NULL),
  ('asset_vist', 'VIST', 'Vista Energy', 'STOCK', 'BCBA', 'ARS', NULL, NULL, NULL),
  ('asset_tx26', 'TX26', 'Bono TX26', 'BOND', 'BCBA', 'ARS', NULL, NULL, NULL),
  ('asset_ypf', 'YPF', 'YPF S.A.', 'STOCK', 'BCBA', 'ARS', NULL, NULL, NULL)
ON CONFLICT (symbol) DO NOTHING;

-- 3) Cash balance for the seeded user
INSERT INTO cash_balances (id, "userId", currency, amount, "createdAt", "updatedAt")
VALUES ('cash_seed_1','user_seed_juan','ARS', 420000, now(), now())
ON CONFLICT ("userId", currency) DO UPDATE SET amount = EXCLUDED.amount, "updatedAt" = now();

-- 4) Positions (holdings)
INSERT INTO positions (id, "userId", "assetId", quantity, "avgPrice", currency, "createdAt", "updatedAt")
VALUES
  ('pos_nvda_1','user_seed_juan','asset_nvda', 12, 32000, 'ARS', now(), now()),
  ('pos_vist_1','user_seed_juan','asset_vist', 50, 8200, 'ARS', now(), now()),
  ('pos_tx26_1','user_seed_juan','asset_tx26', 1000, 950, 'ARS', now(), now())
ON CONFLICT ("userId", "assetId") DO UPDATE SET quantity = EXCLUDED.quantity, "avgPrice" = EXCLUDED."avgPrice", "updatedAt" = now();

-- 5) Transactions (sample recent orders)
INSERT INTO transactions (id, "userId", "assetId", type, quantity, price, total, currency, date, source, notes, "createdAt")
VALUES
  ('txn_1','user_seed_juan','asset_nvda','BUY',2,38500,77000,'ARS', now() - interval '10 days','DEMO','Seeded buy',now()),
  ('txn_2','user_seed_juan','asset_tx26','BUY',500,950,475000,'ARS', now() - interval '14 days','DEMO','Seeded buy',now())
ON CONFLICT (id) DO NOTHING;

-- 6) Quick verification queries (run after applying seed):
-- SELECT * FROM users WHERE email = 'EMAIL_PLACEHOLDER';
-- SELECT * FROM positions WHERE userId = 'user_seed_juan';
-- SELECT * FROM cash_balances WHERE userId = 'user_seed_juan';

-- Notes:
-- - Replace EMAIL_PLACEHOLDER with the email you want seeded (or the user's real email).
-- - The inserted externalAuthId is a placeholder; when the real user logs in via Clerk, `getCurrentUser` will find by email and update `externalAuthId` to the Clerk id.
-- - If your DB requires UUIDs in a different format remove/adjust ids accordingly.
-- - Run this file in a maintenance window; backups recommended.
