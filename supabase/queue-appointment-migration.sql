-- =============================================
-- QUEUE-BASED APPOINTMENT SYSTEM MIGRATION
-- =============================================

-- 1. Update availability_slots for queue system
ALTER TABLE availability_slots
ADD COLUMN IF NOT EXISTS appointment_duration INTEGER NOT NULL DEFAULT 15,
ADD COLUMN IF NOT EXISTS max_appointments INTEGER NOT NULL DEFAULT 10;

-- Update existing slots to have default values
UPDATE availability_slots 
SET appointment_duration = 15, max_appointments = 10
WHERE appointment_duration IS NULL OR max_appointments IS NULL;

-- Add constraint to ensure slot can accommodate all appointments
ALTER TABLE availability_slots
ADD CONSTRAINT valid_slot_capacity 
CHECK (
  EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 60 
  >= max_appointments * appointment_duration
);

-- 2. Update appointments table for serial numbers and payment
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS serial_number INTEGER,
ADD COLUMN IF NOT EXISTS exact_appointment_time TIME,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS amount_bdt DECIMAL(10,2);

-- Add unique constraint for serial numbers per slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_slot_serial 
ON appointments(slot_id, serial_number) 
WHERE serial_number IS NOT NULL;

-- 3. Update payments table to use BDT
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS amount_bdt DECIMAL(10,2);

-- Migrate existing USD amounts to BDT (1 USD ≈ 110 BDT)
UPDATE payments 
SET amount_bdt = total_amount * 110
WHERE amount_bdt IS NULL;

-- 4. Create function to calculate payment deadline
CREATE OR REPLACE FUNCTION calculate_payment_deadline(
  appointment_date TIMESTAMPTZ,
  allow_same_day BOOLEAN
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  IF allow_same_day THEN
    -- For same-day slots, deadline is appointment time
    RETURN appointment_date;
  ELSE
    -- For regular slots, deadline is 48 hours before
    RETURN appointment_date - INTERVAL '48 hours';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to auto-delete unpaid reservations
CREATE OR REPLACE FUNCTION delete_unpaid_reservations()
RETURNS void AS $$
BEGIN
  DELETE FROM appointments
  WHERE payment_status = 'pending'
    AND payment_deadline < NOW()
    AND status IN ('pending_payment', 'reserved');
END;
$$ LANGUAGE plpgsql;

-- 6. Migrate existing appointments
-- Set payment deadline for existing appointments
UPDATE appointments
SET payment_deadline = calculate_payment_deadline(
  appointment_date,
  COALESCE(
    (SELECT allow_same_day_booking FROM availability_slots WHERE id = appointments.slot_id),
    false
  )
)
WHERE payment_deadline IS NULL;

-- Assign serial numbers to paid appointments (in order of creation)
WITH numbered_appointments AS (
  SELECT 
    id,
    slot_id,
    ROW_NUMBER() OVER (PARTITION BY slot_id ORDER BY created_at) as rn
  FROM appointments
  WHERE payment_status = 'paid' OR status = 'confirmed'
)
UPDATE appointments a
SET serial_number = na.rn
FROM numbered_appointments na
WHERE a.id = na.id;

-- Calculate exact appointment times for appointments with serial numbers
UPDATE appointments a
SET exact_appointment_time = (
  SELECT 
    (s.start_time::time + (INTERVAL '1 minute' * s.appointment_duration * (a.serial_number - 1)))::time
  FROM availability_slots s
  WHERE s.id = a.slot_id
)
WHERE serial_number IS NOT NULL AND exact_appointment_time IS NULL;

-- 7. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status 
ON appointments(payment_status);

CREATE INDEX IF NOT EXISTS idx_appointments_payment_deadline 
ON appointments(payment_deadline);

CREATE INDEX IF NOT EXISTS idx_appointments_slot_id 
ON appointments(slot_id);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check availability_slots columns:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'availability_slots' 
-- AND column_name IN ('appointment_duration', 'max_appointments');

-- Check appointments columns:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'appointments' 
-- AND column_name IN ('serial_number', 'exact_appointment_time', 'payment_status', 'payment_deadline');

-- Check migrated appointments:
-- SELECT id, serial_number, exact_appointment_time, payment_status, payment_deadline
-- FROM appointments
-- LIMIT 10;
