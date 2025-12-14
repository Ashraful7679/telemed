# Debugging "Failed to Fetch" Error

## Check These in Browser Console (F12)

When you click "Approve" or "Reject", check the console for:

1. **"Approving doctor:"** - Shows the doctor ID being approved
2. **"Approve response:"** - Shows the Supabase response
3. **Any error messages** - Will show the actual error

## Common Causes

### 1. Supabase Not Connected
**Check:** Console should show Supabase URL and key
**Fix:** Make sure `.env.local` has correct credentials

### 2. RLS Still Enabled
**Check:** Error message will mention "row-level security"
**Fix:** Run `complete-fix.sql` in Supabase SQL Editor

### 3. Network/CORS Issue
**Check:** Console shows "CORS" or "network" error
**Fix:** Check Supabase project settings

### 4. Invalid Doctor ID
**Check:** Console shows the doctor ID
**Fix:** Make sure doctor exists in database

## Quick Test

1. Open browser console (F12)
2. Go to http://localhost:3000/admin/approve-doctors
3. Click "Approve" on a doctor
4. **Copy all console output** and share it

The console will tell us exactly what's failing!
