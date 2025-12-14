'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRequireAuth } from '@/lib/auth/hooks'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Calendar, Clock, DollarSign, Plus, Trash2 } from 'lucide-react'

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
}

export default function DoctorAvailabilityPage() {
    const router = useRouter()
    const { user, profile, loading: authLoading } = useRequireAuth('doctor')
    const supabase = createClient()

    const [slots, setSlots] = useState<AvailabilitySlot[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Form state
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('17:00')
    const [consultationFee, setConsultationFee] = useState('500')
    const [appointmentDuration, setAppointmentDuration] = useState('15')
    const [maxAppointments, setMaxAppointments] = useState('10')
    const [allowSameDayBooking, setAllowSameDayBooking] = useState(false)

useEffect(() => {
    if (user?.id) {  // Make sure user.id exists
        fetchSlots()
    }
}, [user])

const fetchSlots = async () => {
    if (!user?.id) {
        // No doctor logged in yet
        setSlots([]) // Optional: clear previous slots
        return
    }

    const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('doctor_id', user.id)
        .gte('slot_date', new Date().toISOString().split('T')[0])
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true })

    if (error) {
        console.error('Error fetching slots:', error)
        setSlots([])
    } else {
        setSlots(data || [])
    }
}


    const handleCreateSlots = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        // Validation
        if (!fromDate || !toDate) {
            setError('Please select both from and to dates')
            return
        }

        const fee = parseFloat(consultationFee)
        if (isNaN(fee) || fee <= 0) {
            setError('Please enter a valid consultation fee')
            return
        }

        const duration = parseInt(appointmentDuration)
        if (isNaN(duration) || duration <= 0) {
            setError('Please enter a valid appointment duration')
            return
        }

        const maxApts = parseInt(maxAppointments)
        if (isNaN(maxApts) || maxApts <= 0) {
            setError('Please enter a valid maximum appointments')
            return
        }

        const from = new Date(fromDate)
        const to = new Date(toDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Check 60-day limit
        const maxDate = new Date(today)
        maxDate.setDate(maxDate.getDate() + 60)

        if (to > maxDate) {
            setError('Cannot create slots more than 60 days in advance')
            return
        }

        if (from > to) {
            setError('From date must be before to date')
            return
        }

        // Check 48-hour rule if same-day booking not allowed
        if (!allowSameDayBooking) {
            const minDate = new Date(today)
            minDate.setHours(minDate.getHours() + 48)

            if (from < minDate) {
                setError('Slots must be created at least 48 hours in advance when same-day booking is disabled')
                return
            }
        }

        if (startTime >= endTime) {
            setError('Start time must be before end time')
            return
        }

        // Validate slot capacity
        const [startHour, startMin] = startTime.split(':').map(Number)
        const [endHour, endMin] = endTime.split(':').map(Number)
        const slotDurationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
        const requiredMinutes = maxApts * duration

        if (slotDurationMinutes < requiredMinutes) {
            setError(`Slot duration (${slotDurationMinutes} min) is too short for ${maxApts} appointments of ${duration} min each. Need at least ${requiredMinutes} minutes.`)
            return
        }

        setLoading(true)

        try {
            // Generate slots for each date in range
            const slotsToCreate = []
            const currentDate = new Date(from)

            while (currentDate <= to) {
                slotsToCreate.push({
                    doctor_id: user?.id,
                    slot_date: currentDate.toISOString().split('T')[0],
                    start_time: startTime,
                    end_time: endTime,
                    consultation_fee: fee,
                    appointment_duration: duration,
                    max_appointments: maxApts,
                    allow_same_day_booking: allowSameDayBooking,
                    is_available: true,
                })
                currentDate.setDate(currentDate.getDate() + 1)
            }

            const { error: insertError } = await supabase
                .from('availability_slots')
                .insert(slotsToCreate)

            if (insertError) throw insertError

            setSuccess(`Created ${slotsToCreate.length} availability slots`)
            fetchSlots()

            // Reset form
            setFromDate('')
            setToDate('')
            setStartTime('09:00')
            setEndTime('17:00')
            setConsultationFee('500')
            setAppointmentDuration('15')
            setMaxAppointments('10')
            setAllowSameDayBooking(false)
        } catch (err: any) {
            setError(err.message || 'Failed to create slots')
        }

        setLoading(false)
    }

    const handleDeleteSlot = async (slotId: string) => {
        if (!confirm('Are you sure you want to delete this slot?')) return

        const { error } = await supabase
            .from('availability_slots')
            .delete()
            .eq('id', slotId)

        if (error) {
            setError('Failed to delete slot')
        } else {
            setSuccess('Slot deleted successfully')
            fetchSlots()
        }
    }

    if (authLoading) {
        return <LoadingSpinner size="lg" className="min-h-screen" />
    }

    // Get min and max dates for date pickers
    const today = new Date().toISOString().split('T')[0]
    const maxDateStr = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b bg-white shadow-sm">
                <div className="container-custom flex h-16 items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary-900">Availability Management</h1>
                    <Link href="/doctor/dashboard">
                        <Button variant="secondary" size="sm">Back to Dashboard</Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container-custom py-8">
                <div className="mx-auto max-w-4xl space-y-6">
                    {/* Create Slots Section */}
                    <div className="card-custom">
                        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
                            <Plus className="h-5 w-5" />
                            Create Availability Slots
                        </h2>

                        <form onSubmit={handleCreateSlots} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Input
                                    type="date"
                                    label="From Date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    min={today}
                                    max={maxDateStr}
                                    required
                                />
                                <Input
                                    type="date"
                                    label="To Date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    min={fromDate || today}
                                    max={maxDateStr}
                                    required
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Input
                                    type="time"
                                    label="Start Time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    required
                                />
                                <Input
                                    type="time"
                                    label="End Time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    required
                                />
                            </div>

                            <Input
                                type="number"
                                label="Consultation Fee (৳ BDT)"
                                value={consultationFee}
                                onChange={(e) => setConsultationFee(e.target.value)}
                                placeholder="500"
                                min="0"
                                step="50"
                                required
                                helperText="Fee per appointment in BDT"
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="label-custom">Appointment Duration</label>
                                    <select
                                        value={appointmentDuration}
                                        onChange={(e) => setAppointmentDuration(e.target.value)}
                                        className="input-custom"
                                        required
                                    >
                                        <option value="15">15 minutes</option>
                                        <option value="30">30 minutes</option>
                                        <option value="45">45 minutes</option>
                                        <option value="60">60 minutes</option>
                                    </select>
                                </div>

                                <Input
                                    type="number"
                                    label="Max Appointments"
                                    value={maxAppointments}
                                    onChange={(e) => setMaxAppointments(e.target.value)}
                                    placeholder="10"
                                    min="1"
                                    max="50"
                                    required
                                    helperText="Maximum patients per slot"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="sameDayBooking"
                                    checked={allowSameDayBooking}
                                    onChange={(e) => setAllowSameDayBooking(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <label htmlFor="sameDayBooking" className="text-sm text-gray-700">
                                    Allow same-day booking (if unchecked, requires 48-hour advance notice)
                                </label>
                            </div>

                            {error && (
                                <div className="rounded-md bg-destructive-50 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="rounded-md bg-success-50 p-3 text-sm text-success-700">
                                    {success}
                                </div>
                            )}

                            <Button type="submit" isLoading={loading} className="w-full">
                                Create Slots
                            </Button>
                        </form>
                    </div>

                    {/* Existing Slots */}
                    <div className="card-custom">
                        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
                            <Calendar className="h-5 w-5" />
                            Your Availability Slots
                        </h2>

                        {slots.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No availability slots created yet
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {slots.map((slot) => (
                                    <div
                                        key={slot.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">
                                                {new Date(slot.slot_date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {slot.start_time} - {slot.end_time}
                                                <span className="ml-2 font-semibold text-primary">৳{slot.consultation_fee}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {slot.appointment_duration} min/patient • Max {slot.max_appointments} patients
                                                {slot.allow_same_day_booking && (
                                                    <span className="ml-2 text-primary">(Same-day OK)</span>
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDeleteSlot(slot.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
