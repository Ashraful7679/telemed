'use client'

import Link from 'next/link'
import { useRequireAuth } from '@/lib/auth/hooks'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function DoctorDashboardPage() {
    const { user, profile, loading } = useRequireAuth(['doctor'])

    if (loading) {
        return <LoadingSpinner size="lg" className="min-h-screen" />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="container-custom flex h-16 items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary-900">Doctor Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <Link href="/profile" className="text-sm text-primary hover:underline">
                            Profile
                        </Link>
                        <span className="text-sm text-muted-foreground">
                            {profile?.full_name}
                        </span>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="text-sm text-primary hover:underline"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container-custom py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Welcome, Dr. {profile?.full_name}!
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Manage your appointments and availability.
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Link href="/doctor/availability" className="card-custom hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold text-primary-900">📅 Manage Availability</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Set your available time slots and consultation fees
                        </p>
                    </Link>

                    <Link href="/doctor/appointments" className="card-custom hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold text-primary-900">📋 Appointments</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            View and manage your appointments
                        </p>
                    </Link>
                </div>
            </main>
        </div>
    )
}
