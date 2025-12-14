'use client'

import Link from 'next/link'
import { useRequireAuth } from '@/lib/auth/hooks'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function AdminDashboardPage() {
    const { user, profile, loading } = useRequireAuth(['admin'])

    if (loading) {
        return <LoadingSpinner size="lg" className="min-h-screen" />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="container-custom flex h-16 items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary-900">Admin Dashboard</h1>
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
                        Welcome, {profile?.full_name}!
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Manage your telemedicine platform from here.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="card-custom">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
                        <p className="mt-2 text-3xl font-bold text-primary-900">-</p>
                        <p className="mt-1 text-xs text-muted-foreground">Coming soon</p>
                    </div>

                    <div className="card-custom">
                        <h3 className="text-sm font-medium text-muted-foreground">Pending Doctors</h3>
                        <p className="mt-2 text-3xl font-bold text-warning-500">-</p>
                        <p className="mt-1 text-xs text-muted-foreground">Coming soon</p>
                    </div>

                    <div className="card-custom">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Appointments</h3>
                        <p className="mt-2 text-3xl font-bold text-primary-900">-</p>
                        <p className="mt-1 text-xs text-muted-foreground">Coming soon</p>
                    </div>

                    <div className="card-custom">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
                        <p className="mt-2 text-3xl font-bold text-success-500">৳0</p>
                        <p className="mt-1 text-xs text-muted-foreground">Coming soon</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Link href="/admin/approve-doctors" className="card-custom text-left transition-all hover:shadow-md block">
                            <h4 className="font-semibold text-primary-900">Approve Doctors</h4>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Review and approve pending doctor registrations
                            </p>
                            <p className="mt-2 text-xs text-primary-600">Click to view →</p>
                        </Link>

                        <button className="card-custom text-left transition-all hover:shadow-md">
                            <h4 className="font-semibold text-primary-900">Manage Users</h4>
                            <p className="mt-1 text-sm text-muted-foreground">
                                View and manage all platform users
                            </p>
                            <p className="mt-2 text-xs text-warning-600">Coming soon</p>
                        </button>

                        <button className="card-custom text-left transition-all hover:shadow-md">
                            <h4 className="font-semibold text-primary-900">View Reports</h4>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Access platform analytics and reports
                            </p>
                            <p className="mt-2 text-xs text-warning-600">Coming soon</p>
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-8 rounded-lg bg-primary-50 p-6">
                    <h3 className="font-semibold text-primary-900">🎉 Admin Dashboard</h3>
                    <p className="mt-2 text-sm text-primary-800">
                        You have successfully logged in as an admin! The full admin panel features are coming soon.
                    </p>
                    <p className="mt-2 text-sm text-primary-800">
                        <strong>Current Status:</strong>
                    </p>
                    <ul className="mt-2 ml-4 list-disc text-sm text-primary-800">
                        <li>✅ Authentication system working</li>
                        <li>✅ Admin role verified</li>
                        <li>✅ Database connected</li>
                        <li>🔨 Admin features in development</li>
                    </ul>
                </div>
            </main>
        </div>
    )
}
