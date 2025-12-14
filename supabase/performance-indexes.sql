-- ============================================
-- PERFORMANCE OPTIMIZATION: DATABASE INDEXES
-- Creates indexes on foreign keys and frequently queried columns
-- ============================================

-- Appointments table indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_slot_id ON appointments(slot_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_reservation_start ON appointments(reservation_start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_reservation_end ON appointments(reservation_end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_completed ON appointments(is_completed);

-- Prescribed medicines indexes
CREATE INDEX IF NOT EXISTS idx_prescribed_medicines_appointment ON prescribed_medicines(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescribed_medicines_created ON prescribed_medicines(created_at);

-- Prescribed tests indexes
CREATE INDEX IF NOT EXISTS idx_prescribed_tests_appointment ON prescribed_tests(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescribed_tests_created ON prescribed_tests(created_at);

-- Chat messages indexes (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_chat_messages_appointment ON chat_messages(appointment_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
    END IF;
END $$;

-- Availability slots indexes
CREATE INDEX IF NOT EXISTS idx_availability_slots_doctor ON availability_slots(doctor_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_date ON availability_slots(slot_date);

-- Doctors indexes
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization_id);
CREATE INDEX IF NOT EXISTS idx_doctors_popular ON doctors(is_popular);
CREATE INDEX IF NOT EXISTS idx_doctors_rating ON doctors(average_rating DESC);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_appointment ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- Referrals indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_referrals_appointment ON referrals(appointment_id);
CREATE INDEX IF NOT EXISTS idx_referrals_doctor ON referrals(doctor_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_appointments_patient_status ON appointments(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_status ON appointments(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Performance indexes created successfully!';
    RAISE NOTICE 'This will significantly improve query performance.';
END $$;
