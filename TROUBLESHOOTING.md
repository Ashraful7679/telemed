# Troubleshooting "Failed to Fetch" Error

## Quick Fix Steps

### 1. Check if `.env.local` exists

Open your terminal and run:
```bash
cd C:\Users\group\.gemini\antigravity\scratch\telemedicine-platform
dir .env.local
```

If it says "File Not Found", create it:
```bash
copy .env.example .env.local
```

### 2. Verify Environment Variables

Visit: **http://localhost:3002/test-supabase**

This will show you:
- ✅ If Supabase URL is loaded
- ✅ If Supabase Key is loaded
- ✅ If connection works

### 3. If Variables Show "NOT SET"

**Option A: Copy from .env.example**
```bash
copy .env.example .env.local
```

**Option B: Create .env.local manually**

Create a file named `.env.local` in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ftrdchtrurezywsyztsu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cmRjaHRydXJlenl3c3l6dHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDQ3MTksImV4cCI6MjA4MTIyMDcxOX0.Ai28YOLg3TugepVClmIAwIjYyRnpASitVvCW3ciMC-U
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cmRjaHRydXJlenl3c3l6dHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0NDcxOSwiZXhwIjoyMDgxMjIwNzE5fQ.32MtYXpPyQYt9SRgca69hPJ8dlekaPXqhcS-9uqCVgs
```

### 4. Restart Dev Server

**IMPORTANT:** After creating/updating `.env.local`, you MUST restart:

```bash
# Stop the current server (Ctrl+C)
# Then run:
npm run dev
```

### 5. Run Database Scripts

Make sure you've run the database scripts in Supabase:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run `supabase/schema.sql` (copy entire file, paste, click Run)
5. Run `supabase/rls-policies.sql` (copy entire file, paste, click Run)

### 6. Test Again

1. Visit: http://localhost:3002/test-supabase
2. Click "Test Connection"
3. Should see "Supabase is connected successfully!"

Then try signup again at: http://localhost:3002/signup/patient

## Common Issues

### "Failed to fetch" = Environment variables not loaded
- Solution: Create `.env.local` and restart server

### "Invalid API key" = Wrong credentials
- Solution: Copy correct values from Supabase Dashboard

### "relation 'profiles' does not exist" = Database not set up
- Solution: Run the SQL scripts in Supabase

### "Row Level Security policy violation" = RLS policies not applied
- Solution: Run `rls-policies.sql` in Supabase

## Still Not Working?

Check the browser console (F12) for detailed error messages and share them.
