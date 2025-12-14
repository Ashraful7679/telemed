'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/hooks'
import { Button } from '@/components/ui/Button'
import { Menu, X, Calendar, Wallet, User, LogOut, Home } from 'lucide-react'

export function Header() {
    const { user, profile, signOut } = useAuth()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        window.location.href = '/'
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-primary">TeleMed</div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {user ? (
                            <>
                                <Link href="/" className="flex items-center gap-1 text-gray-700 hover:text-primary transition-colors">
                                    <Home className="h-4 w-4" />
                                    <span>Home</span>
                                </Link>
                                
                                {profile?.role === 'patient' && (
                                    <>
                                        <Link href="/patient/appointments" className="flex items-center gap-1 text-gray-700 hover:text-primary transition-colors">
                                            <Calendar className="h-4 w-4" />
                                            <span>My Appointments</span>
                                        </Link>
                                        <Link href="/wallet" className="flex items-center gap-1 text-gray-700 hover:text-primary transition-colors">
                                            <Wallet className="h-4 w-4" />
                                            <span>Wallet</span>
                                        </Link>
                                    </>
                                )}

                                {profile?.role === 'doctor' && (
                                    <>
                                        <Link href="/doctor/appointments" className="flex items-center gap-1 text-gray-700 hover:text-primary transition-colors">
                                            <Calendar className="h-4 w-4" />
                                            <span>Appointments</span>
                                        </Link>
                                        <Link href="/wallet" className="flex items-center gap-1 text-gray-700 hover:text-primary transition-colors">
                                            <Wallet className="h-4 w-4" />
                                            <span>Wallet</span>
                                        </Link>
                                    </>
                                )}

                                {profile?.role === 'admin' && (
                                    <Link href="/admin/approve-doctors" className="flex items-center gap-1 text-gray-700 hover:text-primary transition-colors">
                                        <User className="h-4 w-4" />
                                        <span>Approve Doctors</span>
                                    </Link>
                                )}

                                <Link href="/profile" className="flex items-center gap-1 text-gray-700 hover:text-primary transition-colors">
                                    <User className="h-4 w-4" />
                                    <span>Profile</span>
                                </Link>

                                <Button onClick={handleSignOut} variant="outline" size="sm">
                                    <LogOut className="h-4 w-4 mr-1" />
                                    Sign Out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="outline" size="sm">Sign In</Button>
                                </Link>
                                <Link href="/signup">
                                    <Button size="sm">Sign Up</Button>
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-gray-700 hover:text-primary"
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t py-4">
                        <nav className="flex flex-col gap-3">
                            {user ? (
                                <>
                                    <Link href="/" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
                                        <Home className="h-4 w-4" />
                                        <span>Home</span>
                                    </Link>

                                    {profile?.role === 'patient' && (
                                        <>
                                            <Link href="/patient/appointments" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
                                                <Calendar className="h-4 w-4" />
                                                <span>My Appointments</span>
                                            </Link>
                                            <Link href="/wallet" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
                                                <Wallet className="h-4 w-4" />
                                                <span>Wallet</span>
                                            </Link>
                                        </>
                                    )}

                                    {profile?.role === 'doctor' && (
                                        <>
                                            <Link href="/doctor/appointments" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
                                                <Calendar className="h-4 w-4" />
                                                <span>Appointments</span>
                                            </Link>
                                            <Link href="/wallet" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
                                                <Wallet className="h-4 w-4" />
                                                <span>Wallet</span>
                                            </Link>
                                        </>
                                    )}

                                    {profile?.role === 'admin' && (
                                        <Link href="/admin/approve-doctors" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
                                            <User className="h-4 w-4" />
                                            <span>Approve Doctors</span>
                                        </Link>
                                    )}

                                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
                                        <User className="h-4 w-4" />
                                        <span>Profile</span>
                                    </Link>

                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded text-left"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Sign Out</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="px-4 py-2">
                                        <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                                    </Link>
                                    <Link href="/signup" className="px-4 py-2">
                                        <Button size="sm" className="w-full">Sign Up</Button>
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    )
}
