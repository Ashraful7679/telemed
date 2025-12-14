'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/hooks'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { generatePrescriptionPDF } from '@/lib/utils/prescription-pdf'
import { Download, ArrowLeft, FileText } from 'lucide-react'

export default function PrescriptionPage() {
    const params = useParams()
    const router = useRouter()
    const appointmentId = params.appointmentId as string
    const { user, profile } = useAuth()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [prescriptionData, setPrescriptionData] = useState<any>(null)

    useEffect(() => {
        if (user) {
            fetchPrescriptionData()
        }
    }, [user, appointmentId])

    const fetchPrescriptionData = async () => {
        try {
            // Fetch appointment with all related data
            const { data: appointment, error: apptError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patients:profiles!appointments_patient_id_fkey (
                        full_name,
                        date_of_birth,
                        gender
                    ),
                    doctors:doctors!appointments_doctor_id_fkey (
                        id,
                        full_name:profiles!doctors_id_fkey(full_name),
                        qualifications,
                        registration_number,
                        specializations (
                            name
                        )
                    ),
                    availability_slots (
                        consultation_fee
                    )
                `)
                .eq('id', appointmentId)
                .single()

            if (apptError) throw apptError
            if (!appointment) throw new Error('Appointment not found')

            // Verify user has access
            if (appointment.patient_id !== user?.id && appointment.doctor_id !== user?.id) {
                throw new Error('Unauthorized access')
            }

            // Fetch prescribed medicines
            const { data: medicines, error: medError } = await supabase
                .from('prescribed_medicines')
                .select('*')
                .eq('appointment_id', appointmentId)
                .order('created_at', { ascending: true })

            if (medError) throw medError

            // Fetch prescribed tests
            const { data: tests, error: testError } = await supabase
                .from('prescribed_tests')
                .select('*')
                .eq('appointment_id', appointmentId)
                .order('created_at', { ascending: true })

            if (testError) throw testError

            // Fetch referrals
            const { data: referrals, error: refError } = await supabase
                .from('referrals')
                .select('*')
                .eq('appointment_id', appointmentId)
                .order('created_at', { ascending: true })

            if (refError) throw refError

            // Calculate patient age
            let patientAge = undefined
            if (appointment.patients.date_of_birth) {
                const birthDate = new Date(appointment.patients.date_of_birth)
                const today = new Date()
                patientAge = today.getFullYear() - birthDate.getFullYear()
            }

            setPrescriptionData({
                appointment,
                medicines: medicines || [],
                tests: tests || [],
                referrals: referrals || [],
                patientAge
            })
        } catch (err: any) {
            console.error('Error fetching prescription:', err)
            setError(err.message || 'Failed to load prescription')
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadPDF = () => {
        if (!prescriptionData) return

        const { appointment, medicines, tests, referrals, patientAge } = prescriptionData

        generatePrescriptionPDF({
            appointmentId: appointment.id,
            appointmentDate: appointment.appointment_date,
            serialNumber: appointment.serial_number,
            doctor: {
                name: appointment.doctors.full_name?.full_name || appointment.doctors.full_name,
                specialization: appointment.doctors.specializations?.name || 'General Physician',
                qualifications: appointment.doctors.qualifications,
                registrationNumber: appointment.doctors.registration_number
            },
            patient: {
                name: appointment.patients.full_name,
                age: patientAge,
                gender: appointment.patients.gender
            },
            medicines,
            tests,
            referrals
        })
    }

    const formatDosage = (med: any) => {
        const parts = []

        if (med.dosage_quantity && med.dosage_unit) {
            parts.push(`${med.dosage_quantity} ${med.dosage_unit}`)
        }

        if (med.frequency_type === 'specific_times') {
            const times = []
            if (med.morning) times.push('Morning')
            if (med.afternoon) times.push('Afternoon')
            if (med.night) times.push('Night')
            if (times.length > 0) parts.push(times.join(', '))
        } else if (med.frequency_type === 'hours_gap' && med.hours_gap) {
            parts.push(`Every ${med.hours_gap} hours`)
        }

        if (med.meal_timing) {
            const timingMap: Record<string, string> = {
                'after_meal': 'After meal',
                'before_meal': 'Before meal',
                'with_meal': 'With meal',
                'empty_stomach': 'Empty stomach'
            }
            parts.push(timingMap[med.meal_timing] || med.meal_timing)
        }

        if (med.duration_days) {
            parts.push(`for ${med.duration_days} days`)
        }

        return parts.join(' • ')
    }

    if (loading) {
        return <LoadingSpinner size="lg" className="min-h-screen" />
    }

    if (error || !prescriptionData) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Error</h1>
                    <p className="mt-2 text-muted-foreground">{error || 'Prescription not found'}</p>
                    <Link href={profile?.role === 'doctor' ? '/doctor/appointments' : '/patient/appointments'} className="mt-4 inline-block">
                        <Button>Back to Appointments</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const { appointment, medicines, tests, referrals, patientAge } = prescriptionData
    const hasPrescription = medicines.length > 0 || tests.length > 0 || referrals.length > 0

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto max-w-4xl px-4">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <Link href={profile?.role === 'doctor' ? '/doctor/appointments' : '/patient/appointments'}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Appointments
                        </Button>
                    </Link>
                    {hasPrescription && (
                        <Button onClick={handleDownloadPDF} variant="primary">
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                    )}
                </div>

                {/* Prescription Card */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    {/* Header */}
                    <div className="text-center border-b pb-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">MEDICAL PRESCRIPTION</h1>
                        <div className="text-lg font-semibold text-primary">
                            Dr. {appointment.doctors.full_name?.full_name || appointment.doctors.full_name}
                        </div>
                        <div className="text-sm text-gray-600">
                            {appointment.doctors.specializations?.name || 'General Physician'}
                        </div>
                        {appointment.doctors.qualifications && (
                            <div className="text-sm text-gray-600">{appointment.doctors.qualifications}</div>
                        )}
                        {appointment.doctors.registration_number && (
                            <div className="text-xs text-gray-500 mt-1">
                                Reg. No: {appointment.doctors.registration_number}
                            </div>
                        )}
                    </div>

                    {/* Patient Info */}
                    <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-semibold">Patient Name:</span> {appointment.patients.full_name}
                        </div>
                        <div>
                            <span className="font-semibold">Date:</span> {new Date(appointment.appointment_date).toLocaleDateString()}
                        </div>
                        {patientAge && (
                            <div>
                                <span className="font-semibold">Age:</span> {patientAge} years
                            </div>
                        )}
                        {appointment.patients.gender && (
                            <div>
                                <span className="font-semibold">Gender:</span> {appointment.patients.gender}
                            </div>
                        )}
                        {appointment.serial_number && (
                            <div>
                                <span className="font-semibold">Serial No:</span> #{appointment.serial_number}
                            </div>
                        )}
                    </div>

                    {!hasPrescription ? (
                        <div className="text-center py-12">
                            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No prescription available yet</p>
                            <p className="text-gray-400 text-sm mt-2">
                                The doctor hasn't prescribed any medicines or tests for this appointment.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Rx Symbol */}
                            <div className="text-4xl font-bold text-primary mb-4">Rx</div>

                            {/* Medicines */}
                            {medicines.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Prescribed Medicines</h2>
                                    <div className="space-y-3">
                                        {medicines.map((med: any, index: number) => (
                                            <div key={med.id} className="border-l-4 border-primary pl-4 py-2">
                                                <div className="font-semibold text-gray-900">
                                                    {index + 1}. {med.medicine_name}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {formatDosage(med)}
                                                </div>
                                                {med.instructions && (
                                                    <div className="text-xs text-gray-500 mt-1 italic">
                                                        Note: {med.instructions}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tests */}
                            {tests.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Prescribed Tests</h2>
                                    <div className="space-y-3">
                                        {tests.map((test: any, index: number) => (
                                            <div key={test.id} className="border-l-4 border-secondary pl-4 py-2">
                                                <div className="font-semibold text-gray-900">
                                                    {index + 1}. {test.test_name}
                                                </div>
                                                {test.test_description && (
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {test.test_description}
                                                    </div>
                                                )}
                                                {test.instructions && (
                                                    <div className="text-xs text-gray-500 mt-1 italic">
                                                        Instructions: {test.instructions}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Referrals */}
                            {referrals.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Referrals</h2>
                                    <div className="space-y-3">
                                        {referrals.map((ref: any, index: number) => (
                                            <div key={ref.id} className="border-l-4 border-warning pl-4 py-2">
                                                <div className="font-semibold text-gray-900">
                                                    {index + 1}. Refer to: {ref.specialty}
                                                </div>
                                                {ref.reason && (
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        Reason: {ref.reason}
                                                    </div>
                                                )}
                                                {ref.notes && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Notes: {ref.notes}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Signature */}
                            <div className="mt-12 pt-6 border-t">
                                <div className="text-right">
                                    <div className="inline-block">
                                        <div className="border-t border-gray-400 pt-2 px-8">
                                            <div className="text-sm font-semibold">Doctor's Signature</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-6 text-center text-xs text-gray-400">
                                This is a computer-generated prescription
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
