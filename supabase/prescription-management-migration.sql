-- ============================================
-- PRESCRIPTION MANAGEMENT SYSTEM MIGRATION
-- Adds referrals, appointment completion, and RLS updates
-- ============================================

-- Add completion tracking to appointments
ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    specialty VARCHAR(255) NOT NULL, -- e.g., "Cardiologist", "Neurologist"
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for referrals
CREATE INDEX IF NOT EXISTS idx_referrals_appointment ON referrals(appointment_id);

-- Enable RLS on referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
DROP POLICY IF EXISTS "Users can view referrals for their appointments" ON referrals;
CREATE POLICY "Users can view referrals for their appointments"
    ON referrals FOR SELECT
    USING (
        appointment_id IN (
            SELECT id FROM appointments 
            WHERE patient_id = auth.uid() OR doctor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Doctors can create referrals" ON referrals;
CREATE POLICY "Doctors can create referrals"
    ON referrals FOR INSERT
    WITH CHECK (
        doctor_id = auth.uid() AND
        appointment_id IN (
            SELECT id FROM appointments WHERE doctor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Doctors can update their referrals" ON referrals;
CREATE POLICY "Doctors can update their referrals"
    ON referrals FOR UPDATE
    USING (doctor_id = auth.uid())
    WITH CHECK (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Doctors can delete their referrals" ON referrals;
CREATE POLICY "Doctors can delete their referrals"
    ON referrals FOR DELETE
    USING (doctor_id = auth.uid());

-- Update RLS policies for prescribed_medicines to prevent editing completed appointments
DROP POLICY IF EXISTS "Doctors can update their prescribed medicines" ON prescribed_medicines;
CREATE POLICY "Doctors can update their prescribed medicines"
    ON prescribed_medicines FOR UPDATE
    USING (
        doctor_id = auth.uid() AND
        NOT EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = appointment_id AND is_completed = true
        )
    )
    WITH CHECK (
        doctor_id = auth.uid() AND
        NOT EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = appointment_id AND is_completed = true
        )
    );

DROP POLICY IF EXISTS "Doctors can delete their prescribed medicines" ON prescribed_medicines;
CREATE POLICY "Doctors can delete their prescribed medicines"
    ON prescribed_medicines FOR DELETE
    USING (
        doctor_id = auth.uid() AND
        NOT EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = appointment_id AND is_completed = true
        )
    );

-- Update RLS policies for prescribed_tests to prevent editing completed appointments
DROP POLICY IF EXISTS "Doctors can update their prescribed tests" ON prescribed_tests;
CREATE POLICY "Doctors can update their prescribed tests"
    ON prescribed_tests FOR UPDATE
    USING (
        doctor_id = auth.uid() AND
        NOT EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = appointment_id AND is_completed = true
        )
    )
    WITH CHECK (
        doctor_id = auth.uid() AND
        NOT EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = appointment_id AND is_completed = true
        )
    );

DROP POLICY IF EXISTS "Doctors can delete their prescribed tests" ON prescribed_tests;
CREATE POLICY "Doctors can delete their prescribed tests"
    ON prescribed_tests FOR DELETE
    USING (
        doctor_id = auth.uid() AND
        NOT EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = appointment_id AND is_completed = true
        )
    );

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Prescription management migration completed!';
    RAISE NOTICE 'Added: referrals table, appointment completion tracking';
    RAISE NOTICE 'Updated: RLS policies to prevent editing completed appointments';
END $$;
