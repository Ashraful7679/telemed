'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/hooks'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { getAvatarUrl } from '@/lib/utils/avatar'
import {
    Video, VideoOff, Mic, MicOff, Phone, MessageSquare,
    FileText, Send, Clock, TestTube, Plus, Trash2
} from 'lucide-react'

interface Appointment {
    id: string
    appointment_date: string
    status: string
    serial_number: number | null
    exact_appointment_time: string | null
    patient_notes: string | null
    patient_id: string
    doctor_id: string
    patients: {
        full_name: string
        avatar_url: string | null
        gender: string | null
    }
    doctors: {
        id: string
        full_name: string
        avatar_url: string | null
        gender: string | null
        specializations: {
            name: string
        }
    }
    availability_slots: {
        consultation_fee: number
        appointment_duration: number
    }
}


interface ChatMessage {
    id: string
    sender_id: string
    message: string
    created_at: string
}

interface Medicine {
    id: string
    name: string
    generic_name: string | null
    dosage_form: string | null
    strength: string | null
}

interface PrescribedMedicine {
    duration: any
    dosage: any
    id: string
    medicine_name: string
    dosage_quantity: string | null
    dosage_unit: string | null
    meal_timing: string | null
    frequency_type: string | null
    morning: boolean | null
    afternoon: boolean | null
    night: boolean | null
    hours_gap: number | null
    duration_days: number | null
    instructions: string | null
    created_at: string
}

interface MedicalTest {
    id: string
    name: string
    category: string | null
    description: string | null
}

interface Prescription {
    id: string
    suggestion: string
    created_at: string
}

interface PrescribedTest {
    id: string
    test_name: string
    test_description: string | null
    instructions: string | null
    created_at: string
}

