-- =============================================
-- ADD PROFILE FIELDS
-- =============================================
-- Add gender, date of birth, address, and city to profiles table

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- =============================================
-- VERIFICATION
-- =============================================
-- Check if columns were added:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('gender', 'date_of_birth', 'address', 'city');
