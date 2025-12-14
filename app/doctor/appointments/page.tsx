'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRequireAuth } from '@/lib/auth/hooks'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { getAvatarUrl } from '@/lib/utils/avatar'
import { Calendar, Clock, User, FileText, MessageSquare, Image as ImageIcon, Video } from 'lucide-react'

interface Appointment {
    id: string
    appointment_date: string
    exact_start_time: string | null
    exact_end_time: string | null
    status: string
    patient_notes: string | null
    created_at: string
    profiles: {
        id: string
        full_name: string
        avatar_url: string | null
        gender: string | null
        phone: string | null
    }
    availability_slots: {
        start_time: string
        end_time: string
        consultation_fee: number
    }
}

interface AppointmentImage {
    id: string
    image_url: string
    notes: string | null
    created_at: string
}

interface DoctorSuggestion {
    id: string
    suggestion: string
    created_at: string
}

export default function DoctorAppointmentsPage() {
    const router = useRouter()
    const { user, profile, loading: authLoading } = useRequireAuth('doctor')
    const supabase = createClient()

    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Suggestion state
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
    const [suggestionText, setSuggestionText] = useState('')
    const [submittingSuggestion, setSubmittingSuggestion] = useState(false)

    // Images state
    const [appointmentImages, setAppointmentImages] = useState<Record<string, AppointmentImage[]>>({})
    const [appointmentSuggestions, setAppointmentSuggestions] = useState<Record<string, DoctorSuggestion[]>>({})

    useEffect(() => {
        if (user) {
            fetchAppointments()
        }
    }, [user])

    const fetchAppointments = async () => {
        if (!user) return
        
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    profiles!appointments_patient_id_fkey (
                        id,
                        full_name,
                        avatar_url,
                        gender,
                        phone
                    ),
                    availability_slots (
                        start_time,
                        end_time,
                        consultation_fee
                    )
                `)
                .eq('doctor_id', user.id)
                .order('appointment_date', { ascending: false })

            if (error) throw error
            setAppointments(data || [])

            // Fetch images and suggestions for each appointment
            if (data) {
                for (const apt of (data as any[])) {
                    await fetchAppointmentImages(apt.id)
                    await fetchAppointmentSuggestions(apt.id)
                }
            }
        } catch (err: any) {
            console.error('Error fetching appointments:', err)
            setError(err.message || 'Failed to load appointments')
        } finally {
            setLoading(false)
        }
    }

    const fetchAppointmentImages = async (appointmentId: string) => {
        const { data, error } = await supabase
            .from('appointment_images')
            .select('*')
            .eq('appointment_id', appointmentId)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setAppointmentImages(prev => ({ ...prev, [appointmentId]: data }))
        }
    }

    const fetchAppointmentSuggestions = async (appointmentId: string) => {
        const { data, error } = await supabase
            .from('doctor_suggestions')
            .select('*')
            .eq('appointment_id', appointmentId)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setAppointmentSuggestions(prev => ({ ...prev, [appointmentId]: data }))
        }
    }

    const handleMarkCompleted = async (appointmentId: string) => {
        if (!confirm('Mark this appointment as completed? You will not be able to edit prescriptions after this.')) {
            return
        }

        try {
            const { error } = await supabase
                .from('appointments')
                .update({
                    status: 'completed',
                    is_completed: true,
                    completed_at: new Date().toISOString()
                } as never)
                .eq('id', appointmentId)

            if (error) throw error

            setSuccess('Appointment marked as completed')
            fetchAppointments()
        } catch (err: any) {
            setError(err.message || 'Failed to update appointment')
        }
    }

    const handleSubmitSuggestion = async (appointmentId: string) => {
        if (!suggestionText.trim() || !user) {
            setError('Please enter a suggestion')
            return
        }

        setSubmittingSuggestion(true)
        setError(null)

        try {
            const { error } = await supabase
                .from('doctor_suggestions')
                .insert({
                    appointment_id: appointmentId,
                    doctor_id: user.id,
                    suggestion: suggestionText,
                } as any)

            if (error) throw error

            setSuccess('Suggestion added successfully')
            setSuggestionText('')
            setSelectedAppointmentId(null)
            await fetchAppointmentSuggestions(appointmentId)
        } catch (err: any) {
            setError(err.message || 'Failed to add suggestion')
        } finally {
            setSubmittingSuggestion(false)
        }
    }

    if (authLoading || loading) {
        return <LoadingSpinner size="lg" className="min-h-screen" />
    }

    const upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date)
        return aptDate >= new Date() && apt.status !== 'cancelled' && apt.status !== 'completed'
    })

    const pastAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date)
        return aptDate < new Date() || apt.status === 'completed' || apt.status === 'cancelled'
    })

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b bg-white shadow-sm">
                <div className="container-custom flex h-16 items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary-900">My Appointments</h1>
                    <Link href="/doctor/dashboard">
                        <Button variant="secondary" size="sm">Back to Dashboard</Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container-custom py-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    {/* Messages */}
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

                    {/* Upcoming Appointments */}
                    <div className="card-custom">
                        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
                            <Calendar className="h-5 w-5" />
                            Upcoming Appointments
                        </h2>

                        {upcomingAppointments.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No upcoming appointments
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {upcomingAppointments.map((appointment) => (
                                    <div key={appointment.id} className="rounded-lg border p-4">
                                        <div className="flex items-start gap-4">
                                            {/* Patient Avatar */}
                                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-primary-100">
                                                <Image
                                                    src={getAvatarUrl(
                                                        appointment.profiles.avatar_url,
                                                        appointment.profiles.gender,
                                                        'patient'
                                                    )}
                                                    alt={appointment.profiles.full_name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            {/* Appointment Info */}
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {appointment.profiles.full_name}
                                                </h3>
                                                {appointment.profiles.phone && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {appointment.profiles.phone}
                                                    </p>
                                                )}
                                                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        {new Date(appointment.appointment_date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        {appointment.availability_slots.start_time} - {appointment.availability_slots.end_time}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-success-700 font-semibold">
                                                        ৳{appointment.availability_slots.consultation_fee}
                                                    </div>
                                                </div>
                                                {appointment.patient_notes && (
                                                    <div className="mt-2 rounded bg-gray-50 p-2">
                                                        <p className="text-sm">
                                                            <strong>Patient Notes:</strong> {appointment.patient_notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2">
                                                <Link href={`/prescription/${appointment.id}`}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                    >
                                                        <FileText className="h-4 w-4 mr-1" />
                                                        View Prescription
                                                    </Button>
                                                </Link>
                                                {appointment.status === 'confirmed' && (
                                                    <Link href={`/appointment/${appointment.id}`}>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            className="w-full"
                                                        >
                                                            <Video className="h-4 w-4 mr-1" />
                                                            Join Room
                                                        </Button>
                                                    </Link>
                                                )}
                                                {appointment.status === 'confirmed' && (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleMarkCompleted(appointment.id)}
                                                        className="w-full"
                                                    >
                                                        Mark Completed
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past Appointments */}
                    <div className="card-custom">
                        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
                            <FileText className="h-5 w-5" />
                            Past Appointments
                        </h2>

                        {pastAppointments.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No past appointments
                            </p>
                        ) : (
                            <div className="space-y-6">
                                {pastAppointments.map((appointment) => (
                                    <div key={appointment.id} className="rounded-lg border p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-primary-100">
                                                <Image
                                                    src={getAvatarUrl(
                                                        appointment.profiles.avatar_url,
                                                        appointment.profiles.gender,
                                                        'patient'
                                                    )}
                                                    alt={appointment.profiles.full_name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            <div className="flex-1 space-y-3">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {appointment.profiles.full_name}
                                                    </h3>
                                                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4" />
                                                            {new Date(appointment.appointment_date).toLocaleDateString()}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {appointment.availability_slots.start_time}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Test Images */}
                                                {appointmentImages[appointment.id]?.length > 0 && (
                                                    <div>
                                                        <h4 className="mb-2 flex items-center gap-1 text-sm font-medium">
                                                            <ImageIcon className="h-4 w-4" />
                                                            Test Images ({appointmentImages[appointment.id].length})
                                                        </h4>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {appointmentImages[appointment.id].map((img) => (
                                                                <a
                                                                    key={img.id}
                                                                    href={img.image_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="relative aspect-square overflow-hidden rounded border"
                                                                >
                                                                    <Image
                                                                        src={img.image_url}
                                                                        alt="Test result"
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Previous Suggestions */}
                                                {appointmentSuggestions[appointment.id]?.length > 0 && (
                                                    <div>
                                                        <h4 className="mb-2 text-sm font-medium">Your Suggestions:</h4>
                                                        <div className="space-y-2">
                                                            {appointmentSuggestions[appointment.id].map((sug) => (
                                                                <div key={sug.id} className="rounded bg-primary-50 p-2 text-sm">
                                                                    {sug.suggestion}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Add Suggestion */}
                                                {appointment.status === 'completed' && (
                                                    <div>
                                                        {selectedAppointmentId === appointment.id ? (
                                                            <div className="space-y-2">
                                                                <textarea
                                                                    value={suggestionText}
                                                                    onChange={(e) => setSuggestionText(e.target.value)}
                                                                    className="input-custom"
                                                                    rows={3}
                                                                    placeholder="Enter your medical suggestions based on test results..."
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleSubmitSuggestion(appointment.id)}
                                                                        isLoading={submittingSuggestion}
                                                                    >
                                                                        Submit Suggestion
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        onClick={() => {
                                                                            setSelectedAppointmentId(null)
                                                                            setSuggestionText('')
                                                                        }}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => setSelectedAppointmentId(appointment.id)}
                                                            >
                                                                <MessageSquare className="h-4 w-4 mr-1" />
                                                                Add Suggestion
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
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
