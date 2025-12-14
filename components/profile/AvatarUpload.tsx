'use client'

import { useState, useRef } from 'react'
import { Upload, X, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { validateImageFile } from '@/lib/utils/storage'
import Image from 'next/image'

interface AvatarUploadProps {
    userId: string
    currentAvatarUrl?: string | null
    onUploadSuccess?: (url: string) => void
    onDeleteSuccess?: () => void
}

export function AvatarUpload({
    userId,
    currentAvatarUrl,
    onUploadSuccess,
    onDeleteSuccess,
}: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file
        const validation = validateImageFile(file)
        if (!validation.valid) {
            setError(validation.error || 'Invalid file')
            return
        }

        // Show preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result as string)
            setError(null)
        }
        reader.readAsDataURL(file)
    }

    const handleUpload = async () => {
        const file = fileInputRef.current?.files?.[0]
        if (!file) return

        setUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('userId', userId)

            const response = await fetch('/api/upload-avatar', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
                setError(result.error || 'Upload failed')
            } else if (result.url) {
                setPreview(null)
                onUploadSuccess?.(result.url)
            }
        } catch (err: any) {
            setError(err.message || 'Upload failed')
        }

        setUploading(false)
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete your avatar?')) return

        setUploading(true)
        setError(null)

        try {
            const response = await fetch('/api/upload-avatar', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            })

            const result = await response.json()

            if (!response.ok) {
                setError(result.error || 'Delete failed')
            } else {
                setPreview(null)
                onDeleteSuccess?.()
            }
        } catch (err: any) {
            setError(err.message || 'Delete failed')
        }

        setUploading(false)
    }

    const handleCancel = () => {
        setPreview(null)
        setError(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const displayUrl = preview || currentAvatarUrl

    return (
        <div className="space-y-4">
            {/* Avatar Display */}
            <div className="flex items-center gap-6">
                <div className="relative h-24 w-24 overflow-hidden rounded-full bg-primary-100">
                    {displayUrl ? (
                        <Image
                            src={displayUrl}
                            alt="Avatar"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-3xl font-semibold text-primary">
                            <User className="h-12 w-12" />
                        </div>
                    )}
                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <LoadingSpinner size="sm" />
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground">
                        JPG, PNG or WebP. Max size 2MB.
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-md bg-destructive-50 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Action Buttons */}
            <div className="flex gap-2">
                {preview ? (
                    <>
                        <Button
                            type="button"
                            onClick={handleUpload}
                            isLoading={uploading}
                            disabled={uploading}
                        >
                            Upload
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCancel}
                            variant="secondary"
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            variant="secondary"
                            disabled={uploading}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Choose Image
                        </Button>
                        {currentAvatarUrl && (
                            <Button
                                type="button"
                                onClick={handleDelete}
                                variant="danger"
                                disabled={uploading}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Remove
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
