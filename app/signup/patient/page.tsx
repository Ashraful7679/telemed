'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AvatarUpload } from '@/components/profile/AvatarUpload'

export default function PatientSignupPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        gender: 'male',
        dateOfBirth: '',
        address: '',
        city: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        try {
            // Sign up user
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            })

            if (signUpError) throw signUpError

            if (!authData.user) {
                throw new Error('Failed to create user')
            }

            // Create profile
            const { error: profileError } = await supabase.from('profiles').insert([{
                id: authData.user.id,
                email: formData.email,
                full_name: formData.fullName,
                phone: formData.phone || null,
                gender: formData.gender,
                date_of_birth: formData.dateOfBirth || null,
                address: formData.address || null,
                city: formData.city || null,
                avatar_url: avatarUrl,
                role: 'patient',
            }] as any)

            if (profileError) throw profileError

            // Redirect to home
            router.push('/')
        } catch (err: any) {
            setError(err.message || 'Failed to create account')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="card-custom animate-fade-in">
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-bold text-primary-900">TeleMed</h1>
                        <p className="mt-2 text-muted-foreground">Create your patient account</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <Input
                            label="Full Name"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="John Doe"
                            required
                        />

                        <div>
                            <h3 className="mb-2 font-medium text-gray-900">Profile Picture (Optional)</h3>
                            <AvatarUpload
                                userId="temp-user-id"
                                currentAvatarUrl={avatarUrl}
                                onUploadSuccess={(url) => setAvatarUrl(url)}
                                onDeleteSuccess={() => setAvatarUrl(null)}
                            />
                            <p className="mt-2 text-xs text-muted-foreground">
                                You can upload your profile picture now or later from your profile settings
                            </p>
                        </div>

                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            required
                        />

                        <Input
                            label="Phone (Optional)"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+880 1234567890"
                        />

                        <div>
                            <label htmlFor="gender" className="label-custom">
                                Gender *
                            </label>
                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="input-custom"
                                required
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <Input
                            label="Date of Birth"
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                        />

                        <div>
                            <label htmlFor="address" className="label-custom">
                                Address (Optional)
                            </label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={2}
                                className="input-custom"
                                placeholder="Street address"
                            />
                        </div>

                        <Input
                            label="City (Optional)"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Dhaka"
                        />

                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            helperText="At least 6 characters"
                            required
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />

                        {error && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/login" className="font-medium text-primary hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
