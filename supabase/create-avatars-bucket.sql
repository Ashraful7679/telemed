-- =============================================
-- CREATE AVATARS STORAGE BUCKET
-- =============================================
-- Run this only if the avatars bucket doesn't exist

-- Create storage bucket for avatars (ignore if exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- VERIFICATION
-- =============================================
-- Check if bucket was created:
-- SELECT * FROM storage.buckets WHERE id = 'avatars';
