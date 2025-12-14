'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/lib/auth/hooks'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface PendingDoctor {
    id: string
    medical_license_number: string
    experience_years: number
    qualifications: string | null
    bio: string | null
    status: string
    created_at: string
    profiles: {
        full_name: string
        email: string
        phone: string | null
    }
    specializations: {
        name: string
    }
}

export default function AdminApproveDoctorsPage() {
    const { loading: authLoading } = useRequireAuth(['admin'])
    const [doctors, setDoctors] = useState<PendingDoctor[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if (!authLoading) {
            fetchPendingDoctors()
        }
    }, [authLoading])

    const fetchPendingDoctors = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('doctors')
            .select(`
        id,
        medical_license_number,
        experience_years,
        qualifications,
        bio,
        status,
        created_at,
        profiles!inner(full_name, email, phone),
        specializations!inner(name)
      `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching doctors:', error)
        } else {
            setDoctors(data as any)
        }
        setLoading(false)
    }

    const handleApprove = async (doctorId: string) => {
        setActionLoading(doctorId)
        console.log('=== APPROVING DOCTOR ===', doctorId)

        try {
            const response = await fetch('/api/admin/approve-doctor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doctorId, status: 'approved' })
            })

            const result = await response.json()
            console.log('API response:', result)

            if (!response.ok) {
                console.error('API error:', result.error)
                alert('Error approving doctor: ' + result.error)
            } else {
                console.log('Success! Doctor approved')
                alert('Doctor approved successfully!')
                fetchPendingDoctors()
            }
        } catch (err: any) {
            console.error('Caught exception:', err)
            alert('Error approving doctor: ' + (err.message || 'Unknown error'))
        }

        setActionLoading(null)
    }

    const handleReject = async (doctorId: string) => {
        const reason = prompt('Reason for rejection (optional):')
        setActionLoading(doctorId)
        console.log('=== REJECTING DOCTOR ===', doctorId, 'Reason:', reason)

        try {
            const response = await fetch('/api/admin/approve-doctor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doctorId, status: 'rejected' })
            })

            const result = await response.json()
            console.log('API response:', result)

            if (!response.ok) {
                console.error('API error:', result.error)
                alert('Error rejecting doctor: ' + result.error)
            } else {
                console.log('Success! Doctor rejected')
                alert('Doctor rejected' + (reason ? `: ${reason}` : ''))
                fetchPendingDoctors()
            }
        } catch (err: any) {
            console.error('Caught exception:', err)
            alert('Error rejecting doctor: ' + (err.message || 'Unknown error'))
        }

        setActionLoading(null)
    }

    if (authLoading || loading) {
        return <LoadingSpinner size="lg" className="min-h-screen" />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="container-custom flex h-16 items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary-900">Approve Doctors</h1>
                    <Link href="/admin/dashboard" className="text-sm text-primary hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container-custom py-8">
                {doctors.length === 0 ? (
                    <div className="card-custom text-center">
                        <p className="text-muted-foreground">No pending doctor approvals</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {doctors.map((doctor) => (
                            <div key={doctor.id} className="card-custom">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary">
                                                {doctor.profiles.full_name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-primary-900">
                                                    {doctor.profiles.full_name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {doctor.specializations.name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Contact</p>
                                                <p className="text-sm text-muted-foreground">{doctor.profiles.email}</p>
                                                {doctor.profiles.phone && (
                                                    <p className="text-sm text-muted-foreground">{doctor.profiles.phone}</p>
                                                )}
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-700">License</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {doctor.medical_license_number}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Experience</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {doctor.experience_years} years
                                                </p>
                                            </div>

                                            {doctor.qualifications && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Qualifications</p>
                                                    <p className="text-sm text-muted-foreground">{doctor.qualifications}</p>
                                                </div>
                                            )}
                                        </div>

                                        {doctor.bio && (
                                            <div className="mt-4">
                                                <p className="text-sm font-medium text-gray-700">Bio</p>
                                                <p className="text-sm text-muted-foreground">{doctor.bio}</p>
                                            </div>
                                        )}

                                        <div className="mt-4">
                                            <p className="text-xs text-muted-foreground">
                                                Applied: {new Date(doctor.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="ml-4 flex flex-col gap-2">
                                        <Button
                                            onClick={() => handleApprove(doctor.id)}
                                            isLoading={actionLoading === doctor.id}
                                            disabled={!!actionLoading}
                                            className="bg-success-600 hover:bg-success-700"
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            onClick={() => handleReject(doctor.id)}
                                            isLoading={actionLoading === doctor.id}
                                            disabled={!!actionLoading}
                                            variant="danger"
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
