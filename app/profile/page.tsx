'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRequireAuth } from '@/lib/auth/hooks'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { User, Mail, Phone, Shield, Edit } from 'lucide-react'
import Image from 'next/image'

interface DoctorInfo {
    medical_license_number: string
    experience_years: number
    qualifications: string | null
    bio: string | null
    status: string
    specializations: {
        name: string
    }
}

export default function ProfilePage() {
    const { user, profile, loading: authLoading } = useRequireAuth()
    const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!authLoading && profile?.role === 'doctor') {
            fetchDoctorInfo()
        } else if (!authLoading) {
            setLoading(false)
        }
    }, [authLoading, profile])

    const fetchDoctorInfo = async () => {
        const { data } = await supabase
            .from('doctors')
            .select('*, specializations(name)')
            .eq('id', user?.id)
            .single()

        if (data) {
            setDoctorInfo(data as any)
        }
        setLoading(false)
    }

    if (authLoading || loading) {
        return <LoadingSpinner size="lg" className="min-h-screen" />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="container-custom flex h-16 items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary-900">My Profile</h1>
                    <div className="flex items-center gap-4">
                        <Link href="/profile/edit">
                            <Button size="sm">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Profile
                            </Button>
                        </Link>
                        <Link
                            href={
                                profile?.role === 'admin' ? '/admin/dashboard' :
                                    profile?.role === 'doctor' ? '/doctor/dashboard' :
                                        '/'
                            }
                            className="text-sm text-primary hover:underline"
                        >
                            ← Back
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container-custom py-8">
                <div className="mx-auto max-w-3xl">
                    {/* Profile Card */}
                    <div className="card-custom">
                        {/* Avatar and Name */}
                        <div className="flex items-start gap-6 border-b pb-6">
                            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-primary-100">
                                {profile?.avatar_url ? (
                                    <Image
                                        src={profile.avatar_url}
                                        alt={profile.full_name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-3xl font-semibold text-primary">
                                        {profile?.full_name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-primary-900">
                                    {profile?.full_name}
                                </h2>
                                <div className="mt-2 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm capitalize text-muted-foreground">
                                        {profile?.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="mt-6 space-y-4">
                            <h3 className="font-semibold text-primary-900">Contact Information</h3>

                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{profile?.email}</p>
                                </div>
                            </div>

                            {profile?.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="font-medium">{profile.phone}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Doctor-specific Information */}
                        {profile?.role === 'doctor' && doctorInfo && (
                            <div className="mt-6 border-t pt-6 space-y-4">
                                <h3 className="font-semibold text-primary-900">Professional Information</h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Specialization</p>
                                        <p className="font-medium">{doctorInfo.specializations.name}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">Experience</p>
                                        <p className="font-medium">{doctorInfo.experience_years} years</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">License Number</p>
                                        <p className="font-medium">{doctorInfo.medical_license_number}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${doctorInfo.status === 'approved' ? 'bg-success-100 text-success-700' :
                                                doctorInfo.status === 'pending' ? 'bg-warning-100 text-warning-700' :
                                                    'bg-destructive-100 text-destructive-700'
                                            }`}>
                                            {doctorInfo.status}
                                        </span>
                                    </div>
                                </div>

                                {doctorInfo.qualifications && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Qualifications</p>
                                        <p className="mt-1">{doctorInfo.qualifications}</p>
                                    </div>
                                )}

                                {doctorInfo.bio && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bio</p>
                                        <p className="mt-1">{doctorInfo.bio}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
