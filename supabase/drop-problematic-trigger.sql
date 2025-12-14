-- =============================================
-- DROP PROBLEMATIC TRIGGER
-- =============================================
-- This removes the trigger that's causing the error
-- Run this in Supabase SQL Editor

-- Drop the trigger that's causing issues
DROP TRIGGER IF EXISTS on_profile_role_change ON profiles;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user_role();

-- =============================================
-- Now you can signup without errors!
-- =============================================
