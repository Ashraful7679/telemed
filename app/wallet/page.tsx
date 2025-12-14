'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRequireAuth } from '@/lib/auth/hooks'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, History } from 'lucide-react'

interface WalletData {
    id: string
    balance: number
    currency: string
    updated_at: string
}

interface Transaction {
    id: string
    type: string
    amount: number
    balance_after: number
    description: string
    status: string
    created_at: string
    appointment_id: string | null
}

export default function WalletPage() {
    const router = useRouter()
    const { user, profile, loading: authLoading } = useRequireAuth()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [wallet, setWallet] = useState<WalletData | null>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [showAddFunds, setShowAddFunds] = useState(false)
    const [addAmount, setAddAmount] = useState('')
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        if (user) {
            fetchWalletData()
        }
    }, [user])

    const fetchWalletData = async () => {
        try {
            // Fetch wallet
            const { data: walletData, error: walletError } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user?.id)
                .single()

            if (walletError) throw walletError
            setWallet(walletData)

            // Fetch recent transactions
            const { data: txData, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('wallet_id', walletData.id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (txError) throw txError
            setTransactions(txData || [])
        } catch (err: any) {
            console.error('Error fetching wallet:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddFunds = async () => {
        const amount = parseFloat(addAmount)
        if (!amount || amount < 100) {
            alert('Minimum amount is ৳100')
            return
        }

        if (amount > 50000) {
            alert('Maximum amount is ৳50,000')
            return
        }

        setProcessing(true)
        try {
            // In a real app, integrate with payment gateway here
            // For now, simulate adding funds
            const newBalance = (wallet?.balance || 0) + amount

            // Update wallet
            const { error: walletError } = await supabase
                .from('wallets')
                .update({ balance: newBalance })
                .eq('id', wallet?.id)

            if (walletError) throw walletError

            // Record transaction
            const { error: txError } = await supabase
                .from('transactions')
                .insert([{
                    wallet_id: wallet?.id,
                    type: 'deposit',
                    amount: amount,
                    balance_before: wallet?.balance || 0,
                    balance_after: newBalance,
                    description: 'Added funds to wallet',
                    status: 'completed'
                }])

            if (txError) throw txError

            setAddAmount('')
            setShowAddFunds(false)
            fetchWalletData()
            alert('Funds added successfully!')
        } catch (err: any) {
            console.error('Error adding funds:', err)
            alert('Failed to add funds')
        } finally {
            setProcessing(false)
        }
    }

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'deposit':
                return <ArrowDownLeft className="h-5 w-5 text-success-600" />
            case 'payment':
                return <ArrowUpRight className="h-5 w-5 text-destructive" />
            case 'refund':
                return <ArrowDownLeft className="h-5 w-5 text-success-600" />
            case 'earning':
                return <ArrowDownLeft className="h-5 w-5 text-success-600" />
            case 'withdrawal':
                return <ArrowUpRight className="h-5 w-5 text-destructive" />
            default:
                return <History className="h-5 w-5 text-gray-400" />
        }
    }

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'deposit':
            case 'refund':
            case 'earning':
                return 'text-success-600'
            case 'payment':
            case 'withdrawal':
                return 'text-destructive'
            default:
                return 'text-gray-600'
        }
    }

    if (authLoading || loading) {
        return <LoadingSpinner size="lg" className="min-h-screen" />
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto max-w-4xl px-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
                    <p className="text-muted-foreground">Manage your funds and view transaction history</p>
                </div>

                {/* Wallet Balance Card */}
                <div className="card-custom mb-6 bg-gradient-to-br from-primary to-primary-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet className="h-6 w-6" />
                                <span className="text-sm opacity-90">Current Balance</span>
                            </div>
                            <div className="text-4xl font-bold">
                                ৳{wallet?.balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs opacity-75 mt-1">
                                Last updated: {wallet ? new Date(wallet.updated_at).toLocaleString() : '-'}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {profile?.role === 'patient' && (
                                <Button
                                    onClick={() => setShowAddFunds(true)}
                                    variant="outline"
                                    className="bg-white text-primary hover:bg-gray-100"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Funds
                                </Button>
                            )}
                            {profile?.role === 'doctor' && wallet && wallet.balance >= 500 && (
                                <Button
                                    variant="outline"
                                    className="bg-white text-primary hover:bg-gray-100"
                                >
                                    <ArrowUpRight className="h-4 w-4 mr-1" />
                                    Withdraw
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add Funds Modal */}
                {showAddFunds && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h2 className="text-xl font-bold mb-4">Add Funds to Wallet</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Amount (৳)</label>
                                    <input
                                        type="number"
                                        value={addAmount}
                                        onChange={(e) => setAddAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        min="100"
                                        max="50000"
                                        className="input-custom"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Min: ৳100 | Max: ৳50,000
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleAddFunds}
                                        disabled={processing}
                                        isLoading={processing}
                                        className="flex-1"
                                    >
                                        Add Funds
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowAddFunds(false)
                                            setAddAmount('')
                                        }}
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transaction History */}
                <div className="card-custom">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Recent Transactions
                    </h2>

                    {transactions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No transactions yet
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {getTransactionIcon(tx.type)}
                                        <div>
                                            <div className="font-medium capitalize">
                                                {tx.type.replace('_', ' ')}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {tx.description}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {new Date(tx.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold ${getTransactionColor(tx.type)}`}>
                                            {['deposit', 'refund', 'earning'].includes(tx.type) ? '+' : '-'}
                                            ৳{tx.amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Balance: ৳{tx.balance_after.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
