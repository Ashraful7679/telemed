'use client'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function DoctorPendingApprovalPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
            <div className="w-full max-w-md">
                <div className="card-custom animate-fade-in text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning-100">
                        <svg
                            className="h-8 w-8 text-warning-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-primary-900">Pending Approval</h1>
                    <p className="mt-2 text-muted-foreground">
                        Your doctor registration is pending admin approval.
                    </p>

                    <div className="mt-6 rounded-lg bg-primary-50 p-4 text-left text-sm">
                        <p className="font-medium text-primary-900">What happens next?</p>
                        <ul className="mt-2 ml-4 list-disc space-y-1 text-primary-800">
                            <li>Our admin team will review your credentials</li>
                            <li>You'll receive an email once approved</li>
                            <li>After approval, you can set your availability</li>
                            <li>Start accepting patient appointments</li>
                        </ul>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="text-sm text-primary hover:underline"
                        >
                            Return to Homepage
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
