'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { CheckCircle, Calendar, Clock } from 'lucide-react'

export default function PaymentSuccessPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const serial = searchParams.get('serial')
    const time = searchParams.get('time') // e.g., "09:45"
    const duration = searchParams.get('duration') // e.g., "30" (minutes)

    // Calculate end time
    const timeRange = useMemo(() => {
        if (!time) return null

        const durationMinutes = duration ? parseInt(duration) : 30 // Default 30 minutes

        // Parse start time
        const [hours, minutes] = time.split(':').map(Number)
        
        // Create date object for today with start time
        const startDate = new Date()
        startDate.setHours(hours, minutes, 0, 0)
        
        // Calculate end time
        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)
        
        // Format times
        const formatTime = (date: Date) => {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        }

        return {
            start: formatTime(startDate),
            end: formatTime(endDate),
            duration: durationMinutes
        }
    }, [time, duration])

    useEffect(() => {
        // Auto-redirect after 10 seconds
        const timer = setTimeout(() => {
            router.push('/patient/appointments')
        }, 10000)

        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="card-custom text-center">
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="h-16 w-16 text-success-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Payment Successful!
                    </h1>

                    <p className="text-muted-foreground mb-6">
                        Your appointment has been confirmed
                    </p>

                    {serial && timeRange && (
                        <div className="bg-primary-50 rounded-lg p-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">Your Serial Number</div>
                                    <div className="text-4xl font-bold text-primary">#{serial}</div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-center gap-2 text-lg">
                                        <Clock className="h-5 w-5 text-primary" />
                                        <span className="font-semibold">
                                            {timeRange.start} - {timeRange.end}
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Duration: {timeRange.duration} minutes
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-3 border border-primary-200">
                                    <p className="text-sm text-gray-700">
                                        <strong>Important:</strong> Please join the appointment room 15 minutes before your scheduled time
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Link href="/patient/appointments" className="block">
                            <Button className="w-full" size="lg">
                                View My Appointments
                            </Button>
                        </Link>

                        <Link href="/" className="block">
                            <Button variant="secondary" className="w-full">
                                Back to Home
                            </Button>
                        </Link>
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground">
                        Redirecting to appointments in 10 seconds...
                    </p>
                </div>
            </div>
        </div>
    )
}
