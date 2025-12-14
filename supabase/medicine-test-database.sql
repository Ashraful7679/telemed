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

-- Create prescribed_medicines table (replaces doctor_suggestions for medicines)
CREATE TABLE IF NOT EXISTS prescribed_medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
    medicine_name VARCHAR(255) NOT NULL, -- Store name even if medicine is deleted
    dosage VARCHAR(255), -- e.g., "1 tablet twice daily"
    duration VARCHAR(100), -- e.g., "7 days", "2 weeks"
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

-- RLS Policies for medicines (everyone can read, doctors can add)
CREATE POLICY "Anyone can view medicines"
    ON medicines FOR SELECT
    USING (true);

CREATE POLICY "Doctors can add medicines"
    ON medicines FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM doctors WHERE id = auth.uid())
    );

-- RLS Policies for medical_tests (everyone can read, doctors can add)
CREATE POLICY "Anyone can view medical tests"
    ON medical_tests FOR SELECT
    USING (true);

CREATE POLICY "Doctors can add medical tests"
    ON medical_tests FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM doctors WHERE id = auth.uid())
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
        doctor_id = auth.uid() AND
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

-- Insert some common medicines
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

-- Insert some common tests
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
