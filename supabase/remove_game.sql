-- BACK UP BEFORE RUNNING
-- This script removes all Droo/game, coin wallets, and reels legacy tables, functions, and storage policies from Supabase.

BEGIN;

-- 1. Drop Game Tables & Constraints
DROP TABLE IF EXISTS public.round_entries CASCADE;
DROP TABLE IF EXISTS public.rounds CASCADE;
DROP TABLE IF EXISTS public.game_rounds CASCADE;
DROP TABLE IF EXISTS public.game_participants CASCADE;
DROP TABLE IF EXISTS public.game_winners CASCADE;
DROP TABLE IF EXISTS public.coin_transactions CASCADE;
DROP TABLE IF EXISTS public.coin_wallets CASCADE;
DROP TABLE IF EXISTS public.droo_entries CASCADE;
DROP TABLE IF EXISTS public.droo_rounds CASCADE;

-- 2. Drop Reels Table (if migrating from old social feeds)
DROP TABLE IF EXISTS public.reels CASCADE;

-- 3. Drop RPC Functions related to Droo / Game / Coins
DROP FUNCTION IF EXISTS public.join_round(bigint, integer);
DROP FUNCTION IF EXISTS public.join_round(uuid, integer);
DROP FUNCTION IF EXISTS public.mark_results_seen();
DROP FUNCTION IF EXISTS public.admin_overview();
DROP FUNCTION IF EXISTS public.admin_credit_coins(uuid, numeric);
DROP FUNCTION IF EXISTS public.admin_credit_coins(text, numeric);
DROP FUNCTION IF EXISTS public.deduct_coins(uuid, numeric);
DROP FUNCTION IF EXISTS public.award_coins(uuid, numeric, text);
DROP FUNCTION IF EXISTS public.draw_game_winner(uuid);
DROP FUNCTION IF EXISTS public.draw_round_winner(bigint);

-- 4. Clean up any storage objects & policies for reels
DO $$
BEGIN
  DELETE FROM storage.objects WHERE bucket_id = 'reels';
  DELETE FROM storage.buckets WHERE id = 'reels';
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

COMMIT;
