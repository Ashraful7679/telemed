'use client'

import Link from 'next/link'

export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-destructive-50 to-destructive-100 px-4">
            <div className="w-full max-w-md">
                <div className="card-custom animate-fade-in text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive-100">
                        <svg
                            className="h-8 w-8 text-destructive"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                    <p className="mt-2 text-muted-foreground">
                        You don't have permission to access this page.
                    </p>

                    <div className="mt-6 space-y-3">
                        <Link
                            href="/login"
                            className="block w-full rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
                        >
                            Go to Login
                        </Link>
                        <Link
                            href="/"
                            className="block text-sm text-primary hover:underline"
                        >
                            Return to Homepage
                        </Link>
                    </div>

                    <div className="mt-6 rounded-lg bg-muted p-4 text-left text-sm">
                        <p className="font-medium text-foreground">Common reasons:</p>
                        <ul className="mt-2 ml-4 list-disc space-y-1 text-muted-foreground">
                            <li>You're not logged in</li>
                            <li>Your account doesn't have the required role</li>
                            <li>Your session has expired</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
