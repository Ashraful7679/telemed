-- ============================================
-- WALLET SYSTEM & APPOINTMENT TIMING MIGRATION
-- Creates wallets, transactions, and updates appointments table
-- ============================================

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) DEFAULT 0.00 CHECK (balance >= 0),
    currency VARCHAR(3) DEFAULT 'BDT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'deposit', 'payment', 'refund', 'withdrawal', 'earning'
    amount DECIMAL(10, 2) NOT NULL,
    balance_before DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add appointment timing fields
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS reservation_start_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reservation_end_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reservation_duration_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS doctor_joined_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_auto_refunded BOOLEAN DEFAULT false;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_appointment_id ON transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_reservation_times ON appointments(reservation_start_time, reservation_end_time);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallets
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
CREATE POLICY "Users can view own wallet"
    ON wallets FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;
CREATE POLICY "Users can update own wallet"
    ON wallets FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- RLS Policies for transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (
        wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions"
    ON transactions FOR INSERT
    WITH CHECK (
        wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
    );

-- Function to create wallet on user signup
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id, balance)
    VALUES (NEW.id, 0.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create wallet
DROP TRIGGER IF EXISTS create_wallet_on_signup ON profiles;
CREATE TRIGGER create_wallet_on_signup
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_new_user();

-- Function to update wallet updated_at
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_wallet_timestamp ON wallets;
CREATE TRIGGER update_wallet_timestamp
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_timestamp();

-- Create wallets for existing users
INSERT INTO wallets (user_id, balance)
SELECT id, 0.00
FROM profiles
WHERE id NOT IN (SELECT user_id FROM wallets)
ON CONFLICT (user_id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Wallet system migration completed!';
    RAISE NOTICE 'Created tables: wallets, transactions';
    RAISE NOTICE 'Added appointment timing fields';
    RAISE NOTICE 'Created % wallets for existing users', (SELECT COUNT(*) FROM wallets);
END $$;
