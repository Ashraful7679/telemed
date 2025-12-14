'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRequireAuth } from '@/lib/auth/hooks'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AvatarUpload } from '@/components/profile/AvatarUpload'

export default function EditProfilePage() {
    const router = useRouter()
    const { user, profile, loading: authLoading } = useRequireAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const supabase = createClient()

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        bio: '',
        qualifications: '',
    })

    const [isDirty, setIsDirty] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null)

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                bio: '',
                qualifications: '',
            })
            setAvatarUrl(profile.avatar_url || null)

            // Fetch doctor-specific data if doctor
            if (profile.role === 'doctor') {
                fetchDoctorInfo()
            }
        }
    }, [profile])

    const fetchDoctorInfo = async () => {
        const { data } = await supabase
            .from('doctors')
            .select('bio, qualifications')
            .eq('id', user?.id)
            .single()

        if (data) {
            setFormData(prev => ({
                ...prev,
                bio: data.bio || '',
                qualifications: data.qualifications || '',
            }))
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setIsDirty(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            // Update profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone || null,
                } as any)
                .eq('id', user?.id)

            if (profileError) throw profileError

            // Update doctor info if doctor
            if (profile?.role === 'doctor') {
                const { error: doctorError } = await supabase
                    .from('doctors')
                    .update({
                        bio: formData.bio || null,
                        qualifications: formData.qualifications || null,
                    } as any)
                    .eq('id', user?.id)

                if (doctorError) throw doctorError
            }

            setSuccess(true)
            setIsDirty(false)

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push('/profile')
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Failed to update profile')
        }

        setLoading(false)
    }

    const handleAvatarUploadSuccess = (url: string) => {
        setAvatarUrl(url)
        setAvatarSuccess('Avatar uploaded successfully!')
        setTimeout(() => setAvatarSuccess(null), 3000)
    }

    const handleAvatarDeleteSuccess = () => {
        setAvatarUrl(null)
        setAvatarSuccess('Avatar removed successfully!')
        setTimeout(() => setAvatarSuccess(null), 3000)
    }

    if (authLoading) {
        return <LoadingSpinner size="lg" className="min-h-screen" />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="container-custom flex h-16 items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary-900">Edit Profile</h1>
                    <Link href="/profile" className="text-sm text-primary hover:underline">
                        ← Back to Profile
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container-custom py-8">
                <div className="mx-auto max-w-2xl">
                    <form onSubmit={handleSubmit} className="card-custom space-y-6">
                        {/* Avatar Upload */}
                        <div>
                            <h3 className="mb-4 font-semibold text-primary-900">Profile Picture</h3>

                            {avatarSuccess && (
                                <div className="mb-4 rounded-md bg-success-50 p-3 text-sm text-success-700">
                                    {avatarSuccess}
                                </div>
                            )}

                            <AvatarUpload
                                userId={user?.id || ''}
                                currentAvatarUrl={avatarUrl}
                                onUploadSuccess={handleAvatarUploadSuccess}
                                onDeleteSuccess={handleAvatarDeleteSuccess}
                            />
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="mb-4 font-semibold text-primary-900">Personal Information</h3>

                            {/* Full Name */}
                            <div className="space-y-2">
                                <label htmlFor="full_name" className="label-custom">
                                    Full Name *
                                </label>
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Phone */}
                            <div className="mt-4 space-y-2">
                                <label htmlFor="phone" className="label-custom">
                                    Phone Number
                                </label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+880 1234567890"
                                />
                            </div>

                            {/* Email (read-only) */}
                            <div className="mt-4 space-y-2">
                                <label htmlFor="email" className="label-custom">
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    value={profile?.email || ''}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Email cannot be changed
                                </p>
                            </div>
                        </div>

                        {/* Doctor-specific fields */}
                        {profile?.role === 'doctor' && (
                            <div className="border-t pt-6">
                                <h3 className="mb-4 font-semibold text-primary-900">Professional Information</h3>

                                {/* Qualifications */}
                                <div className="space-y-2">
                                    <label htmlFor="qualifications" className="label-custom">
                                        Qualifications
                                    </label>
                                    <textarea
                                        id="qualifications"
                                        name="qualifications"
                                        value={formData.qualifications}
                                        onChange={handleChange}
                                        rows={3}
                                        className="input-custom"
                                        placeholder="MBBS, MD, etc."
                                    />
                                </div>

                                {/* Bio */}
                                <div className="mt-4 space-y-2">
                                    <label htmlFor="bio" className="label-custom">
                                        Bio
                                    </label>
                                    <textarea
                                        id="bio"
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        rows={4}
                                        className="input-custom"
                                        placeholder="Tell patients about yourself..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="rounded-md bg-destructive-50 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="rounded-md bg-success-50 p-3 text-sm text-success-700">
                                Profile updated successfully! Redirecting...
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                isLoading={loading}
                                disabled={loading || !isDirty}
                            >
                                Save Changes
                            </Button>
                            <Link href="/profile">
                                <Button type="button" variant="secondary" disabled={loading}>
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
