# Debugging "Failed to Fetch" Error

## The Problem

"TypeError: Failed to fetch" means the browser cannot connect to Supabase. This is NOT an RLS issue.

## Common Causes

### 1. Wrong Supabase URL or API Key

**Check your `.env.local` file:**
- Make sure `NEXT_PUBLIC_SUPABASE_URL` is correct
- Make sure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

**To verify:**
1. Go to Supabase Dashboard → Project Settings → API
2. Compare the values in `.env.local` with the dashboard
3. Make sure there are no extra spaces or quotes

### 2. Supabase Project is Paused

- Go to your Supabase Dashboard
- Check if the project is active (not paused)
- Free tier projects pause after inactivity

### 3. Network/CORS Issue

- Check browser console for CORS errors
- Make sure you're using the correct Supabase project

### 4. Environment Variables Not Loaded

After updating `.env.local`, you MUST restart the dev server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Quick Fix Steps

### Step 1: Verify Supabase Credentials

Open `.env.local` and check:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
```

### Step 2: Test Connection

Visit: http://localhost:3000/test-supabase

This will show if Supabase URL and key are loaded correctly.

### Step 3: Restart Dev Server

```bash
# Stop current server
# Run:
npm run dev
```

### Step 4: Check Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Make sure it's active (not paused)
4. Go to Settings → API
5. Copy the URL and anon key
6. Update `.env.local` if different

## If Still Not Working

1. **Create a new Supabase project** (if current one is broken)
2. **Update `.env.local`** with new credentials
3. **Run database scripts** (`schema.sql`)
4. **Restart dev server**

## The Real Issue

The error happens during the `.update()` call, which means:
- ✅ Supabase client is created
- ✅ Can read from database (fetch works)
- ❌ Cannot write to database (update fails)

This suggests:
- Network timeout during write
- Supabase project issue
- Wrong API key (read-only instead of anon key)

**Most likely:** Wrong API key or paused project.
