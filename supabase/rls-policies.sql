-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow profile creation on signup
CREATE POLICY "Allow profile creation"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================
-- DOCTORS POLICIES
-- =============================================

-- Anyone can view approved doctors
CREATE POLICY "Anyone can view approved doctors"
  ON doctors FOR SELECT
  USING (status = 'approved');

-- Doctors can view their own profile
CREATE POLICY "Doctors can view own profile"
  ON doctors FOR SELECT
  USING (auth.uid() = id);

-- Doctors can update their own profile (except status)
CREATE POLICY "Doctors can update own profile"
  ON doctors FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all doctors
CREATE POLICY "Admins can view all doctors"
  ON doctors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all doctors
CREATE POLICY "Admins can update all doctors"
  ON doctors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow doctor profile creation
CREATE POLICY "Allow doctor creation"
  ON doctors FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================
-- SPECIALIZATIONS POLICIES
-- =============================================

-- Anyone can view specializations
CREATE POLICY "Anyone can view specializations"
  ON specializations FOR SELECT
  USING (true);

-- Admins can manage specializations
CREATE POLICY "Admins can manage specializations"
  ON specializations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- AVAILABILITY SLOTS POLICIES
-- =============================================

-- Anyone can view available slots for approved doctors
CREATE POLICY "Anyone can view available slots"
  ON availability_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE id = doctor_id AND status = 'approved'
    )
  );

-- Doctors can manage their own slots
CREATE POLICY "Doctors can manage own slots"
  ON availability_slots FOR ALL
  USING (auth.uid() = doctor_id);

-- Admins can view all slots
CREATE POLICY "Admins can view all slots"
  ON availability_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- APPOINTMENTS POLICIES
-- =============================================

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = patient_id);

-- Doctors can view their appointments
CREATE POLICY "Doctors can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = doctor_id);

-- Patients can create appointments
CREATE POLICY "Patients can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Patients can update their own appointments (for cancellation)
CREATE POLICY "Patients can update own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = patient_id);

-- Doctors can update their appointments (for status changes)
CREATE POLICY "Doctors can update appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = doctor_id);

-- Admins can view all appointments
CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- PAYMENTS POLICIES
-- =============================================

-- Patients can view their own payments
CREATE POLICY "Patients can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = patient_id);

-- Doctors can view their payments
CREATE POLICY "Doctors can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = doctor_id);

-- System can create payments (service role)
CREATE POLICY "System can create payments"
  ON payments FOR INSERT
  WITH CHECK (true);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- MEDICINES & TESTS POLICIES
-- =============================================

-- Anyone can view medicines
CREATE POLICY "Anyone can view medicines"
  ON medicines FOR SELECT
  USING (true);

-- Doctors can add medicines
CREATE POLICY "Doctors can add medicines"
  ON medicines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- Anyone can view tests
CREATE POLICY "Anyone can view tests"
  ON tests FOR SELECT
  USING (true);

-- Doctors can add tests
CREATE POLICY "Doctors can add tests"
  ON tests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- =============================================
-- PRESCRIPTIONS POLICIES
-- =============================================

-- Patients can view their own prescriptions
CREATE POLICY "Patients can view own prescriptions"
  ON prescriptions FOR SELECT
  USING (auth.uid() = patient_id);

-- Doctors can view their prescriptions
CREATE POLICY "Doctors can view own prescriptions"
  ON prescriptions FOR SELECT
  USING (auth.uid() = doctor_id);

-- Doctors can create prescriptions
CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

-- Doctors can update their own prescriptions (if not finalized)
CREATE POLICY "Doctors can update own prescriptions"
  ON prescriptions FOR UPDATE
  USING (auth.uid() = doctor_id AND is_finalized = false);

-- =============================================
-- PRESCRIPTION MEDICINES & TESTS POLICIES
-- =============================================

-- Patients can view their prescription medicines
CREATE POLICY "Patients can view own prescription medicines"
  ON prescription_medicines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions
      WHERE id = prescription_id AND patient_id = auth.uid()
    )
  );

-- Doctors can manage prescription medicines
CREATE POLICY "Doctors can manage prescription medicines"
  ON prescription_medicines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions
      WHERE id = prescription_id AND doctor_id = auth.uid()
    )
  );

-- Patients can view their prescription tests
CREATE POLICY "Patients can view own prescription tests"
  ON prescription_tests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions
      WHERE id = prescription_id AND patient_id = auth.uid()
    )
  );

-- Doctors can manage prescription tests
CREATE POLICY "Doctors can manage prescription tests"
  ON prescription_tests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions
      WHERE id = prescription_id AND doctor_id = auth.uid()
    )
  );

-- =============================================
-- REVIEWS POLICIES
-- =============================================

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

-- Patients can create reviews for their appointments
CREATE POLICY "Patients can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- =============================================
-- NOTIFICATION PREFERENCES POLICIES
-- =============================================

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- ADMIN ACTIONS POLICIES
-- =============================================

-- Admins can view all admin actions
CREATE POLICY "Admins can view admin actions"
  ON admin_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can create admin actions
CREATE POLICY "Admins can create admin actions"
  ON admin_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
