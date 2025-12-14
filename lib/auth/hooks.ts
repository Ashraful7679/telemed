'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types/database.types'

interface Profile {
    id: string
    email: string
    full_name: string
    role: UserRole
    avatar_url: string | null
    gender: string | null
    is_blocked: boolean
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setLoading(false)
            }
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error
            setProfile(data)
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    return {
        user,
        profile,
        loading,
        signOut,
        isAuthenticated: !!user,
        isPatient: profile?.role === 'patient',
        isDoctor: profile?.role === 'doctor',
        isAdmin: profile?.role === 'admin',
    }
}

export function useUser() {
    const { user, profile, loading } = useAuth()
    return { user, profile, loading }
}

export function useRequireAuth(requiredRoles?: UserRole | UserRole[]) {
    const { user, profile, loading } = useAuth()
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        if (!loading) {
            console.log('Auth Check:', { user: !!user, profile, requiredRoles })

            if (!user) {
                console.log('No user, redirecting to login')
                window.location.href = '/login'
                return
            }

            if (profile?.is_blocked) {
                console.log('User is blocked')
                window.location.href = '/blocked'
                return
            }

            if (requiredRoles) {
                const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
                const hasRequiredRole = rolesArray.includes(profile?.role as UserRole)

                console.log('Role check:', {
                    userRole: profile?.role,
                    requiredRoles: rolesArray,
                    hasAccess: hasRequiredRole
                })

                if (!hasRequiredRole) {
                    console.log('User does not have required role, redirecting to unauthorized')
                    window.location.href = '/unauthorized'
                    return
                }
            }

            console.log('Authorization successful')
            setAuthorized(true)
        }
    }, [user, profile, loading, requiredRoles])

    return { user, profile, loading, authorized }
}
