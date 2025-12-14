'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/hooks'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getAvatarUrl } from '@/lib/utils/avatar'
import { User, Award, Briefcase, MapPin, Phone, Mail, Calendar, Clock, DollarSign } from 'lucide-react'

interface DoctorProfile {
    id: string
    full_name: string
    email: string
    phone: string | null
    gender: string | null
    avatar_url: string | null
    city: string | null
}

interface DoctorInfo {
    specialization_id: string
    experience_years: number
    medical_license_number: string
    qualifications: string | null
    bio: string | null
    status: string
    specializations: {
        name: string
    }
}

interface AvailabilitySlot {
    id: string
    slot_date: string
    start_time: string
    end_time: string
    consultation_fee: number
    appointment_duration: number
    max_appointments: number
    allow_same_day_booking: boolean
    is_available: boolean
    booked_count?: number
}

export default function DoctorProfilePage() {
    const params = useParams()
    const router = useRouter()
    const doctorId = params.id as string
    const supabase = createClient()
    const { user } = useAuth()

    const [profile, setProfile] = useState<DoctorProfile | null>(null)
    const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Booking state
    const [selectedDate, setSelectedDate] = useState('')
    const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([])
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
    const [bookingNotes, setBookingNotes] = useState('')
    const [payNow, setPayNow] = useState(true)
    const [bookingLoading, setBookingLoading] = useState(false)
    const [bookingError, setBookingError] = useState<string | null>(null)
    const [bookingSuccess, setBookingSuccess] = useState(false)

    useEffect(() => {
        if (doctorId) {
            fetchDoctor()
            fetchAvailableSlots()
        }
    }, [doctorId])

    const fetchDoctor = async () => {
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', doctorId)
                .eq('role', 'doctor')
                .single()

            if (profileError) throw profileError
            if (!profileData) {
                setError('Doctor not found')
                setLoading(false)
                return
            }

            setProfile(profileData)

            const { data: doctorData, error: doctorError } = await supabase
                .from('doctors')
                .select('*, specializations(name)')
                .eq('id', doctorId)
                .single()

            if (doctorError) throw doctorError
            if (!doctorData) {
                setError('Doctor information not found')
                setLoading(false)
                return
            }

            if (doctorData.status !== 'approved') {
                setError('This doctor profile is not available')
                setLoading(false)
                return
            }

            setDoctorInfo(doctorData)
        } catch (err: any) {
            console.error('Error fetching doctor:', err)
            setError(err.message || 'Failed to load doctor profile')
        } finally {
            setLoading(false)
        }
    }

    const fetchAvailableSlots = async () => {
        try {
            // Fetch all upcoming slots (next 30 days)
            const today = new Date().toISOString().split('T')[0]
            const thirtyDaysLater = new Date()
            thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
            const maxDate = thirtyDaysLater.toISOString().split('T')[0]

            const { data, error } = await supabase
                .from('availability_slots')
                .select('*')
                .eq('doctor_id', doctorId)
                .gte('slot_date', today)
                .lte('slot_date', maxDate)
                .order('slot_date', { ascending: true })
                .order('start_time', { ascending: true })

            if (error) throw error

            // Get booked count for each slot
            const slotsWithCount = await Promise.all(
                (data || []).map(async (slot: any) => {
                    const { count } = await supabase
                        .from('appointments')
                        .select('*', { count: 'exact', head: true })
                        .eq('slot_id', slot.id)
                        .in('payment_status', ['paid', 'pending'])
                        .not('status', 'eq', 'cancelled')

                    return {
                        ...slot,
                        booked_count: count || 0
                    } as AvailabilitySlot
                })
            )

            // Filter out full slots and validate 48-hour rule
            const todayStr = new Date().toISOString().split('T')[0]
            const filteredSlots = slotsWithCount.filter((slot: AvailabilitySlot) => {
                // Check capacity
                if ((slot.booked_count || 0) >= slot.max_appointments) {
                    return false
                }

                // Check 48-hour rule for non-same-day slots
                if (slot.slot_date === todayStr && !slot.allow_same_day_booking) {
                    const slotDateTime = new Date(`${slot.slot_date}T${slot.start_time}`)
                    const now = new Date()
                    const hoursDiff = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
                    return hoursDiff >= 48
                }

                return true
            })

            setAvailableSlots(filteredSlots)
        } catch (err: any) {
            console.error('Error fetching slots:', err)
        }
    }

    const handleBookAppointment = async () => {
        if (!user) {
            router.push('/login')
            return
        }

        if (!selectedSlot) {
            setBookingError('Please select a time slot')
            return
        }

        setBookingLoading(true)
        setBookingError(null)

        try {
            // Calculate payment deadline
            const appointmentDateTime = new Date(`${selectedSlot.slot_date}T${selectedSlot.start_time}`)
            let paymentDeadline: Date

            if (selectedSlot.allow_same_day_booking) {
                // For same-day slots, deadline is appointment time
                paymentDeadline = appointmentDateTime
            } else {
                // For regular slots, deadline is 48 hours before appointment
                paymentDeadline = new Date(appointmentDateTime.getTime() - (48 * 60 * 60 * 1000))
            }

            // Create appointment (no serial number yet - assigned after payment)
            const { data: appointment, error: appointmentError } = await supabase
                .from('appointments')
                .insert([{
                    patient_id: user.id,
                    doctor_id: doctorId,
                    slot_id: selectedSlot.id,
                    appointment_date: appointmentDateTime.toISOString(),
                    status: payNow ? 'pending_payment' : 'reserved',
                    payment_status: 'pending',
                    payment_deadline: paymentDeadline.toISOString(),
                    amount_bdt: selectedSlot.consultation_fee,
                    patient_notes: bookingNotes || null,
                }])
                .select()
                .single()

            if (appointmentError) throw appointmentError

            setBookingSuccess(true)
            setSelectedSlot(null)
            setBookingNotes('')

            if (payNow) {
                // Redirect to payment page
                setTimeout(() => {
                    router.push(`/payment/${appointment.id}`)
                }, 1500)
            } else {
                // Show success message and redirect to appointments
                setTimeout(() => {
                    router.push('/patient/appointments')
                }, 2000)
            }
        } catch (err: any) {
            console.error('Booking error:', err)
            setBookingError(err.message || 'Failed to book appointment')
        } finally {
            setBookingLoading(false)
        }
    }

    if (loading) {
        return <LoadingSpinner size="lg" className="min-h-screen" />
    }

    if (error || !profile || !doctorInfo) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Doctor Not Found</h1>
                    <p className="mt-2 text-muted-foreground">{error || 'This doctor profile does not exist'}</p>
                    <Link href="/" className="mt-4 inline-block">
                        <Button>Back to Home</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const avatarUrl = getAvatarUrl(profile.avatar_url, profile.gender, 'doctor')

    // Get min and max dates for date picker (today to 60 days from now)
    const today = new Date().toISOString().split('T')[0]
    const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b bg-white shadow-sm">
                <div className="container-custom flex h-16 items-center justify-between">
                    <Link href="/" className="text-2xl font-bold text-primary">
                        TeleMed
                    </Link>
                    <Link href="/">
                        <Button variant="secondary" size="sm">Back to Home</Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container-custom py-8">
                <div className="mx-auto max-w-4xl space-y-6">
                    {/* Doctor Header Card */}
                    <div className="card-custom">
                        <div className="flex flex-col gap-6 md:flex-row">
                            <div className="flex-shrink-0">
                                <div className="relative h-32 w-32 overflow-hidden rounded-full bg-primary-100">
                                    <Image
                                        src={avatarUrl}
                                        alt={profile.full_name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Dr. {profile.full_name}
                                </h1>
                                <p className="mt-1 text-lg text-primary-600">
                                    {doctorInfo.specializations.name}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        <span>{doctorInfo.experience_years} years experience</span>
                                    </div>
                                    {profile.city && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            <span>{profile.city}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Award className="h-4 w-4" />
                                        <span>License: {doctorInfo.medical_license_number}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio Section */}
                    {doctorInfo.bio && (
                        <div className="card-custom">
                            <h2 className="mb-3 text-xl font-semibold text-gray-900">About</h2>
                            <p className="text-muted-foreground whitespace-pre-line">{doctorInfo.bio}</p>
                        </div>
                    )}

                    {/* Qualifications */}
                    {doctorInfo.qualifications && (
                        <div className="card-custom">
                            <h2 className="mb-3 text-xl font-semibold text-gray-900">Qualifications</h2>
                            <p className="text-muted-foreground whitespace-pre-line">{doctorInfo.qualifications}</p>
                        </div>
                    )}

                    {/* Booking Section */}
                    <div className="card-custom">
                        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
                            <Calendar className="h-5 w-5" />
                            Book Appointment
                        </h2>

                        {bookingSuccess ? (
                            <div className="rounded-lg bg-success-50 p-4 text-success-700">
                                <p className="font-semibold">
                                    {payNow ? 'Redirecting to payment...' : 'Slot reserved successfully!'}
                                </p>
                                <p className="mt-1 text-sm">
                                    {payNow
                                        ? 'Complete payment to get your serial number'
                                        : 'Remember to pay before the deadline to confirm your appointment'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Available Slots */}
                                {availableSlots.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        No available slots in the next 30 days
                                    </p>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Group slots by date */}
                                        {Object.entries(
                                            availableSlots.reduce((groups: Record<string, AvailabilitySlot[]>, slot) => {
                                                const date = slot.slot_date
                                                if (!groups[date]) groups[date] = []
                                                groups[date].push(slot)
                                                return groups
                                            }, {})
                                        ).map(([date, slots]) => (
                                            <div key={date}>
                                                <h3 className="mb-3 font-semibold text-gray-900">
                                                    {new Date(date).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </h3>
                                                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                                                    {slots.map((slot) => {
                                                        const available = slot.max_appointments - (slot.booked_count || 0)
                                                        return (
                                                            <button
                                                                key={slot.id}
                                                                onClick={() => setSelectedSlot(slot)}
                                                                className={`rounded-lg border-2 p-3 text-left transition-all ${selectedSlot?.id === slot.id
                                                                    ? 'border-primary bg-primary-50'
                                                                    : 'border-gray-200 hover:border-primary-300'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2 font-medium">
                                                                    <Clock className="h-4 w-4" />
                                                                    {slot.start_time} - {slot.end_time}
                                                                </div>
                                                                <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-primary-600">
                                                                    ৳{slot.consultation_fee}
                                                                </div>
                                                                <div className="mt-1 text-xs text-muted-foreground">
                                                                    {slot.appointment_duration} min • {available}/{slot.max_appointments} available
                                                                </div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Booking Notes */}
                                {selectedSlot && (
                                    <>
                                        <div>
                                            <label className="label-custom">Notes (Optional)</label>
                                            <textarea
                                                value={bookingNotes}
                                                onChange={(e) => setBookingNotes(e.target.value)}
                                                className="input-custom"
                                                rows={3}
                                                placeholder="Describe your symptoms or reason for consultation..."
                                            />
                                        </div>

                                        {/* Payment Options */}
                                        <div className="rounded-lg border p-4 bg-gray-50">
                                            <label className="label-custom mb-3">Payment Option</label>
                                            <div className="space-y-2">
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="paymentOption"
                                                        checked={payNow}
                                                        onChange={() => setPayNow(true)}
                                                        className="mt-1"
                                                    />
                                                    <div>
                                                        <div className="font-medium">Pay Now</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Get your serial number immediately after payment
                                                        </div>
                                                    </div>
                                                </label>
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="paymentOption"
                                                        checked={!payNow}
                                                        onChange={() => setPayNow(false)}
                                                        className="mt-1"
                                                    />
                                                    <div>
                                                        <div className="font-medium">Pay Later</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Reserve slot, pay before {selectedSlot.allow_same_day_booking ? 'appointment time' : '48 hours before appointment'}
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Error Message */}
                                {bookingError && (
                                    <div className="rounded-md bg-destructive-50 p-3 text-sm text-destructive">
                                        {bookingError}
                                    </div>
                                )}

                                {/* Book Button */}
                                <Button
                                    onClick={handleBookAppointment}
                                    disabled={!selectedSlot || bookingLoading}
                                    isLoading={bookingLoading}
                                    className="w-full"
                                    size="lg"
                                >
                                    {!user ? 'Login to Book' : payNow ? 'Continue to Payment' : 'Reserve Slot'}
                                </Button>

                                {!user && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        You need to be logged in to book an appointment
                                    </p>
                                )}

                                {selectedSlot && payNow && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        You'll be redirected to payment gateway to complete booking
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Contact Information */}
                    <div className="card-custom">
                        <h2 className="mb-3 text-xl font-semibold text-gray-900">Contact Information</h2>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span>{profile.email}</span>
                            </div>
                            {profile.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span>{profile.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
