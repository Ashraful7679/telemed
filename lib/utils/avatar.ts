/**
 * Get default avatar based on user gender and role
 */
export function getDefaultAvatar(gender: string | null, role: string): string {
    if (role === 'doctor') {
        return gender === 'female'
            ? '/avatars/female-doctor.jpg'
            : '/avatars/male-doctor.webp'
    }

    if (role === 'admin') {
        return '/avatars/admin-avatar.png'
    }

    // patient
    return gender === 'female'
        ? '/avatars/female-patient.jpg'
        : '/avatars/male-patient.png'
}

/**
 * Get avatar URL with fallback to default
 */
export function getAvatarUrl(
    avatarUrl: string | null,
    gender: string | null,
    role: string
): string {
    return avatarUrl || getDefaultAvatar(gender, role)
}
