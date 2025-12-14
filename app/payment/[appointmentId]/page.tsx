'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRequireAuth } from '@/lib/auth/hooks'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { assignSerialNumber, formatBDT } from '@/lib/utils/appointment'
import { Calendar, Clock, User, CreditCard, Smartphone } from 'lucide-react'

// Mock payment processing functions (replace with actual gateway integration)
const processBkashPayment = async (amount: number) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    return {
        success: true,
        transactionId: `BKS${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    }
}

const processNagadPayment = async (amount: number) => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    return {
        success: true,
        transactionId: `NGD${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    }
}

const processRocketPayment = async (amount: number) => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    return {
        success: true,
        transactionId: `RKT${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    }
}

const processCardPayment = async (amount: number) => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    return {
        success: true,
        transactionId: `CRD${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    }
}

interface Appointment {
    id: string
    appointment_date: string
    amount_bdt: number
    payment_deadline: string
    patient_notes: string | null
    doctor_id: string
    doctors: {
        id: string
        profiles: {
            full_name: string
        }
        specializations: {
            name: string
        }
    }
    availability_slots: {
        slot_date: string
        start_time: string
        end_time: string
        appointment_duration: number
    }
}

export default function PaymentPage() {
    const params = useParams()
    const router = useRouter()
    const appointmentId = params.appointmentId as string
    const { user, loading: authLoading } = useRequireAuth('patient')
    const supabase = createClient()

    const [appointment, setAppointment] = useState<Appointment | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'card'>('bkash')
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        if (user) {
            fetchAppointment()
        }
    }, [user, appointmentId])

    const fetchAppointment = async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    doctor_id,
                    doctors!appointments_doctor_id_fkey (
                        id,
                        profiles!doctors_id_fkey (
                            full_name
                        ),
                        specializations (
                            name
                        )
                    ),
                    availability_slots (
                        slot_date,
                        start_time,
                        end_time,
                        appointment_duration
                    )
                `)
                .eq('id', appointmentId)
                .eq('patient_id', user?.id)
                .single()

            if (error) throw error
            if (!data) throw new Error('Appointment not found')

            // Check if already paid
            if (data.payment_status === 'paid') {
                router.push('/patient/appointments')
                return
            }

            // Check if payment deadline passed
            const deadline = new Date(data.payment_deadline)
            if (deadline < new Date()) {
                setError('Payment deadline has passed. This appointment has been cancelled.')
                return
            }

            setAppointment(data)
        } catch (err: any) {
            console.error('Error fetching appointment:', err)
            setError(err.message || 'Failed to load appointment')
        } finally {
            setLoading(false)
        }
    }

    const handlePayment = async () => {
        if (!appointment) return

        setProcessing(true)
        setError(null)

        try {
            // In production, this would integrate with actual payment gateways
            // For now, we'll simulate successful payment

            // Call payment gateway API based on method
            let paymentResult

            switch (paymentMethod) {
                case 'bkash':
                    paymentResult = await processBkashPayment(appointment.amount_bdt)
                    break
                case 'nagad':
                    paymentResult = await processNagadPayment(appointment.amount_bdt)
                    break
                case 'rocket':
                    paymentResult = await processRocketPayment(appointment.amount_bdt)
                    break
                case 'card':
                    paymentResult = await processCardPayment(appointment.amount_bdt)
                    break
            }

            if (paymentResult.success) {
                // Assign serial number and update appointment
                const { serialNumber, exactTime, duration } = await assignSerialNumber(appointmentId)

                // Create payment record
                await supabase.from('payments').insert([{
                    appointment_id: appointmentId,
                    patient_id: user?.id,
                    doctor_id: appointment.doctor_id,
                    total_amount: appointment.amount_bdt,
                    amount_bdt: appointment.amount_bdt,
                    admin_commission: appointment.amount_bdt * 0.1, // 10% commission
                    doctor_earnings: appointment.amount_bdt * 0.9,
                    payment_method: paymentMethod,
                    payment_status: 'completed',
                    transaction_id: paymentResult.transactionId,
                    paid_at: new Date().toISOString()
                }])

                // Redirect to success page with duration
                router.push(`/payment/success?serial=${serialNumber}&time=${exactTime}&duration=${duration}`)
            } else {
                throw new Error(paymentResult.error || 'Payment failed')
            }
        } catch (err: any) {
            console.error('Payment error:', err)
            setError(err.message || 'Payment processing failed')
        } finally {
            setProcessing(false)
        }
    }

    // Simulated payment gateway functions (replace with actual integrations)
    const processBkashPayment = async (amount: number) => {
        // TODO: Integrate with bKash API
        await new Promise(resolve => setTimeout(resolve, 2000))
        return { success: true, transactionId: `BKS${Date.now()}` }
    }

    const processNagadPayment = async (amount: number) => {
        // TODO: Integrate with Nagad API
        await new Promise(resolve => setTimeout(resolve, 2000))
        return { success: true, transactionId: `NGD${Date.now()}` }
    }

    const processRocketPayment = async (amount: number) => {
        // TODO: Integrate with Rocket API
        await new Promise(resolve => setTimeout(resolve, 2000))
        return { success: true, transactionId: `RKT${Date.now()}` }
    }

    const processCardPayment = async (amount: number) => {
        // TODO: Integrate with Card payment gateway (e.g., SSLCommerz)
        await new Promise(resolve => setTimeout(resolve, 2000))
        return { success: true, transactionId: `CRD${Date.now()}` }
    }

    if (authLoading || loading) {
        return <LoadingSpinner size="lg" className="min-h-screen" />
    }

    if (error || !appointment) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Payment Error</h1>
                    <p className="mt-2 text-muted-foreground">{error || 'Appointment not found'}</p>
                    <Link href="/patient/appointments" className="mt-4 inline-block">
                        <Button>Back to Appointments</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const deadline = new Date(appointment.payment_deadline)
    const appointmentDate = new Date(appointment.appointment_date)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b bg-white shadow-sm">
                <div className="container-custom flex h-16 items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary-900">Complete Payment</h1>
                    <Link href="/patient/appointments">
                        <Button variant="secondary" size="sm">Cancel</Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container-custom py-8">
                <div className="mx-auto max-w-2xl space-y-6">
                    {/* Appointment Details */}
                    <div className="card-custom">
                        <h2 className="mb-4 text-xl font-semibold text-gray-900">Appointment Details</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Dr. {appointment.doctors.profiles.full_name}</span>
                                <span className="text-sm">({appointment.doctors.specializations.name})</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{appointmentDate.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                    {appointment.availability_slots.start_time} - {appointment.availability_slots.end_time}
                                    <span className="ml-2 text-sm">
                                        ({appointment.availability_slots.appointment_duration} min per patient)
                                    </span>
                                </span>
                            </div>
                            {appointment.patient_notes && (
                                <div className="mt-3 rounded bg-gray-50 p-3">
                                    <p className="text-sm"><strong>Your Notes:</strong> {appointment.patient_notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Amount */}
                    <div className="card-custom bg-primary-50">
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-medium">Total Amount</span>
                            <span className="text-3xl font-bold text-primary">{formatBDT(appointment.amount_bdt)}</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Pay before: {deadline.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    {/* Payment Methods */}
                    <div className="card-custom">
                        <h2 className="mb-4 text-xl font-semibold text-gray-900">Select Payment Method</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                onClick={() => setPaymentMethod('bkash')}
                                className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${paymentMethod === 'bkash'
                                        ? 'border-primary bg-primary-50'
                                        : 'border-gray-200 hover:border-primary-300'
                                    }`}
                            >
                                <Smartphone className="h-6 w-6 text-pink-600" />
                                <div className="text-left">
                                    <div className="font-semibold">bKash</div>
                                    <div className="text-xs text-muted-foreground">Mobile Payment</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('nagad')}
                                className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${paymentMethod === 'nagad'
                                        ? 'border-primary bg-primary-50'
                                        : 'border-gray-200 hover:border-primary-300'
                                    }`}
                            >
                                <Smartphone className="h-6 w-6 text-orange-600" />
                                <div className="text-left">
                                    <div className="font-semibold">Nagad</div>
                                    <div className="text-xs text-muted-foreground">Mobile Payment</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('rocket')}
                                className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${paymentMethod === 'rocket'
                                        ? 'border-primary bg-primary-50'
                                        : 'border-gray-200 hover:border-primary-300'
                                    }`}
                            >
                                <Smartphone className="h-6 w-6 text-purple-600" />
                                <div className="text-left">
                                    <div className="font-semibold">Rocket</div>
                                    <div className="text-xs text-muted-foreground">Mobile Payment</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${paymentMethod === 'card'
                                        ? 'border-primary bg-primary-50'
                                        : 'border-gray-200 hover:border-primary-300'
                                    }`}
                            >
                                <CreditCard className="h-6 w-6 text-blue-600" />
                                <div className="text-left">
                                    <div className="font-semibold">Card</div>
                                    <div className="text-xs text-muted-foreground">Debit/Credit Card</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-md bg-destructive-50 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {/* Pay Button */}
                    <Button
                        onClick={handlePayment}
                        isLoading={processing}
                        disabled={processing}
                        className="w-full"
                        size="lg"
                    >
                        {processing ? 'Processing Payment...' : `Pay ${formatBDT(appointment.amount_bdt)}`}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        🔒 Secure payment powered by {paymentMethod.toUpperCase()}
                    </p>
                </div>
            </main>
        </div>
    )
}
