// middleware.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Initialize response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client using auth-helpers (Edge compatible)
  const supabase = createRouteHandlerClient({
    cookies: request.cookies,
    headers: request.headers,
    // optional: pass env vars if needed
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  })

  // Fetch the user (session)
  await supabase.auth.getUser()

  return response
}