export default function AppointmentRoomPage() {
    const params = useParams()
    const router = useRouter()
    const appointmentId = params.appointmentId as string
    const { user, profile } = useAuth()
    const supabase = createClient()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const [appointment, setAppointment] = useState<Appointment | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Video call state
    const [videoEnabled, setVideoEnabled] = useState(true)
    const [audioEnabled, setAudioEnabled] = useState(true)

    // Tab state
    const [activeTab, setActiveTab] = useState<'chat' | 'prescription' | 'tests'>('chat')

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sendingMessage, setSendingMessage] = useState(false)

    // Medicine/Prescription state
    const [medicines, setMedicines] = useState<Medicine[]>([])
    const [prescribedMedicines, setPrescribedMedicines] = useState<PrescribedMedicine[]>([])
    const [medicineSearch, setMedicineSearch] = useState('')
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
    const [showMedicineDropdown, setShowMedicineDropdown] = useState(false)

    // Structured dosage fields
    const [dosageQuantity, setDosageQuantity] = useState('')
    const [dosageUnit, setDosageUnit] = useState('tablet')
    const [mealTiming, setMealTiming] = useState('after_meal')
    const [frequencyType, setFrequencyType] = useState<'specific_times' | 'hours_gap'>('specific_times')
    const [morning, setMorning] = useState(false)
    const [afternoon, setAfternoon] = useState(false)
    const [night, setNight] = useState(false)
    const [hoursGap, setHoursGap] = useState('')
    const [durationDays, setDurationDays] = useState('')
    const [medicineInstructions, setMedicineInstructions] = useState('')
    const [savingMedicine, setSavingMedicine] = useState(false)

    // Tests state
    const [medicalTests, setMedicalTests] = useState<MedicalTest[]>([])
    const [prescribedTests, setPrescribedTests] = useState<PrescribedTest[]>([])
    const [testSearch, setTestSearch] = useState('')
    const [selectedTest, setSelectedTest] = useState<MedicalTest | null>(null)
    const [showTestDropdown, setShowTestDropdown] = useState(false)
    const [testInstructions, setTestInstructions] = useState('')
    const [savingTest, setSavingTest] = useState(false)

    const isDoctor = profile?.role === 'doctor'
    const isPatient = profile?.role === 'patient'

    useEffect(() => {
        if (user) {
            fetchAppointment()
            fetchMessages()
            fetchMedicines()
            fetchPrescribedMedicines()
            fetchMedicalTests()
            fetchPrescribedTests()

            // Poll for updates every 3 seconds
            const interval = setInterval(() => {
                fetchMessages()
                fetchPrescribedMedicines()
                fetchPrescribedTests()
            }, 3000)

            return () => clearInterval(interval)
        }
    }, [user, appointmentId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchAppointment = async () => {
        if (!user) return
        
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patients:profiles!appointments_patient_id_fkey (
                        full_name,
                        avatar_url,
                        gender
                    ),
                    doctors:doctors!appointments_doctor_id_fkey (
                        id,
                        full_name:profiles!doctors_id_fkey(full_name),
                        avatar_url:profiles!doctors_id_fkey(avatar_url),
                        gender:profiles!doctors_id_fkey(gender),
                        specializations (
                            name
                        )
                    ),
                    availability_slots (
                        consultation_fee,
                        appointment_duration
                    )
                `)
                .eq('id', appointmentId)
                .single()

            if (error) throw error
            if (!data) throw new Error('Appointment not found')

            // Type the data properly
            const appointmentData = data as any as Appointment

            // Verify user has access
            if (appointmentData.patient_id !== user.id && appointmentData.doctor_id !== user.id) {
                throw new Error('Unauthorized access')
            }

            setAppointment(appointmentData)
        } catch (err: any) {
            console.error('Error fetching appointment:', err)
            setError(err.message || 'Failed to load appointment')
        } finally {
            setLoading(false)
        }
    }

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('appointment_chat')
                .select('*')
                .eq('appointment_id', appointmentId)
                .order('created_at', { ascending: true })

            if (error) throw error
            setMessages(data || [])
        } catch (err: any) {
            console.error('Error fetching messages:', err)
        }
    }

    const fetchMedicines = async () => {
        try {
            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error
            setMedicines(data || [])
        } catch (err: any) {
            console.error('Error fetching medicines:', err)
        }
    }

    const fetchPrescribedMedicines = async () => {
        try {
            const { data, error } = await supabase
                .from('prescribed_medicines')
                .select('*')
                .eq('appointment_id', appointmentId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setPrescribedMedicines(data || [])
        } catch (err: any) {
            console.error('Error fetching prescribed medicines:', err)
        }
    }

    const fetchMedicalTests = async () => {
        try {
            const { data, error } = await supabase
                .from('medical_tests')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error
            setMedicalTests(data || [])
        } catch (err: any) {
            console.error('Error fetching medical tests:', err)
        }
    }

    const fetchPrescribedTests = async () => {
        try {
            const { data, error } = await supabase
                .from('prescribed_tests')
                .select('*')
                .eq('appointment_id', appointmentId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setPrescribedTests(data || [])
        } catch (err: any) {
            console.error('Error fetching prescribed tests:', err)
        }
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user) return

        setSendingMessage(true)
        try {
            const { error } = await supabase
                .from('appointment_chat')
                .insert({
                    appointment_id: appointmentId,
                    sender_id: user.id,
                    message: newMessage.trim()
                } as any)

            if (error) throw error

            setNewMessage('')
            await fetchMessages()
        } catch (err: any) {
            console.error('Error sending message:', err)
            alert('Failed to send message')
        } finally {
            setSendingMessage(false)
        }
    }

    const handlePrescribeMedicine = async () => {
        const medicineName = selectedMedicine?.name || medicineSearch.trim()
        if (!medicineName) {
            alert('Please select or enter a medicine name')
            return
        }

        if (!dosageQuantity) {
            alert('Please enter dosage quantity')
            return
        }

        if (frequencyType === 'specific_times' && !morning && !afternoon && !night) {
            alert('Please select at least one time (Morning/Afternoon/Night)')
            return
        }

        if (frequencyType === 'hours_gap' && !hoursGap) {
            alert('Please enter hours gap')
            return
        }

        if (!durationDays) {
            alert('Please enter duration in days')
            return
        }

        setSavingMedicine(true)
        try {
            let medicineId = selectedMedicine?.id

            // If medicine doesn't exist in database, add it
            if (!selectedMedicine && medicineSearch.trim()) {
                const { data: newMed, error: medError } = await supabase
                    .from('medicines')
                    .insert({ name: medicineSearch.trim() } as any)
                    .select()
                    .single()

                if (medError) throw medError
                medicineId = (newMed as any).id
                await fetchMedicines() // Refresh list
            }

            // Prescribe the medicine with structured dosage
            const { error } = await supabase
                .from('prescribed_medicines')
                .insert({
                    appointment_id: appointmentId,
                    doctor_id: appointment?.doctors.id,
                    medicine_id: medicineId,
                    medicine_name: medicineName,
                    dosage_quantity: dosageQuantity,
                    dosage_unit: dosageUnit,
                    meal_timing: mealTiming,
                    frequency_type: frequencyType,
                    morning: frequencyType === 'specific_times' ? morning : null,
                    afternoon: frequencyType === 'specific_times' ? afternoon : null,
                    night: frequencyType === 'specific_times' ? night : null,
                    hours_gap: frequencyType === 'hours_gap' ? parseInt(hoursGap) : null,
                    duration_days: parseInt(durationDays),
                    instructions: medicineInstructions.trim() || null
                } as any)

            if (error) throw error

            // Reset form
            setMedicineSearch('')
            setSelectedMedicine(null)
            setDosageQuantity('')
            setDosageUnit('tablet')
            setMealTiming('after_meal')
            setFrequencyType('specific_times')
            setMorning(false)
            setAfternoon(false)
            setNight(false)
            setHoursGap('')
            setDurationDays('')
            setMedicineInstructions('')
            setShowMedicineDropdown(false)
            await fetchPrescribedMedicines()
            alert('Medicine prescribed successfully!')
        } catch (err: any) {
            console.error('Error prescribing medicine:', err)
            alert(`Failed to prescribe medicine: ${err.message}`)
        } finally {
            setSavingMedicine(false)
        }
    }

    const handleDeleteMedicine = async (medicineId: string) => {
        if (!confirm('Are you sure you want to delete this medicine?')) return

        try {
            const { error } = await supabase
                .from('prescribed_medicines')
                .delete()
                .eq('id', medicineId)

            if (error) throw error

            await fetchPrescribedMedicines()
        } catch (err: any) {
            console.error('Error deleting medicine:', err)
            alert('Failed to delete medicine')
        }
    }

    const handlePrescribeTest = async () => {
        const testName = selectedTest?.name || testSearch.trim()
        if (!testName) {
            alert('Please select or enter a test name')
            return
        }

        setSavingTest(true)
        try {
            let testId = selectedTest?.id

            // If test doesn't exist in database, add it
            if (!selectedTest && testSearch.trim()) {
                const { data: newTest, error: testError } = await supabase
                    .from('medical_tests')
                    .insert({ name: testSearch.trim() } as any)
                    .select()
                    .single()

                if (testError) throw testError
                testId = (newTest as any).id
                await fetchMedicalTests() // Refresh list
            }

            // Prescribe the test
            const { error } = await supabase
                .from('prescribed_tests')
                .insert({
                    appointment_id: appointmentId,
                    doctor_id: appointment?.doctors.id,
                    test_id: testId,
                    test_name: testName,
                    test_description: selectedTest?.description || null,
                    instructions: testInstructions.trim() || null
                } as any)

            if (error) throw error

            // Reset form
            setTestSearch('')
            setSelectedTest(null)
            setTestInstructions('')
            setShowTestDropdown(false)
            await fetchPrescribedTests()
            alert('Test prescribed successfully!')
        } catch (err: any) {
            console.error('Error prescribing test:', err)
            alert(`Failed to prescribe test: ${err.message}`)
        } finally {
            setSavingTest(false)
        }
    }

    const handleDeleteTest = async (testId: string) => {
        if (!confirm('Are you sure you want to delete this test?')) return

        try {
            const { error } = await supabase
                .from('prescribed_tests')
                .delete()
                .eq('id', testId)

            if (error) throw error

            await fetchPrescribedTests()
        } catch (err: any) {
            console.error('Error deleting test:', err)
            alert('Failed to delete test')
        }
    }

    // Filter medicines based on search
    const filteredMedicines = medicines.filter(med =>
        med.name.toLowerCase().includes(medicineSearch.toLowerCase())
    )

    // Filter tests based on search
    const filteredTests = medicalTests.filter(test =>
        test.name.toLowerCase().includes(testSearch.toLowerCase())
    )

    const handleEndCall = () => {
        if (confirm('Are you sure you want to end this consultation?')) {
            router.push(isDoctor ? '/doctor/appointments' : '/patient/appointments')
        }
    }

    if (loading) {
        return <LoadingSpinner size="lg" className="min-h-screen" />
    }

    if (error || !appointment) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Error</h1>
                    <p className="mt-2 text-muted-foreground">{error || 'Appointment not found'}</p>
                    <Link href={isDoctor ? '/doctor/appointments' : '/patient/appointments'} className="mt-4 inline-block">
                        <Button>Back to Appointments</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const otherPerson = isDoctor ? appointment.patients : appointment.doctors
    const otherPersonName = isDoctor
        ? appointment.patients.full_name
        : `Dr. ${appointment.doctors.full_name}`

    return (
        <div className="flex h-screen flex-col bg-gray-900">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-6 py-3">
                <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-primary-100">
                        <Image
                            src={getAvatarUrl(
                                otherPerson.avatar_url,
                                otherPerson.gender,
                                isDoctor ? 'patient' : 'doctor'
                            )}
                            alt={otherPersonName}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <h1 className="font-semibold text-white">{otherPersonName}</h1>
                        {!isDoctor && appointment.doctors.specializations && (
                            <p className="text-sm text-gray-400">{appointment.doctors.specializations.name}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-300">
                    {appointment.serial_number && (
                        <div className="flex items-center gap-1">
                            <span>Serial:</span>
                            <span className="font-semibold text-primary-400">#{appointment.serial_number}</span>
                        </div>
                    )}
                    {appointment.exact_appointment_time && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{appointment.exact_appointment_time}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1 text-success-400 font-semibold">
                        ৳{appointment.availability_slots.consultation_fee}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Video Area */}
                <div className="flex flex-1 flex-col">
                    {/* Video Display */}
                    <div className="relative flex-1 bg-gray-950">
                        {/* Remote Video (Other Person) */}
                        <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                                <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-full bg-primary-100 mb-4">
                                    <Image
                                        src={getAvatarUrl(
                                            otherPerson.avatar_url,
                                            otherPerson.gender,
                                            isDoctor ? 'patient' : 'doctor'
                                        )}
                                        alt={otherPersonName}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <p className="text-white text-lg font-semibold">{otherPersonName}</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    {videoEnabled ? 'Video call in progress' : 'Video disabled'}
                                </p>
                            </div>
                        </div>

                        {/* Local Video (Self) - Picture in Picture */}
                        <div className="absolute bottom-4 right-4 h-32 w-48 overflow-hidden rounded-lg border-2 border-gray-700 bg-gray-800">
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center">
                                    <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full bg-primary-100">
                                        <Image
                                            src={getAvatarUrl(
                                                profile?.avatar_url ?? null,
                                                profile?.gender ?? null,
                                                isDoctor ? 'doctor' : 'patient'
                                            )}
                                            alt="You"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <p className="text-white text-xs mt-1">You</p>
                                </div>
                            </div>
                        </div>

                        {/* Video Call Notice */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-gray-800/90 px-4 py-2 text-sm text-white">
                            🎥 Video call feature coming soon
                        </div>
                    </div>

                    {/* Video Controls */}
                    <div className="flex items-center justify-center gap-4 bg-gray-800 py-4">
                        <button
                            onClick={() => setVideoEnabled(!videoEnabled)}
                            className={`rounded-full p-4 transition-colors ${videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-destructive hover:bg-destructive/90'
                                }`}
                        >
                            {videoEnabled ? (
                                <Video className="h-6 w-6 text-white" />
                            ) : (
                                <VideoOff className="h-6 w-6 text-white" />
                            )}
                        </button>

                        <button
                            onClick={() => setAudioEnabled(!audioEnabled)}
                            className={`rounded-full p-4 transition-colors ${audioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-destructive hover:bg-destructive/90'
                                }`}
                        >
                            {audioEnabled ? (
                                <Mic className="h-6 w-6 text-white" />
                            ) : (
                                <MicOff className="h-6 w-6 text-white" />
                            )}
                        </button>

                        <button
                            onClick={handleEndCall}
                            className="rounded-full bg-destructive p-4 hover:bg-destructive/90 transition-colors"
                        >
                            <Phone className="h-6 w-6 text-white rotate-135" />
                        </button>
                    </div>
                </div>

                {/* Sidebar - Chat, Prescription & Tests */}
                <div className="flex w-96 flex-col border-l border-gray-700 bg-gray-800">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-700">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'chat'
                                ? 'border-b-2 border-primary bg-gray-750 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <MessageSquare className="inline h-4 w-4 mr-1" />
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('prescription')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'prescription'
                                ? 'border-b-2 border-primary bg-gray-750 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <FileText className="inline h-4 w-4 mr-1" />
                            Prescription
                        </button>
                        {isDoctor && (
                            <button
                                onClick={() => setActiveTab('tests')}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'tests'
                                    ? 'border-b-2 border-primary bg-gray-750 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <TestTube className="inline h-4 w-4 mr-1" />
                                Tests
                            </button>
                        )}
                    </div>

                    {/* Tab Content */}
                    <div className="flex flex-1 flex-col overflow-hidden">
                        {/* Chat Tab */}
                        {activeTab === 'chat' && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {messages.length === 0 ? (
                                        <p className="text-center text-gray-400 text-sm py-8">
                                            No messages yet. Start the conversation!
                                        </p>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.sender_id === user?.id
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-700 text-white'
                                                        }`}
                                                >
                                                    <p className="text-sm">{msg.message}</p>
                                                    <p className="mt-1 text-xs opacity-70">
                                                        {new Date(msg.created_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="border-t border-gray-700 p-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type a message..."
                                            className="flex-1 rounded-lg bg-gray-700 px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <Button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim() || sendingMessage}
                                            size="sm"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Prescription Tab */}
                        {activeTab === 'prescription' && (
                            <div className="flex flex-1 flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {prescribedMedicines.length === 0 ? (
                                        <p className="text-center text-gray-400 text-sm py-8">
                                            {isDoctor ? 'No medicines prescribed yet.' : 'No prescription yet.'}
                                        </p>
                                    ) : (
                                        prescribedMedicines.map((med) => (
                                            <div key={med.id} className="rounded-lg bg-gray-700 p-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-white">{med.medicine_name}</h4>
                                                        {med.dosage_quantity && (
                                                            <p className="mt-1 text-sm text-gray-300">
                                                                <strong>Dosage:</strong> {med.dosage_quantity} {med.dosage_unit || 'unit'}
                                                                {med.meal_timing && ` (${med.meal_timing.replace('_', ' ')})`}
                                                            </p>
                                                        )}
                                                        {med.frequency_type === 'specific_times' && (med.morning || med.afternoon || med.night) && (
                                                            <p className="mt-1 text-sm text-gray-300">
                                                                <strong>Frequency:</strong>{' '}
                                                                {[
                                                                    med.morning && 'Morning',
                                                                    med.afternoon && 'Afternoon',
                                                                    med.night && 'Night'
                                                                ].filter(Boolean).join(', ')}
                                                            </p>
                                                        )}
                                                        {med.frequency_type === 'hours_gap' && med.hours_gap && (
                                                            <p className="mt-1 text-sm text-gray-300">
                                                                <strong>Frequency:</strong> Every {med.hours_gap} hours
                                                            </p>
                                                        )}
                                                        {med.duration_days && (
                                                            <p className="mt-1 text-sm text-gray-300">
                                                                <strong>Duration:</strong> {med.duration_days} days
                                                            </p>
                                                        )}
                                                        {med.instructions && (
                                                            <p className="mt-1 text-xs text-gray-400">
                                                                <strong>Instructions:</strong> {med.instructions}
                                                            </p>
                                                        )}
                                                        <p className="mt-2 text-xs text-gray-500">
                                                            {new Date(med.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    {isDoctor && (
                                                        <button
                                                            onClick={() => handleDeleteMedicine(med.id)}
                                                            className="ml-2 text-destructive hover:text-destructive/80"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {isDoctor && (
                                    <div className="border-t border-gray-700 p-4 space-y-3">
                                        <h3 className="text-sm font-semibold text-white">Prescribe Medicine</h3>

                                        {/* Medicine Search with Autocomplete */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={medicineSearch}
                                                onChange={(e) => {
                                                    setMedicineSearch(e.target.value)
                                                    setShowMedicineDropdown(true)
                                                    setSelectedMedicine(null)
                                                }}
                                                onFocus={() => setShowMedicineDropdown(true)}
                                                placeholder="Search or type medicine name..."
                                                className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                            />

                                            {/* Autocomplete Dropdown */}
                                            {showMedicineDropdown && medicineSearch && (
                                                <div className="absolute z-10 mt-1 w-full rounded-lg bg-gray-600 border border-gray-500 max-h-48 overflow-y-auto">
                                                    {filteredMedicines.length > 0 ? (
                                                        filteredMedicines.map((med) => (
                                                            <button
                                                                key={med.id}
                                                                onClick={() => {
                                                                    setSelectedMedicine(med)
                                                                    setMedicineSearch(med.name)
                                                                    setShowMedicineDropdown(false)
                                                                }}
                                                                className="w-full text-left px-3 py-2 hover:bg-gray-500 text-white text-sm"
                                                            >
                                                                <div className="font-medium">{med.name}</div>
                                                                {med.generic_name && (
                                                                    <div className="text-xs text-gray-300">{med.generic_name} - {med.strength}</div>
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-sm text-gray-300">
                                                            No matches. Press "Add Medicine" to add "{medicineSearch}" as new
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>


                                        {/* Dosage Quantity and Unit */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                value={dosageQuantity}
                                                onChange={(e) => setDosageQuantity(e.target.value)}
                                                className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <option value="">Quantity</option>
                                                <option value="0.25">0.25</option>
                                                <option value="0.5">0.5</option>
                                                <option value="1">1</option>
                                                <option value="1.5">1.5</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                            </select>

                                            <select
                                                value={dosageUnit}
                                                onChange={(e) => setDosageUnit(e.target.value)}
                                                className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <option value="tablet">Tablet</option>
                                                <option value="capsule">Capsule</option>
                                                <option value="pcs">Pcs</option>
                                                <option value="spoon">Spoon</option>
                                                <option value="ml">ML</option>
                                                <option value="drop">Drop</option>
                                            </select>
                                        </div>

                                        {/* Meal Timing */}
                                        <select
                                            value={mealTiming}
                                            onChange={(e) => setMealTiming(e.target.value)}
                                            className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="after_meal">After Having Meal</option>
                                            <option value="before_meal">Before Having Meal</option>
                                            <option value="with_meal">With Meal</option>
                                            <option value="empty_stomach">Empty Stomach</option>
                                        </select>

                                        {/* Frequency Type */}
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-300">Frequency:</label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setFrequencyType('specific_times')}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${frequencyType === 'specific_times'
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-700 text-gray-300'
                                                        }`}
                                                >
                                                    Specific Times
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFrequencyType('hours_gap')}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${frequencyType === 'hours_gap'
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-700 text-gray-300'
                                                        }`}
                                                >
                                                    Hours Gap
                                                </button>
                                            </div>
                                        </div>

                                        {/* Specific Times */}
                                        {frequencyType === 'specific_times' && (
                                            <div className="flex gap-2">
                                                <label className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg bg-gray-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={morning}
                                                        onChange={(e) => setMorning(e.target.checked)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-sm text-white">Morning</span>
                                                </label>
                                                <label className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg bg-gray-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={afternoon}
                                                        onChange={(e) => setAfternoon(e.target.checked)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-sm text-white">Afternoon</span>
                                                </label>
                                                <label className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg bg-gray-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={night}
                                                        onChange={(e) => setNight(e.target.checked)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-sm text-white">Night</span>
                                                </label>
                                            </div>
                                        )}

                                        {/* Hours Gap */}
                                        {frequencyType === 'hours_gap' && (
                                            <select
                                                value={hoursGap}
                                                onChange={(e) => setHoursGap(e.target.value)}
                                                className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <option value="">Select Hours Gap</option>
                                                <option value="4">Every 4 hours</option>
                                                <option value="6">Every 6 hours</option>
                                                <option value="8">Every 8 hours</option>
                                                <option value="12">Every 12 hours</option>
                                            </select>
                                        )}

                                        {/* Duration in Days */}
                                        <input
                                            type="number"
                                            value={durationDays}
                                            onChange={(e) => setDurationDays(e.target.value)}
                                            placeholder="Duration (days)"
                                            min="1"
                                            className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />

                                        <textarea
                                            value={medicineInstructions}
                                            onChange={(e) => setMedicineInstructions(e.target.value)}
                                            placeholder="Additional instructions (optional)"
                                            className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                            rows={2}
                                        />

                                        <Button
                                            onClick={handlePrescribeMedicine}
                                            disabled={!medicineSearch.trim() || savingMedicine}
                                            isLoading={savingMedicine}
                                            className="w-full"
                                            size="sm"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Medicine
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tests Tab (Doctor Only) */}
                        {activeTab === 'tests' && isDoctor && (
                            <div className="flex flex-1 flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {prescribedTests.length === 0 ? (
                                        <p className="text-center text-gray-400 text-sm py-8">
                                            No tests prescribed yet.
                                        </p>
                                    ) : (
                                        prescribedTests.map((test) => (
                                            <div key={test.id} className="rounded-lg bg-gray-700 p-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-white">{test.test_name}</h4>
                                                        {test.test_description && (
                                                            <p className="mt-1 text-sm text-gray-300">{test.test_description}</p>
                                                        )}
                                                        {test.instructions && (
                                                            <p className="mt-1 text-xs text-gray-400">
                                                                <strong>Instructions:</strong> {test.instructions}
                                                            </p>
                                                        )}
                                                        <p className="mt-2 text-xs text-gray-500">
                                                            {new Date(test.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteTest(test.id)}
                                                        className="ml-2 text-destructive hover:text-destructive/80"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="border-t border-gray-700 p-4 space-y-3">
                                    <h3 className="text-sm font-semibold text-white">Prescribe Test</h3>

                                    {/* Test Search with Autocomplete */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={testSearch}
                                            onChange={(e) => {
                                                setTestSearch(e.target.value)
                                                setShowTestDropdown(true)
                                                setSelectedTest(null)
                                            }}
                                            onFocus={() => setShowTestDropdown(true)}
                                            placeholder="Search or type test name..."
                                            className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />

                                        {/* Autocomplete Dropdown */}
                                        {showTestDropdown && testSearch && (
                                            <div className="absolute z-10 mt-1 w-full rounded-lg bg-gray-600 border border-gray-500 max-h-48 overflow-y-auto">
                                                {filteredTests.length > 0 ? (
                                                    filteredTests.map((test) => (
                                                        <button
                                                            key={test.id}
                                                            onClick={() => {
                                                                setSelectedTest(test)
                                                                setTestSearch(test.name)
                                                                setShowTestDropdown(false)
                                                            }}
                                                            className="w-full text-left px-3 py-2 hover:bg-gray-500 text-white text-sm"
                                                        >
                                                            <div className="font-medium">{test.name}</div>
                                                            {test.category && (
                                                                <div className="text-xs text-gray-300">{test.category}</div>
                                                            )}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-sm text-gray-300">
                                                        No matches. Press "Add Test" to add "{testSearch}" as new
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <textarea
                                        value={testInstructions}
                                        onChange={(e) => setTestInstructions(e.target.value)}
                                        placeholder="Instructions (optional)"
                                        className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                        rows={2}
                                    />

                                    <Button
                                        onClick={handlePrescribeTest}
                                        disabled={!testSearch.trim() || savingTest}
                                        isLoading={savingTest}
                                        className="w-full"
                                        size="sm"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Test
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
