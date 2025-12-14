// Helper functions for payment and serial number management

import { createClient } from '@/lib/supabase/client'

/**
 * Calculate exact appointment time based on serial number
 */
export function calculateExactTime(
    startTime: string,
    serialNumber: number,
    duration: number
): string {
    const [hours, minutes] = startTime.split(':').map(Number)
    const offsetMinutes = (serialNumber - 1) * duration

    const totalMinutes = hours * 60 + minutes + offsetMinutes
    const newHours = Math.floor(totalMinutes / 60)
    const newMinutes = totalMinutes % 60

    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
}

/**
 * Get next available serial number for a slot
 */
export async function getNextSerialNumber(slotId: string): Promise<number> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('appointments')
        .select('serial_number')
        .eq('slot_id', slotId)
        .not('serial_number', 'is', null)
        .order('serial_number', { ascending: false })
        .limit(1) as { data: { serial_number: number }[] | null; error: any }

    if (error) {
        console.error('Error getting serial number:', error)
        return 1
    }

    return (data?.[0]?.serial_number || 0) + 1
}

/**
 * Assign serial number and exact time to appointment after payment
 */
export async function assignSerialNumber(appointmentId: string) {
    const supabase = createClient()

    // Get appointment and slot details
    type AppointmentWithSlot = {
        id: string
        slot_id: string
        appointment_date: string
        availability_slots: {
            start_time: string
            appointment_duration: number
        }
    }

    const { data: appointment, error: aptError } = await supabase
        .from('appointments')
        .select('*, availability_slots(*)')
        .eq('id', appointmentId)
        .single() as { data: AppointmentWithSlot | null; error: any }

    if (aptError || !appointment) {
        throw new Error('Appointment not found')
    }

    const slot = appointment.availability_slots

    // Get next serial number
    const serialNumber = await getNextSerialNumber(appointment.slot_id)

    // Calculate exact time
    const exactTime = calculateExactTime(
        slot.start_time,
        serialNumber,
        slot.appointment_duration
    )

    // Calculate reservation start and end times
    const appointmentDate = new Date(appointment.appointment_date)
    const [hours, minutes] = exactTime.split(':').map(Number)
    
    // Set reservation start time
    const reservationStart = new Date(appointmentDate)
    reservationStart.setHours(hours, minutes, 0, 0)
    
    // Set reservation end time (start + duration)
    const reservationEnd = new Date(reservationStart)
    reservationEnd.setMinutes(reservationEnd.getMinutes() + slot.appointment_duration)


    // Update appointment
    type AppointmentUpdate = {
        serial_number?: number | null
        exact_appointment_time?: string | null
        reservation_start_time?: string | null
        reservation_end_time?: string | null
        reservation_duration_minutes?: number | null
        payment_status?: 'pending' | 'paid' | 'completed' | 'failed' | 'refunded'
        status?: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
        paid_at?: string | null
    }

    const updateData: AppointmentUpdate = {
        serial_number: serialNumber,
        exact_appointment_time: exactTime,
        reservation_start_time: reservationStart.toISOString(),
        reservation_end_time: reservationEnd.toISOString(),
        reservation_duration_minutes: slot.appointment_duration,
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: new Date().toISOString()
    }

    // Workaround: Create untyped client for update due to Supabase type inference issue
    const { createBrowserClient } = await import('@supabase/ssr')
    const untypedSupabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error: updateError } = await untypedSupabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)

    if (updateError) {
        throw updateError
    }

    return { serialNumber, exactTime, duration: slot.appointment_duration }
}

/**
 * Format BDT currency
 */
export function formatBDT(amount: number): string {
    return `৳${amount.toLocaleString('en-BD')}`
}

/**
 * Get available slots count for a slot
 */
export async function getAvailableSlots(slotId: string): Promise<number> {
    const supabase = createClient()

    type SlotData = {
        max_appointments: number
    }

    const { data: slot } = await supabase
        .from('availability_slots')
        .select('max_appointments')
        .eq('id', slotId)
        .single() as { data: SlotData | null; error: any }

    const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('slot_id', slotId)
        .in('payment_status', ['paid', 'pending'])
        .not('status', 'eq', 'cancelled')

    return (slot?.max_appointments || 0) - (count || 0)
}
