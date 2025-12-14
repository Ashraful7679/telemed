-- Fix RLS policies and update dosage structure

-- Drop existing policies
DROP POLICY IF EXISTS "Doctors can add medicines" ON medicines;
DROP POLICY IF EXISTS "Doctors can add medical tests" ON medical_tests;
DROP POLICY IF EXISTS "Doctors can prescribe medicines" ON prescribed_medicines;

-- Recreate policies with correct role check
CREATE POLICY "Doctors can add medicines"
    ON medicines FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
    );

CREATE POLICY "Doctors can add medical tests"
    ON medical_tests FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
    );

CREATE POLICY "Doctors can prescribe medicines"
    ON prescribed_medicines FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor') AND
        appointment_id IN (
            SELECT id FROM appointments WHERE doctor_id = auth.uid()
        )
    );

-- Update prescribed_medicines table to have structured dosage
ALTER TABLE prescribed_medicines 
    DROP COLUMN IF EXISTS dosage,
    ADD COLUMN IF NOT EXISTS dosage_quantity VARCHAR(10), -- 1, 2, 3, 0.5, 0.25
    ADD COLUMN IF NOT EXISTS dosage_unit VARCHAR(50), -- pcs, tablet, spoon
    ADD COLUMN IF NOT EXISTS meal_timing VARCHAR(50), -- before_meal, after_meal
    ADD COLUMN IF NOT EXISTS frequency_type VARCHAR(50), -- specific_times, hours_gap
    ADD COLUMN IF NOT EXISTS morning BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS afternoon BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS night BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS hours_gap INTEGER, -- 4, 6, 8, 12
    ADD COLUMN IF NOT EXISTS duration_days INTEGER; -- duration in days

-- Keep duration column for backward compatibility but make it optional
ALTER TABLE prescribed_medicines 
    ALTER COLUMN duration DROP NOT NULL;
