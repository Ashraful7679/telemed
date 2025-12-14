'use client'

import { createClient } from '@/lib/supabase/client'

export default function TestSupabasePage() {
    const testConnection = async () => {
        const supabase = createClient()

        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

        try {
            const { data, error } = await supabase.from('profiles').select('count').limit(1)

            if (error) {
                console.error('Supabase Error:', error)
                alert('Supabase Error: ' + error.message)
            } else {
                console.log('Supabase Connected!', data)
                alert('Supabase is connected successfully!')
            }
        } catch (err: any) {
            console.error('Connection Error:', err)
            alert('Connection Error: ' + err.message)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
                <h1 className="mb-4 text-2xl font-bold">Supabase Connection Test</h1>

                <div className="mb-4 space-y-2 text-sm">
                    <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</p>
                    <p><strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET ✓' : 'NOT SET ✗'}</p>
                </div>

                <button
                    onClick={testConnection}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                    Test Connection
                </button>

                <div className="mt-6 rounded-md bg-yellow-50 p-4 text-sm">
                    <p className="font-semibold">If you see "NOT SET":</p>
                    <ol className="ml-4 mt-2 list-decimal space-y-1">
                        <li>Make sure `.env.local` exists</li>
                        <li>Copy values from `.env.example`</li>
                        <li>Restart the dev server</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}
