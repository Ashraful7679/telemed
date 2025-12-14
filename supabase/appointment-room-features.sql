-- Add chat messages table
CREATE TABLE IF NOT EXISTS appointment_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_appointment_chat_appointment ON appointment_chat(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_chat_created ON appointment_chat(created_at);

-- Add prescribed tests table
CREATE TABLE IF NOT EXISTS prescribed_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    test_description TEXT,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_prescribed_tests_appointment ON prescribed_tests(appointment_id);

-- Enable RLS (Row Level Security)
ALTER TABLE appointment_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescribed_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointment_chat
CREATE POLICY "Users can view chat for their appointments"
    ON appointment_chat FOR SELECT
    USING (
        appointment_id IN (
            SELECT id FROM appointments 
            WHERE patient_id = auth.uid() OR doctor_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages in their appointments"
    ON appointment_chat FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        appointment_id IN (
            SELECT id FROM appointments 
            WHERE patient_id = auth.uid() OR doctor_id = auth.uid()
        )
    );

-- RLS Policies for prescribed_tests
CREATE POLICY "Users can view tests for their appointments"
    ON prescribed_tests FOR SELECT
    USING (
        appointment_id IN (
            SELECT id FROM appointments 
            WHERE patient_id = auth.uid() OR doctor_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can prescribe tests"
    ON prescribed_tests FOR INSERT
    WITH CHECK (
        doctor_id = auth.uid() AND
        appointment_id IN (
            SELECT id FROM appointments WHERE doctor_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can update their prescribed tests"
    ON prescribed_tests FOR UPDATE
    USING (doctor_id = auth.uid())
    WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can delete their prescribed tests"
    ON prescribed_tests FOR DELETE
    USING (doctor_id = auth.uid());
