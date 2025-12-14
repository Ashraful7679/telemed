// Lazy loaded components for better performance
import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Loading component
const Loading = () => <LoadingSpinner size="lg" className="min-h-screen" />

// Lazy load heavy components
export const LazyAppointmentRoom = dynamic(
    () => import('@/app/appointment/[appointmentId]/page'),
    {
        loading: Loading,
        ssr: false
    }
)

export const LazyPrescriptionPage = dynamic(
    () => import('@/app/prescription/[appointmentId]/page'),
    {
        loading: Loading,
        ssr: false
    }
)

export const LazyWalletPage = dynamic(
    () => import('@/app/wallet/page'),
    {
        loading: Loading,
        ssr: false
    }
)
