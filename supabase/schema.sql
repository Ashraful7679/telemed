-- =============================================
-- TELEMEDICINE PLATFORM DATABASE SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('guest', 'patient', 'doctor', 'admin');
CREATE TYPE doctor_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE appointment_status AS ENUM ('pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('card', 'bkash');

-- =============================================
-- TABLES
-- =============================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'patient' NOT NULL,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specializations
CREATE TABLE specializations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors
CREATE TABLE doctors (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  medical_license_number TEXT UNIQUE NOT NULL,
  specialization_id UUID REFERENCES specializations(id),
  experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
  qualifications TEXT,
  bio TEXT,
  status doctor_status DEFAULT 'pending' NOT NULL,
  is_popular BOOLEAN DEFAULT FALSE,
  average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  total_consultations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability Slots
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  consultation_fee DECIMAL(10,2) NOT NULL CHECK (consultation_fee >= 0),
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  slot_id UUID REFERENCES availability_slots(id) ON DELETE SET NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  status appointment_status DEFAULT 'pending_payment' NOT NULL,
  patient_notes TEXT,
  is_refundable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  doctor_id UUID REFERENCES doctors(id) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  admin_commission DECIMAL(10,2) NOT NULL CHECK (admin_commission >= 0),
  doctor_earnings DECIMAL(10,2) NOT NULL CHECK (doctor_earnings >= 0),
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending' NOT NULL,
  transaction_id TEXT,
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medicines
CREATE TABLE medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  generic_name TEXT,
  dosage_form TEXT,
  strength TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tests
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES doctors(id) NOT NULL,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  diagnosis TEXT,
  notes TEXT,
  follow_up_date DATE,
  is_finalized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescription Medicines (Many-to-Many)
CREATE TABLE prescription_medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE NOT NULL,
  medicine_id UUID REFERENCES medicines(id) NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescription Tests (Many-to-Many)
CREATE TABLE prescription_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES tests(id) NOT NULL,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(appointment_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_appointment_confirmation BOOLEAN DEFAULT TRUE,
  email_appointment_reminder BOOLEAN DEFAULT TRUE,
  email_prescription_ready BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Actions (Audit Log)
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id) NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES profiles(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_doctors_status ON doctors(status);
CREATE INDEX idx_doctors_specialization ON doctors(specialization_id);
CREATE INDEX idx_doctors_popular ON doctors(is_popular);
CREATE INDEX idx_availability_slots_doctor ON availability_slots(doctor_id);
CREATE INDEX idx_availability_slots_time ON availability_slots(start_time, end_time);
CREATE INDEX idx_availability_slots_booked ON availability_slots(is_booked);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_reviews_doctor ON reviews(doctor_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON availability_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update doctor average rating
CREATE OR REPLACE FUNCTION update_doctor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE doctors
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE doctor_id = NEW.doctor_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE doctor_id = NEW.doctor_id
    )
  WHERE id = NEW.doctor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_doctor_rating_on_review
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_doctor_rating();

-- Prevent slot editing when booked
CREATE OR REPLACE FUNCTION prevent_booked_slot_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_booked = TRUE AND (
    NEW.start_time != OLD.start_time OR 
    NEW.end_time != OLD.end_time OR
    NEW.consultation_fee != OLD.consultation_fee
  ) THEN
    RAISE EXCEPTION 'Cannot edit a booked slot';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_booked_slot_edit_trigger
BEFORE UPDATE ON availability_slots
FOR EACH ROW EXECUTE FUNCTION prevent_booked_slot_edit();

-- Auto-create notification preferences on profile creation
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_notification_preferences_trigger
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION create_notification_preferences();

-- =============================================
-- SEED DATA
-- =============================================

-- Insert common specializations
INSERT INTO specializations (name, description) VALUES
  ('General Medicine', 'General medical consultation and treatment'),
  ('Cardiology', 'Heart and cardiovascular system specialist'),
  ('Dermatology', 'Skin, hair, and nail specialist'),
  ('Pediatrics', 'Children and adolescent healthcare'),
  ('Orthopedics', 'Bone, joint, and muscle specialist'),
  ('Gynecology', 'Women''s reproductive health specialist'),
  ('Psychiatry', 'Mental health and behavioral disorders'),
  ('Neurology', 'Brain and nervous system specialist'),
  ('ENT', 'Ear, nose, and throat specialist'),
  ('Ophthalmology', 'Eye and vision specialist');

-- Insert common medicines
INSERT INTO medicines (name, generic_name, dosage_form, strength) VALUES
  ('Paracetamol', 'Acetaminophen', 'Tablet', '500mg'),
  ('Amoxicillin', 'Amoxicillin', 'Capsule', '500mg'),
  ('Omeprazole', 'Omeprazole', 'Capsule', '20mg'),
  ('Metformin', 'Metformin', 'Tablet', '500mg'),
  ('Atorvastatin', 'Atorvastatin', 'Tablet', '10mg');

-- Insert common tests
INSERT INTO tests (name, description) VALUES
  ('Complete Blood Count (CBC)', 'Comprehensive blood cell analysis'),
  ('Blood Sugar (Fasting)', 'Fasting blood glucose test'),
  ('Lipid Profile', 'Cholesterol and triglyceride levels'),
  ('Liver Function Test', 'Liver enzyme and function assessment'),
  ('Kidney Function Test', 'Creatinine and urea levels'),
  ('Thyroid Function Test', 'TSH and thyroid hormone levels'),
  ('Chest X-Ray', 'Radiographic examination of chest'),
  ('ECG', 'Electrocardiogram for heart rhythm'),
  ('Urine Analysis', 'Complete urine examination'),
  ('HbA1c', 'Average blood sugar over 3 months');
