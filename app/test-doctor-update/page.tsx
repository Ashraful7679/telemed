'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function TestDoctorUpdatePage() {
    const [result, setResult] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const testFetchDoctors = async () => {
        setLoading(true)
        setResult('Testing...')

        try {
            // Test 1: Fetch pending doctors
            const { data: doctors, error: fetchError } = await supabase
                .from('doctors')
                .select('id, status')
                .eq('status', 'pending')
                .limit(1)

            console.log('Fetch result:', { doctors, fetchError })

            if (fetchError) {
                setResult(`Fetch Error: ${fetchError.message}`)
                setLoading(false)
                return
            }

            if (!doctors || doctors.length === 0) {
                setResult('No pending doctors found. Create a doctor account first.')
                setLoading(false)
                return
            }

            const doctorId = doctors[0].id

            // Test 2: Try to update doctor status
            const { data: updateData, error: updateError } = await supabase
                .from('doctors')
                .update({ status: 'approved' } as any)
                .eq('id', doctorId)
                .select()

            console.log('Update result:', { updateData, updateError })

            if (updateError) {
                setResult(`Update Error: ${updateError.message}`)
            } else {
                setResult(`Success! Updated doctor ${doctorId} to approved`)
            }
        } catch (err: any) {
            console.error('Caught error:', err)
            setResult(`Exception: ${err.message}`)
        }

        setLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md card-custom">
                <h1 className="text-2xl font-bold mb-4">Test Doctor Update</h1>

                <Button
                    onClick={testFetchDoctors}
                    isLoading={loading}
                    disabled={loading}
                    className="w-full"
                >
                    Test Approve Doctor
                </Button>

                {result && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-md">
                        <pre className="text-sm whitespace-pre-wrap">{result}</pre>
                    </div>
                )}

                <div className="mt-4 text-sm text-muted-foreground">
                    <p>This will:</p>
                    <ol className="list-decimal ml-4 mt-2">
                        <li>Fetch a pending doctor</li>
                        <li>Try to update their status to approved</li>
                        <li>Show any errors</li>
                    </ol>
                    <p className="mt-2">Check browser console (F12) for detailed logs.</p>
                </div>
            </div>
        </div>
    )
}
