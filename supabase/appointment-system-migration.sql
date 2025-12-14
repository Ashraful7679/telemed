-- =============================================
-- APPOINTMENT SYSTEM DATABASE UPDATES (CORRECTED)
-- =============================================

-- 1. Update availability_slots table structure
-- First, drop the old columns if they exist
ALTER TABLE availability_slots
DROP COLUMN IF EXISTS start_time CASCADE,
DROP COLUMN IF EXISTS end_time CASCADE,
DROP COLUMN IF EXISTS is_booked CASCADE;

-- Add new columns
ALTER TABLE availability_slots
ADD COLUMN IF NOT EXISTS slot_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS start_time TIME NOT NULL DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS end_time TIME NOT NULL DEFAULT '17:00',
ADD COLUMN IF NOT EXISTS allow_same_day_booking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- consultation_fee should already exist from schema, but ensure it's there
ALTER TABLE availability_slots
ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_availability_slots_doctor_date 
ON availability_slots(doctor_id, slot_date);

-- 2. Create appointment_images table for test results
CREATE TABLE IF NOT EXISTS appointment_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  image_type VARCHAR(50) DEFAULT 'test_result',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create doctor_suggestions table
CREATE TABLE IF NOT EXISTS doctor_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id),
  suggestion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointment_images_appointment 
ON appointment_images(appointment_id);

CREATE INDEX IF NOT EXISTS idx_doctor_suggestions_appointment 
ON doctor_suggestions(appointment_id);

-- 5. Update the trigger to work with new column names
DROP TRIGGER IF EXISTS prevent_booked_slot_edit_trigger ON availability_slots;

CREATE OR REPLACE FUNCTION prevent_available_slot_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_available = FALSE AND (
    NEW.start_time != OLD.start_time OR 
    NEW.end_time != OLD.end_time OR
    NEW.consultation_fee != OLD.consultation_fee
  ) THEN
    RAISE EXCEPTION 'Cannot edit a booked slot';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_available_slot_edit_trigger
BEFORE UPDATE ON availability_slots
FOR EACH ROW EXECUTE FUNCTION prevent_available_slot_edit();

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Check availability_slots columns:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'availability_slots' 
-- ORDER BY ordinal_position;

-- Check new tables:
-- SELECT * FROM appointment_images LIMIT 1;
-- SELECT * FROM doctor_suggestions LIMIT 1;
