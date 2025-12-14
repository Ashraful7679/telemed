import { format, formatDistanceToNow, parseISO, addHours, differenceInHours, isBefore, isAfter } from 'date-fns'
import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

/**
 * Get user's timezone
 */
export const getUserTimezone = (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Convert UTC timestamp to user's local timezone
 */
export const utcToLocal = (utcDate: string | Date): Date => {
    const timezone = getUserTimezone()
    return utcToZonedTime(utcDate, timezone)
}

/**
 * Convert local time to UTC for storage
 */
export const localToUtc = (localDate: Date): Date => {
    const timezone = getUserTimezone()
    return zonedTimeToUtc(localDate, timezone)
}

/**
 * Format date in user's timezone
 */
export const formatLocalDate = (date: string | Date, formatStr: string = 'PPP'): string => {
    const localDate = typeof date === 'string' ? utcToLocal(date) : date
    return format(localDate, formatStr)
}

/**
 * Format time in user's timezone
 */
export const formatLocalTime = (date: string | Date, formatStr: string = 'p'): string => {
    const localDate = typeof date === 'string' ? utcToLocal(date) : date
    return format(localDate, formatStr)
}

/**
 * Format date and time in user's timezone
 */
export const formatLocalDateTime = (date: string | Date, formatStr: string = 'PPP p'): string => {
    const localDate = typeof date === 'string' ? utcToLocal(date) : date
    return format(localDate, formatStr)
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: string | Date): string => {
    const localDate = typeof date === 'string' ? utcToLocal(date) : date
    return formatDistanceToNow(localDate, { addSuffix: true })
}

/**
 * Check if cancellation is allowed (48 hours before appointment)
 */
export const isCancellationAllowed = (appointmentDate: string | Date): boolean => {
    const now = new Date()
    const appointment = typeof appointmentDate === 'string' ? parseISO(appointmentDate) : appointmentDate
    const hoursUntilAppointment = differenceInHours(appointment, now)
    return hoursUntilAppointment >= 48
}

/**
 * Check if review is allowed (within 7 days after appointment)
 */
export const isReviewAllowed = (appointmentDate: string | Date): boolean => {
    const now = new Date()
    const appointment = typeof appointmentDate === 'string' ? parseISO(appointmentDate) : appointmentDate
    const sevenDaysAfter = addHours(appointment, 7 * 24)
    return isAfter(now, appointment) && isBefore(now, sevenDaysAfter)
}

/**
 * Check if user can enter video chamber (within appointment time window)
 */
export const canEnterChamber = (startTime: string | Date, endTime: string | Date): boolean => {
    const now = new Date()
    const start = typeof startTime === 'string' ? parseISO(startTime) : startTime
    const end = typeof endTime === 'string' ? parseISO(endTime) : endTime

    // Allow entry 10 minutes before and 30 minutes after
    const earlyEntry = addHours(start, -10 / 60)
    const lateEntry = addHours(end, 0.5)

    return isAfter(now, earlyEntry) && isBefore(now, lateEntry)
}
