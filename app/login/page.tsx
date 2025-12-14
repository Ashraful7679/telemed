'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) throw signInError

            // Check if user is blocked
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, is_blocked')
                .eq('id', data.user.id)
                .single() as any

            if (profile?.is_blocked) {
                await supabase.auth.signOut()
                setError('Your account has been blocked. Please contact support.')
                return
            }

            // Redirect based on role
            if (profile?.role === 'admin') {
                router.push('/admin/dashboard')
            } else if (profile?.role === 'doctor') {
                router.push('/doctor/dashboard')
            } else {
                router.push('/')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to sign in')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
            <div className="w-full max-w-md">
                <div className="card-custom animate-fade-in">
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-bold text-primary-900">TeleMed</h1>
                        <p className="mt-2 text-muted-foreground">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />

                        {error && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 space-y-3 text-center text-sm">
                        <p className="text-muted-foreground">
                            Don't have an account?{' '}
                            <Link href="/signup/patient" className="font-medium text-primary hover:underline">
                                Sign up as Patient
                            </Link>
                        </p>
                        <p className="text-muted-foreground">
                            Are you a doctor?{' '}
                            <Link href="/signup/doctor" className="font-medium text-primary hover:underline">
                                Register as Doctor
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
