'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AvatarUpload } from '@/components/profile/AvatarUpload'

export default function DoctorSignupPage() {
    const [specializations, setSpecializations] = useState<any[]>([])
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
        medicalLicenseNumber: '',
        specializationId: '',
        experienceYears: '',
        qualifications: '',
        bio: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        fetchSpecializations()
    }, [])

    const fetchSpecializations = async () => {
        const { data } = await supabase
            .from('specializations')
            .select('*')
            .order('name')
        if (data) setSpecializations(data)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

        if (!formData.specializationId) {
            setError('Please select a specialization')
            return
        }

        const experienceYears = parseInt(formData.experienceYears)
        if (isNaN(experienceYears) || experienceYears < 0) {
            setError('Please enter valid years of experience')
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
                role: 'doctor',
            }] as any)

            if (profileError) throw profileError

            // Create doctor profile
            const { error: doctorError } = await supabase.from('doctors').insert([{
                id: authData.user.id,
                medical_license_number: formData.medicalLicenseNumber,
                specialization_id: formData.specializationId,
                experience_years: experienceYears,
                qualifications: formData.qualifications || null,
                bio: formData.bio || null,
                status: 'pending',
            }] as any)

            if (doctorError) throw doctorError

            // Redirect to pending approval page
            router.push('/doctor/pending-approval')
        } catch (err: any) {
            setError(err.message || 'Failed to create account')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-12">
            <div className="w-full max-w-2xl">
                <div className="card-custom animate-fade-in">
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-bold text-primary-900">TeleMed</h1>
                        <p className="mt-2 text-muted-foreground">Register as a Doctor</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Input
                                label="Full Name"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Dr. John Doe"
                                required
                            />
                        </div>

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

                        <div className="grid gap-4 md:grid-cols-2">
                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="doctor@email.com"
                                required
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Input
                                label="Phone"
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+880 1234567890"
                                required
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
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Input
                                label="Date of Birth"
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                            />

                            <Input
                                label="City"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Dhaka"
                            />
                        </div>

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

                        <div className="grid gap-4 md:grid-cols-2">
                            <Input
                                label="Medical License Number"
                                name="medicalLicenseNumber"
                                value={formData.medicalLicenseNumber}
                                onChange={handleChange}
                                placeholder="BM-12345"
                                required
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="label-custom mb-2 block">Specialization</label>
                                <select
                                    name="specializationId"
                                    value={formData.specializationId}
                                    onChange={handleChange}
                                    className="input-custom"
                                    required
                                >
                                    <option value="">Select specialization</option>
                                    {specializations.map((spec) => (
                                        <option key={spec.id} value={spec.id}>
                                            {spec.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label="Years of Experience"
                                type="number"
                                name="experienceYears"
                                value={formData.experienceYears}
                                onChange={handleChange}
                                placeholder="5"
                                min="0"
                                required
                            />
                        </div>

                        <div>
                            <label className="label-custom mb-2 block">Qualifications</label>
                            <input
                                name="qualifications"
                                value={formData.qualifications}
                                onChange={handleChange}
                                className="input-custom"
                                placeholder="MBBS, MD (Cardiology)"
                            />
                        </div>

                        <div>
                            <label className="label-custom mb-2 block">Bio</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                className="input-custom min-h-[100px]"
                                placeholder="Brief description about yourself and your practice..."
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
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
                        </div>

                        {error && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="rounded-md bg-primary-50 p-4 text-sm text-primary-900">
                            <p className="font-medium">Note:</p>
                            <p className="mt-1">
                                Your account will be pending approval by our admin team. You'll be notified once approved.
                            </p>
                        </div>

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Register
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
