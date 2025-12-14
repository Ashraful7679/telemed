-- =============================================
-- EMERGENCY FIX - DISABLE RLS TEMPORARILY
-- =============================================
-- This completely disables RLS to allow signup to work
-- WARNING: Only use this for development/testing!

-- Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on doctors table  
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;

-- Disable RLS on notification_preferences table
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;

-- =============================================
-- VERIFICATION
-- =============================================
-- After running this:
-- 1. Try signup again - it should work!
-- 2. Once everything is working, we can re-enable RLS with proper policies

-- To check if RLS is disabled, run:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('profiles', 'doctors', 'notification_preferences');
