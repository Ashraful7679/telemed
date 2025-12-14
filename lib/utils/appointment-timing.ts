// Appointment timing utility functions

export function canJoinAppointment(reservationStartTime: string | null, reservationEndTime: string | null): {
    canJoin: boolean
    reason?: string
    minutesUntilStart?: number
} {
    if (!reservationStartTime || !reservationEndTime) {
        return { canJoin: false, reason: 'Appointment time not set' }
    }

    const now = new Date()
    const startTime = new Date(reservationStartTime)
    const endTime = new Date(reservationEndTime)
    
    // Calculate 15 minutes before start
    const fifteenMinBefore = new Date(startTime.getTime() - 15 * 60 * 1000)
    
    // Check if current time is before the 15-minute window
    if (now < fifteenMinBefore) {
        const minutesUntilStart = Math.ceil((fifteenMinBefore.getTime() - now.getTime()) / (60 * 1000))
        return {
            canJoin: false,
            reason: `Available in ${minutesUntilStart} minutes`,
            minutesUntilStart
        }
    }
    
    // Check if appointment has ended
    if (now > endTime) {
        return { canJoin: false, reason: 'Appointment has ended' }
    }
    
    // Can join!
    return { canJoin: true }
}

export function formatReservationTime(startTime: string | null, endTime: string | null): string {
    if (!startTime || !endTime) {
        return 'Time not set'
    }

    const start = new Date(startTime)
    const end = new Date(endTime)
    
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }
    
    return `${formatTime(start)} - ${formatTime(end)}`
}

export function getReservationDuration(startTime: string | null, endTime: string | null): number {
    if (!startTime || !endTime) {
        return 0
    }

    const start = new Date(startTime)
    const end = new Date(endTime)
    
    return Math.round((end.getTime() - start.getTime()) / (60 * 1000))
}

export function isAppointmentMissed(
    reservationStartTime: string | null,
    reservationDurationMinutes: number | null,
    doctorJoinedAt: string | null
): boolean {
    if (!reservationStartTime || !reservationDurationMinutes) {
        return false
    }

    // If doctor already joined, not missed
    if (doctorJoinedAt) {
        return false
    }

    const now = new Date()
    const startTime = new Date(reservationStartTime)
    
    // Calculate halfway point
    const halfwayTime = new Date(startTime.getTime() + (reservationDurationMinutes / 2) * 60 * 1000)
    
    // If current time is past halfway and doctor hasn't joined, it's missed
    return now > halfwayTime
}

export function getTimeUntilAppointment(reservationStartTime: string | null): {
    days: number
    hours: number
    minutes: number
    totalMinutes: number
} {
    if (!reservationStartTime) {
        return { days: 0, hours: 0, minutes: 0, totalMinutes: 0 }
    }

    const now = new Date()
    const startTime = new Date(reservationStartTime)
    const diff = startTime.getTime() - now.getTime()
    
    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, totalMinutes: 0 }
    }

    const totalMinutes = Math.floor(diff / (60 * 1000))
    const days = Math.floor(totalMinutes / (24 * 60))
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
    const minutes = totalMinutes % 60
    
    return { days, hours, minutes, totalMinutes }
}
