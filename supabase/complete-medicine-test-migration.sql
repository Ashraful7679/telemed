-- ============================================
-- COMPLETE MEDICINE & TEST SYSTEM MIGRATION
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Create medicines master table
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    generic_name VARCHAR(255),
    dosage_form VARCHAR(100), -- tablet, capsule, syrup, injection, etc.
    strength VARCHAR(100), -- e.g., 500mg, 10ml
    manufacturer VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Create tests master table
CREATE TABLE IF NOT EXISTS medical_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100), -- blood, urine, imaging, etc.
    description TEXT,
    typical_duration VARCHAR(100), -- e.g., "24 hours", "Same day"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Create prescribed_medicines table with structured dosage
CREATE TABLE IF NOT EXISTS prescribed_medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
    medicine_name VARCHAR(255) NOT NULL,
    -- Structured dosage fields
    dosage_quantity VARCHAR(10), -- 1, 2, 3, 0.5, 0.25
    dosage_unit VARCHAR(50), -- pcs, tablet, spoon
    meal_timing VARCHAR(50), -- before_meal, after_meal
    frequency_type VARCHAR(50), -- specific_times, hours_gap
    morning BOOLEAN DEFAULT false,
    afternoon BOOLEAN DEFAULT false,
    night BOOLEAN DEFAULT false,
    hours_gap INTEGER, -- 4, 6, 8, 12
    duration_days INTEGER, -- duration in days
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update prescribed_tests to reference medical_tests
ALTER TABLE prescribed_tests 
    ADD COLUMN IF NOT EXISTS test_id UUID REFERENCES medical_tests(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medical_tests_name ON medical_tests(name);
CREATE INDEX IF NOT EXISTS idx_prescribed_medicines_appointment ON prescribed_medicines(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescribed_medicines_medicine ON prescribed_medicines(medicine_id);

-- Enable RLS
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescribed_medicines ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view medicines" ON medicines;
DROP POLICY IF EXISTS "Doctors can add medicines" ON medicines;
DROP POLICY IF EXISTS "Anyone can view medical tests" ON medical_tests;
DROP POLICY IF EXISTS "Doctors can add medical tests" ON medical_tests;
DROP POLICY IF EXISTS "Users can view prescribed medicines for their appointments" ON prescribed_medicines;
DROP POLICY IF EXISTS "Doctors can prescribe medicines" ON prescribed_medicines;
DROP POLICY IF EXISTS "Doctors can update their prescribed medicines" ON prescribed_medicines;
DROP POLICY IF EXISTS "Doctors can delete their prescribed medicines" ON prescribed_medicines;

-- RLS Policies for medicines (everyone can read, doctors can add)
CREATE POLICY "Anyone can view medicines"
    ON medicines FOR SELECT
    USING (true);

CREATE POLICY "Doctors can add medicines"
    ON medicines FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
    );

-- RLS Policies for medical_tests (everyone can read, doctors can add)
CREATE POLICY "Anyone can view medical tests"
    ON medical_tests FOR SELECT
    USING (true);

CREATE POLICY "Doctors can add medical tests"
    ON medical_tests FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
    );

-- RLS Policies for prescribed_medicines
CREATE POLICY "Users can view prescribed medicines for their appointments"
    ON prescribed_medicines FOR SELECT
    USING (
        appointment_id IN (
            SELECT id FROM appointments 
            WHERE patient_id = auth.uid() OR doctor_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can prescribe medicines"
    ON prescribed_medicines FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor') AND
        appointment_id IN (
            SELECT id FROM appointments WHERE doctor_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can update their prescribed medicines"
    ON prescribed_medicines FOR UPDATE
    USING (doctor_id = auth.uid())
    WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can delete their prescribed medicines"
    ON prescribed_medicines FOR DELETE
    USING (doctor_id = auth.uid());

-- Insert sample medicines
INSERT INTO medicines (name, generic_name, dosage_form, strength) VALUES
    ('Paracetamol', 'Acetaminophen', 'Tablet', '500mg'),
    ('Napa', 'Paracetamol', 'Tablet', '500mg'),
    ('Amoxicillin', 'Amoxicillin', 'Capsule', '500mg'),
    ('Omeprazole', 'Omeprazole', 'Capsule', '20mg'),
    ('Losectil', 'Omeprazole', 'Capsule', '20mg'),
    ('Metformin', 'Metformin', 'Tablet', '500mg'),
    ('Amlodipine', 'Amlodipine', 'Tablet', '5mg'),
    ('Atorvastatin', 'Atorvastatin', 'Tablet', '10mg'),
    ('Cetirizine', 'Cetirizine', 'Tablet', '10mg'),
    ('Histacin', 'Cetirizine', 'Tablet', '10mg')
ON CONFLICT (name) DO NOTHING;

-- Insert sample tests
INSERT INTO medical_tests (name, category, description) VALUES
    ('Complete Blood Count (CBC)', 'Blood', 'Measures different components of blood'),
    ('Blood Sugar (Fasting)', 'Blood', 'Measures fasting blood glucose level'),
    ('Blood Sugar (Random)', 'Blood', 'Measures random blood glucose level'),
    ('Lipid Profile', 'Blood', 'Measures cholesterol and triglycerides'),
    ('Liver Function Test (LFT)', 'Blood', 'Assesses liver health'),
    ('Kidney Function Test (KFT)', 'Blood', 'Assesses kidney health'),
    ('Thyroid Function Test (TFT)', 'Blood', 'Measures thyroid hormones'),
    ('Urine Routine Examination', 'Urine', 'Basic urine analysis'),
    ('Chest X-Ray', 'Imaging', 'X-ray of chest area'),
    ('ECG (Electrocardiogram)', 'Cardiac', 'Records heart electrical activity'),
    ('Ultrasound Abdomen', 'Imaging', 'Ultrasound of abdominal organs'),
    ('HbA1c', 'Blood', 'Measures average blood sugar over 3 months')
ON CONFLICT (name) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Created tables: medicines, medical_tests, prescribed_medicines';
    RAISE NOTICE 'Added % medicines', (SELECT COUNT(*) FROM medicines);
    RAISE NOTICE 'Added % tests', (SELECT COUNT(*) FROM medical_tests);
END $$;
