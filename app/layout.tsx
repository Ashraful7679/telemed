import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import QueryProvider from '@/lib/providers/QueryProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'TeleMed - Doctor Appointment & Telemedicine Platform',
    description: 'Book appointments with verified doctors and consult online via video call',
    keywords: ['telemedicine', 'doctor appointment', 'online consultation', 'healthcare'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <QueryProvider>
                    <Header />
                    <main className="pt-16">
                        {children}
                    </main>
                </QueryProvider>
            </body>
        </html>
    )
}
