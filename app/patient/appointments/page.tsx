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
import { canJoinAppointment, formatReservationTime } from '@/lib/utils/appointment-timing'
import { Calendar, Clock, User, FileText, Upload, X, Video } from 'lucide-react'

interface Appointment {
    id: string
    appointment_date: string
    exact_start_time: string | null
    exact_end_time: string | null
    reservation_start_time: string | null
    reservation_end_time: string | null
    reservation_duration_minutes: number | null
    status: string
    patient_notes: string | null
    created_at: string
    doctors: {
        id: string
        profiles: {
            full_name: string
            avatar_url: string | null
            gender: string | null
        }
        specializations: {
            name: string
        }
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
    image_type: string
    notes: string | null
    created_at: string
}

interface DoctorSuggestion {
    id: string
    suggestion: string
    created_at: string
}

export default function PatientAppointmentsPage() {
    const router = useRouter()
    const { user, profile, loading: authLoading } = useRequireAuth('patient')
    const supabase = createClient()

    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(0)
    const ITEMS_PER_PAGE = 10

    // Image upload state
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [imageNotes, setImageNotes] = useState('')

    useEffect(() => {
        if (user) {
            fetchAppointments()
        }
    }, [user])

    const fetchAppointments = async (loadMore = false) => {
        if (!user) return
        
        setLoading(true)
        try {
            const currentPage = loadMore ? page + 1 : 0
            const from = currentPage * ITEMS_PER_PAGE
            const to = from + ITEMS_PER_PAGE - 1

            const { data, error, count } = await supabase
                .from('appointments')
                .select(`
                    *,
                    doctors!appointments_doctor_id_fkey (
                        id,
                        profiles!doctors_id_fkey (
                            full_name,
                            avatar_url,
                            gender
                        ),
                        specializations (
                            name
                        )
                    ),
                    availability_slots (
                        start_time,
                        end_time,
                        consultation_fee
                    )
                `, { count: 'exact' })
                .eq('patient_id', user.id)
                .order('appointment_date', { ascending: false })
                .range(from, to)

            if (error) throw error
            
            if (loadMore) {
                setAppointments(prev => [...prev, ...(data || [])])
                setPage(currentPage)
            } else {
                setAppointments(data || [])
                setPage(0)
            }
            
            setHasMore((count || 0) > (currentPage + 1) * ITEMS_PER_PAGE)
        } catch (err: any) {
            console.error('Error fetching appointments:', err)
            setError(err.message || 'Failed to load appointments')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelAppointment = async (appointmentId: string, appointmentDate: string) => {
        // Check 48-hour rule
        const appointmentTime = new Date(appointmentDate)
        const now = new Date()
        const hoursDiff = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60)

        if (hoursDiff < 48) {
            setError('Cannot cancel appointments less than 48 hours before the scheduled time')
            return
        }

        if (!confirm('Are you sure you want to cancel this appointment?')) return

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' } as any)
                .eq('id', appointmentId)

            if (error) throw error

            setSuccess('Appointment cancelled successfully')
            fetchAppointments()
        } catch (err: any) {
            setError(err.message || 'Failed to cancel appointment')
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, appointmentId: string) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB')
            return
        }

        setUploadingImage(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('userId', user?.id || '')

            const response = await fetch('/api/upload-test-image', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Upload failed')
            }

            const { url } = await response.json()

            // Save to database
            const { error: dbError } = await supabase
                .from('appointment_images')
                .insert([{
                    appointment_id: appointmentId,
                    image_url: url,
                    uploaded_by: user?.id,
                    image_type: 'test_result',
                    notes: imageNotes || null,
                }] as any)

            if (dbError) throw dbError

            setSuccess('Test image uploaded successfully')
            setImageNotes('')
            setSelectedAppointmentId(null)

            // Reset file input
            e.target.value = ''
        } catch (err: any) {
            console.error('Upload error:', err)
            setError(err.message || 'Failed to upload image')
        } finally {
            setUploadingImage(false)
        }
    }

