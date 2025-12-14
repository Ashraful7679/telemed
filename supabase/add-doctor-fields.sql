-- Add registration_number and qualifications to doctors table
ALTER TABLE doctors 
    ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS qualifications TEXT;

-- Add exact appointment time fields to appointments table
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS exact_start_time TIME,
    ADD COLUMN IF NOT EXISTS exact_end_time TIME;

-- Add index for registration number
CREATE INDEX IF NOT EXISTS idx_doctors_registration_number ON doctors(registration_number);
