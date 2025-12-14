import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const supabase: SupabaseClient<Database> = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
