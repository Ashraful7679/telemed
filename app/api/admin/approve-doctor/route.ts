import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { doctorId, status } = await request.json()

        if (!doctorId || !status) {
            return NextResponse.json(
                { error: 'Missing doctorId or status' },
                { status: 400 }
            )
        }

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be approved or rejected' },
                { status: 400 }
            )
        }

        // Use service role key for admin operations (bypasses RLS)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        )

        // Update doctor status
        const { data, error } = await supabase
            .from('doctors')
            .update({ status })
            .eq('id', doctorId)
            .select()

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true, data })
    } catch (err: any) {
        console.error('Server error:', err)
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
