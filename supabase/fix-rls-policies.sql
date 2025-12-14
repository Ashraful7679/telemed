-- =============================================
-- SIMPLE FIX FOR SIGNUP ISSUES
-- =============================================
-- Run this in Supabase SQL Editor to fix signup errors

-- First, temporarily disable RLS on profiles to allow signup
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies that work
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- For doctors table - drop existing policies first
DROP POLICY IF EXISTS "Anyone can view approved doctors" ON doctors;
DROP POLICY IF EXISTS "Doctors can view own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can update own profile" ON doctors;
DROP POLICY IF EXISTS "Admins can view all doctors" ON doctors;
DROP POLICY IF EXISTS "Admins can update all doctors" ON doctors;
DROP POLICY IF EXISTS "Allow doctor creation" ON doctors;

-- Create new simple policies
CREATE POLICY "Allow doctor creation"
  ON doctors FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view approved doctors"
  ON doctors FOR SELECT
  USING (status = 'approved' OR auth.uid() = id);

-- =============================================
-- VERIFICATION
-- =============================================
-- After running this, try signing up again
-- The signup should work now!
