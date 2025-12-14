# Solution: Failed to Fetch on Doctor Approval

## The Problem

- ✅ Supabase SELECT works (can read data)
- ❌ Supabase UPDATE fails with "Failed to fetch"

This indicates a **Supabase API or network issue** with write operations.

## Solution: Use Server-Side API Route

Since client-side updates are failing, we'll create a server-side API route that uses the service role key.

### Step 1: Create API Route

Create `app/api/admin/approve-doctor/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { doctorId, status } = await request.json()

    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data, error } = await supabase
      .from('doctors')
      .update({ status })
      .eq('id', doctorId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

### Step 2: Update Approve-Doctors Page

Change the approve/reject functions to call the API route instead of direct Supabase:

```typescript
const handleApprove = async (doctorId: string) => {
  setActionLoading(doctorId)
  
  try {
    const response = await fetch('/api/admin/approve-doctor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId, status: 'approved' })
    })

    const result = await response.json()

    if (!response.ok) {
      alert('Error: ' + result.error)
    } else {
      alert('Doctor approved successfully!')
      fetchPendingDoctors()
    }
  } catch (err: any) {
    alert('Error: ' + err.message)
  }

  setActionLoading(null)
}
```

## Why This Works

- Server-side routes don't have CORS issues
- Service role key has full permissions
- Bypasses client-side network problems
- More secure (admin operations on server)

## Alternative: Check Supabase Project

If you want to fix the root cause:

1. Go to Supabase Dashboard
2. Check if project is on free tier (might have limits)
3. Check if there are any active incidents
4. Try creating a new project and migrating

The API route solution is the recommended approach for admin operations anyway!
