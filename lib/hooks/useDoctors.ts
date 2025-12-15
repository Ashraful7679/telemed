'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useDoctors() {
    const supabase = createClient()

    const { data, error, isLoading } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_doctors_with_details')
            if (error) throw new Error(error.message)
            return data
        }
    })

    return {
        doctors: data,
        error,
        isLoading
    }
}
