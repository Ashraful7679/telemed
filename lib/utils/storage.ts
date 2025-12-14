import { createClient } from '@/lib/supabase/client'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface UploadResult {
    success: boolean
    url?: string
    error?: string
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        }
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Only JPG, PNG, and WebP images are allowed',
        }
    }

    return { valid: true }
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatar(
    userId: string,
    file: File
): Promise<UploadResult> {
    const supabase = createClient()

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
        return { success: false, error: validation.error }
    }

    try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/avatar.${fileExt}`

        // Upload to storage
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                upsert: true, // Replace existing file
                contentType: file.type,
            })

        if (error) {
            console.error('Storage upload error:', error)
            return { success: false, error: error.message }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

        // Update profile with avatar URL
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: urlData.publicUrl } as any)
            .eq('id', userId)

        if (updateError) {
            console.error('Profile update error:', updateError)
            return { success: false, error: updateError.message }
        }

        return { success: true, url: urlData.publicUrl }
    } catch (err: any) {
        console.error('Upload error:', err)
        return { success: false, error: err.message || 'Upload failed' }
    }
}

/**
 * Delete avatar from Supabase Storage
 */
export async function deleteAvatar(userId: string): Promise<UploadResult> {
    const supabase = createClient()

    try {
        // List all files in user's folder
        const { data: files, error: listError } = await supabase.storage
            .from('avatars')
            .list(userId)

        if (listError) {
            return { success: false, error: listError.message }
        }

        // Delete all files
        if (files && files.length > 0) {
            const filePaths = files.map((file) => `${userId}/${file.name}`)
            const { error: deleteError } = await supabase.storage
                .from('avatars')
                .remove(filePaths)

            if (deleteError) {
                return { success: false, error: deleteError.message }
            }
        }

        // Update profile to remove avatar URL
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: null } as any)
            .eq('id', userId)

        if (updateError) {
            return { success: false, error: updateError.message }
        }

        return { success: true }
    } catch (err: any) {
        console.error('Delete error:', err)
        return { success: false, error: err.message || 'Delete failed' }
    }
}

/**
 * Get avatar URL from storage path
 */
export function getAvatarUrl(path: string | null): string | null {
    if (!path) return null

    const supabase = createClient()
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)

    return data.publicUrl
}
