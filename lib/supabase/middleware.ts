import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export function createSupabaseServerClient(req: NextRequest) {
  const supabase: SupabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false
      }
    }
  );
  return supabase;
}

export async function updateSession(req: NextRequest) {
  const supabase = createSupabaseServerClient(req);

  // Get user (optional, just to verify session)
  await supabase.auth.getUser();

  return NextResponse.next();
}