    const upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date)
        return aptDate >= new Date() && apt.status !== 'cancelled'
    })

    const pastAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date)
        return aptDate < new Date() || apt.status === 'cancelled' || apt.status === 'completed'
    })

    if (authLoading || loading) {
        return <LoadingSpinner size="lg" className="min-h-screen" />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <main className="container-custom py-8">
                <div className="mx-auto max-w-4xl space-y-6">
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
                                            {/* Doctor Avatar */}
                                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-primary-100">
                                                <Image
                                                    src={getAvatarUrl(
                                                        appointment.doctors.profiles.avatar_url,
                                                        appointment.doctors.profiles.gender,
                                                        'doctor'
                                                    )}
                                                    alt={appointment.doctors.profiles.full_name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            {/* Appointment Info */}
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    Dr. {appointment.doctors.profiles.full_name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {appointment.doctors.specializations.name}
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        {new Date(appointment.appointment_date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        {appointment.reservation_start_time && appointment.reservation_end_time
                                                            ? formatReservationTime(appointment.reservation_start_time, appointment.reservation_end_time)
                                                            : `${appointment.availability_slots.start_time} - ${appointment.availability_slots.end_time}`
                                                        }
                                                    </div>
                                                    <div className="flex items-center gap-1 text-success-700 font-semibold">
                                                        ৳{appointment.availability_slots.consultation_fee}
                                                    </div>
                                                </div>
                                                {appointment.patient_notes && (
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        <strong>Notes:</strong> {appointment.patient_notes}
                                                    </p>
                                                )}
                                                <div className="mt-2">
                                                    <span className={`inline-block rounded-full px-2 py-1 text-xs ${appointment.status === 'confirmed' ? 'bg-success-100 text-success-700' :
                                                        appointment.status === 'pending_payment' ? 'bg-warning-100 text-warning-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {appointment.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </div>
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
                                                {appointment.status === 'confirmed' && (() => {
                                                    const joinStatus = canJoinAppointment(
                                                        appointment.reservation_start_time,
                                                        appointment.reservation_end_time
                                                    )
                                                    
                                                    return joinStatus.canJoin ? (
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
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full"
                                                            disabled
                                                            title={joinStatus.reason}
                                                        >
                                                            <Video className="h-4 w-4 mr-1" />
                                                            {joinStatus.reason || 'Join Room'}
                                                        </Button>
                                                    )
                                                })()}
                                                {appointment.status === 'pending_payment' && (
                                                    <Link href={`/payment/${appointment.id}`}>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            className="w-full"
                                                        >
                                                            Pay Now
                                                        </Button>
                                                    </Link>
                                                )}
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleCancelAppointment(appointment.id, appointment.appointment_date)}
                                                >
                                                    Cancel
                                                </Button>
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
                            <>
                                <div className="space-y-4">
                                    {pastAppointments.map((appointment) => (
                                        <div key={appointment.id} className="rounded-lg border p-4">
                                            <div className="flex items-start gap-4">
                                                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-primary-100">
                                                    <Image
                                                        src={getAvatarUrl(
                                                            appointment.doctors.profiles.avatar_url,
                                                            appointment.doctors.profiles.gender,
                                                            'doctor'
                                                        )}
                                                        alt={appointment.doctors.profiles.full_name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>

                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900">
                                                        Dr. {appointment.doctors.profiles.full_name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {appointment.doctors.specializations.name}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4" />
                                                            {new Date(appointment.appointment_date).toLocaleDateString()}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {appointment.availability_slots.start_time} - {appointment.availability_slots.end_time}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className={`inline-block rounded-full px-2 py-1 text-xs ${appointment.status === 'completed' ? 'bg-success-100 text-success-700' :
                                                            appointment.status === 'cancelled' ? 'bg-destructive-100 text-destructive' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {appointment.status.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Upload Test Images */}
                                                {appointment.status === 'completed' && (
                                                    <div>
                                                        <label className="cursor-pointer">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleImageUpload(e, appointment.id)}
                                                                disabled={uploadingImage}
                                                            />
                                                            <Button
                                                                as="span"
                                                                variant="secondary"
                                                                size="sm"
                                                                isLoading={uploadingImage && selectedAppointmentId === appointment.id}
                                                            >
                                                                <Upload className="h-4 w-4 mr-1" />
                                                                Upload Test
                                                            </Button>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Load More Button */}
                                {hasMore && !loading && pastAppointments.length > 0 && (
                                    <div className="mt-6 text-center">
                                        <Button
                                            onClick={() => fetchAppointments(true)}
                                            variant="outline"
                                            disabled={loading}
                                        >
                                            Load More Appointments
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
