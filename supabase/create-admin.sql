-- ============================================
-- CREATE DEFAULT ADMIN ACCOUNT
-- ============================================
-- 
-- IMPORTANT: This script creates a default admin account for initial setup.
-- You should change the password immediately after first login!
--
-- Default Credentials:
-- Email: admin@telemed.com
-- Password: Admin@123456
--
-- ============================================

-- Step 1: First, you need to create the user in Supabase Auth
-- Go to Supabase Dashboard > Authentication > Users > Add User
-- OR use the Supabase API/SDK to create the user

-- Step 2: After creating the auth user, get the user ID and run this:
-- (Replace 'USER_ID_FROM_SUPABASE_AUTH' with the actual UUID)

-- Create admin profile
INSERT INTO profiles (id, email, full_name, role, is_blocked, created_at, updated_at)
VALUES (
    'USER_ID_FROM_SUPABASE_AUTH', -- Replace with actual user ID from Supabase Auth
    'admin@telemed.com',
    'System Administrator',
    'admin',
    false,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- ============================================
-- ALTERNATIVE: Upgrade Existing User to Admin
-- ============================================
-- If you already created an account through the signup page,
-- you can upgrade it to admin with this query:

-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

-- ============================================
-- VERIFICATION
-- ============================================
-- Verify the admin account was created:

-- SELECT id, email, full_name, role, is_blocked, created_at
-- FROM profiles
-- WHERE role = 'admin';
