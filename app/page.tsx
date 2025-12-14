'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Search, Star, MapPin, Clock, Calendar } from 'lucide-react'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/helpers'
import { getAvatarUrl } from '@/lib/utils/avatar'
import { useAuth } from '@/lib/auth/hooks'

interface Doctor {
    id: string
    profiles: {
        full_name: string
        avatar_url: string | null
        gender: string | null
    }
    specializations: {
        name: string
    }
    experience_years: number
    average_rating: number
    total_reviews: number
    is_popular: boolean
    next_appointment_date?: string
    available_slots_count?: number
}

export default function HomePage() {
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedSpecialization, setSelectedSpecialization] = useState('')
    const [specializations, setSpecializations] = useState<any[]>([])
    const supabase = createClient()
    const { user, profile } = useAuth()

    useEffect(() => {
        fetchSpecializations()
        fetchDoctors()
    }, [])

    const fetchSpecializations = async () => {
        const { data } = await supabase
            .from('specializations')
            .select('*')
            .order('name')
        if (data) setSpecializations(data)
    }

    const fetchDoctors = async () => {
        let query = supabase
            .from('doctors')
            .select(`
        id,
        experience_years,
        average_rating,
        total_reviews,
        is_popular,
        profiles!inner(full_name, avatar_url, gender),
        specializations!inner(name)
      `)
            .eq('status', 'approved')
            .order('is_popular', { ascending: false })
            .order('average_rating', { ascending: false })

        const { data, error } = await query

        if (error) {
            console.error('Error fetching doctors:', error)
        } else if (data) {
            // Fetch next appointment info for each doctor
            const doctorsWithSlots = await Promise.all(
                (data as any[]).map(async (doctor) => {
                    const { data: nextSlot } = await supabase
                        .from('availability_slots')
                        .select('slot_date, max_appointments')
                        .eq('doctor_id', doctor.id)
                        .gte('slot_date', new Date().toISOString().split('T')[0])
                        .order('slot_date', { ascending: true })
                        .limit(1)
                        .single()

                    // Count total available slots for upcoming appointments
                    const { data: upcomingSlots } = await supabase
                        .from('availability_slots')
                        .select('id, max_appointments')
                        .eq('doctor_id', doctor.id)
                        .gte('slot_date', new Date().toISOString().split('T')[0])

                    let totalAvailable = 0
                    if (upcomingSlots) {
                        for (const slot of upcomingSlots) {
                            const { count } = await supabase
                                .from('appointments')
                                .select('*', { count: 'exact', head: true })
                                .eq('slot_id', slot.id)
                                .in('payment_status', ['paid', 'pending'])
                                .not('status', 'eq', 'cancelled')

                            totalAvailable += slot.max_appointments - (count || 0)
                        }
                    }

                    return {
                        ...doctor,
                        next_appointment_date: nextSlot?.slot_date,
                        available_slots_count: totalAvailable
                    }
                })
            )

            setDoctors(doctorsWithSlots)
        }
        setLoading(false)
    }

    const filteredDoctors = doctors.filter((doctor) => {
        const matchesSearch = doctor.profiles.full_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        const matchesSpecialization =
            !selectedSpecialization ||
            doctor.specializations.name === selectedSpecialization
        return matchesSearch && matchesSpecialization
    })

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.reload()
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
            {/* Hero Section */}
            <section className="container-custom py-16 text-center">
                <h1 className="text-4xl font-bold text-primary-900 md:text-5xl">
                    Consult with Expert Doctors Online
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                    Book appointments with verified doctors and get instant medical consultation via video call
                </p>

                {/* Search Bar */}
                <div className="mx-auto mt-8 max-w-3xl">
                    <div className="flex flex-col gap-4 md:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-5 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="    Search doctors by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-custom pl-10"
                            />
                        </div>
                        <select
                            value={selectedSpecialization}
                            onChange={(e) => setSelectedSpecialization(e.target.value)}
                            className="input-custom md:w-64"
                        >
                            <option value="">All Specializations</option>
                            {specializations.map((spec) => (
                                <option key={spec.id} value={spec.name}>
                                    {spec.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            {/* Doctors List */}
            <section className="container-custom pb-16">
                {loading ? (
                    <LoadingSpinner size="lg" className="py-12" />
                ) : filteredDoctors.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        No doctors found matching your criteria
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredDoctors.map((doctor) => (
                            <Link
                                key={doctor.id}
                                href={`/doctors/${doctor.id}`}
                                className="card-custom group transition-all hover:shadow-md"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-primary-100">
                                        <Image
                                            src={getAvatarUrl(
                                                doctor.profiles.avatar_url,
                                                doctor.profiles.gender,
                                                'doctor'
                                            )}
                                            alt={doctor.profiles.full_name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-primary-900 group-hover:text-primary">
                                                    {doctor.profiles.full_name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {doctor.specializations.name}
                                                </p>
                                            </div>
                                            {doctor.is_popular && (
                                                <span className="rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary">
                                                    Popular
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                <span>{doctor.experience_years}y exp</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span>
                                                    {doctor.average_rating.toFixed(1)} ({doctor.total_reviews})
                                                </span>
                                            </div>
                                        </div>

                                        {/* Availability Info */}
                                        {doctor.next_appointment_date && (
                                            <div className="mt-3 rounded-md bg-success-50 px-3 py-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-1 text-success-700">
                                                        <Calendar className="h-4 w-4" />
                                                        <span className="font-medium">
                                                            Next: {new Date(doctor.next_appointment_date).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    {doctor.available_slots_count !== undefined && doctor.available_slots_count > 0 && (
                                                        <span className="text-xs font-semibold text-success-700">
                                                            {doctor.available_slots_count} slots available
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="border-t bg-primary-900 py-8 text-white">
                <div className="container-custom text-center">
                    <p className="text-sm">
                        © 2025 TeleMed. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
