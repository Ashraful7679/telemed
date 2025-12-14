export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type UserRole = 'guest' | 'patient' | 'doctor' | 'admin'
export type DoctorStatus = 'pending' | 'approved' | 'rejected'
export type AppointmentStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type PaymentStatus = 'pending' | 'paid' | 'completed' | 'failed' | 'refunded'
export type PaymentMethod = 'card' | 'bkash'

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string
                    phone: string | null
                    avatar_url: string | null
                    role: UserRole
                    is_blocked: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name: string
                    phone?: string | null
                    avatar_url?: string | null
                    role?: UserRole
                    is_blocked?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string
                    phone?: string | null
                    avatar_url?: string | null
                    role?: UserRole
                    is_blocked?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            specializations: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    created_at?: string
                }
            }
            doctors: {
                Row: {
                    id: string
                    medical_license_number: string
                    specialization_id: string | null
                    experience_years: number
                    qualifications: string | null
                    bio: string | null
                    status: DoctorStatus
                    is_popular: boolean
                    average_rating: number
                    total_reviews: number
                    total_consultations: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    medical_license_number: string
                    specialization_id?: string | null
                    experience_years: number
                    qualifications?: string | null
                    bio?: string | null
                    status?: DoctorStatus
                    is_popular?: boolean
                    average_rating?: number
                    total_reviews?: number
                    total_consultations?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    medical_license_number?: string
                    specialization_id?: string | null
                    experience_years?: number
                    qualifications?: string | null
                    bio?: string | null
                    status?: DoctorStatus
                    is_popular?: boolean
                    average_rating?: number
                    total_reviews?: number
                    total_consultations?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            availability_slots: {
                Row: {
                    id: string
                    doctor_id: string
                    start_time: string
                    end_time: string
                    consultation_fee: number
                    appointment_duration: number
                    max_appointments: number
                    is_booked: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    doctor_id: string
                    start_time: string
                    end_time: string
                    consultation_fee: number
                    appointment_duration: number
                    max_appointments: number
                    is_booked?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    doctor_id?: string
                    start_time?: string
                    end_time?: string
                    consultation_fee?: number
                    appointment_duration?: number
                    max_appointments?: number
                    is_booked?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            appointments: {
                Row: {
                    id: string
                    patient_id: string
                    doctor_id: string
                    slot_id: string | null
                    appointment_date: string
                    status: AppointmentStatus
                    patient_notes: string | null
                    is_refundable: boolean
                    serial_number: number | null
                    exact_appointment_time: string | null
                    reservation_start_time: string | null
                    reservation_end_time: string | null
                    reservation_duration_minutes: number | null
                    payment_status: PaymentStatus
                    paid_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    patient_id: string
                    doctor_id: string
                    slot_id?: string | null
                    appointment_date: string
                    status?: AppointmentStatus
                    patient_notes?: string | null
                    is_refundable?: boolean
                    serial_number?: number | null
                    exact_appointment_time?: string | null
                    reservation_start_time?: string | null
                    reservation_end_time?: string | null
                    reservation_duration_minutes?: number | null
                    payment_status?: PaymentStatus
                    paid_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    patient_id?: string
                    doctor_id?: string
                    slot_id?: string | null
                    appointment_date?: string
                    status?: AppointmentStatus
                    patient_notes?: string | null
                    is_refundable?: boolean
                    serial_number?: number | null
                    exact_appointment_time?: string | null
                    reservation_start_time?: string | null
                    reservation_end_time?: string | null
                    reservation_duration_minutes?: number | null
                    payment_status?: PaymentStatus
                    paid_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            payments: {
                Row: {
                    id: string
                    appointment_id: string
                    patient_id: string
                    doctor_id: string
                    total_amount: number
                    admin_commission: number
                    doctor_earnings: number
                    payment_method: PaymentMethod
                    payment_status: PaymentStatus
                    transaction_id: string | null
                    stripe_payment_intent_id: string | null
                    paid_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    appointment_id: string
                    patient_id: string
                    doctor_id: string
                    total_amount: number
                    admin_commission: number
                    doctor_earnings: number
                    payment_method: PaymentMethod
                    payment_status?: PaymentStatus
                    transaction_id?: string | null
                    stripe_payment_intent_id?: string | null
                    paid_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    appointment_id?: string
                    patient_id?: string
                    doctor_id?: string
                    total_amount?: number
                    admin_commission?: number
                    doctor_earnings?: number
                    payment_method?: PaymentMethod
                    payment_status?: PaymentStatus
                    transaction_id?: string | null
                    stripe_payment_intent_id?: string | null
                    paid_at?: string | null
                    created_at?: string
                }
            }
            medicines: {
                Row: {
                    id: string
                    name: string
                    generic_name: string | null
                    dosage_form: string | null
                    strength: string | null
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    generic_name?: string | null
                    dosage_form?: string | null
                    strength?: string | null
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    generic_name?: string | null
                    dosage_form?: string | null
                    strength?: string | null
                    created_by?: string | null
                    created_at?: string
                }
            }
            tests: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    created_by?: string | null
                    created_at?: string
                }
            }
            prescriptions: {
                Row: {
                    id: string
                    appointment_id: string
                    doctor_id: string
                    patient_id: string
                    diagnosis: string | null
                    notes: string | null
                    follow_up_date: string | null
                    is_finalized: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    appointment_id: string
                    doctor_id: string
                    patient_id: string
                    diagnosis?: string | null
                    notes?: string | null
                    follow_up_date?: string | null
                    is_finalized?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    appointment_id?: string
                    doctor_id?: string
                    patient_id?: string
                    diagnosis?: string | null
                    notes?: string | null
                    follow_up_date?: string | null
                    is_finalized?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            prescription_medicines: {
                Row: {
                    id: string
                    prescription_id: string
                    medicine_id: string
                    dosage: string
                    frequency: string
                    duration: string
                    instructions: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    prescription_id: string
                    medicine_id: string
                    dosage: string
                    frequency: string
                    duration: string
                    instructions?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    prescription_id?: string
                    medicine_id?: string
                    dosage?: string
                    frequency?: string
                    duration?: string
                    instructions?: string | null
                    created_at?: string
                }
            }
            prescription_tests: {
                Row: {
                    id: string
                    prescription_id: string
                    test_id: string
                    instructions: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    prescription_id: string
                    test_id: string
                    instructions?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    prescription_id?: string
                    test_id?: string
                    instructions?: string | null
                    created_at?: string
                }
            }
            reviews: {
                Row: {
                    id: string
                    appointment_id: string
                    patient_id: string
                    doctor_id: string
                    rating: number
                    review_text: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    appointment_id: string
                    patient_id: string
                    doctor_id: string
                    rating: number
                    review_text?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    appointment_id?: string
                    patient_id?: string
                    doctor_id?: string
                    rating?: number
                    review_text?: string | null
                    created_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    is_read: boolean
                    related_appointment_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    is_read?: boolean
                    related_appointment_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    message?: string
                    type?: string
                    is_read?: boolean
                    related_appointment_id?: string | null
                    created_at?: string
                }
            }
            notification_preferences: {
                Row: {
                    id: string
                    email_appointment_confirmation: boolean
                    email_appointment_reminder: boolean
                    email_prescription_ready: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email_appointment_confirmation?: boolean
                    email_appointment_reminder?: boolean
                    email_prescription_ready?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email_appointment_confirmation?: boolean
                    email_appointment_reminder?: boolean
                    email_prescription_ready?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            admin_actions: {
                Row: {
                    id: string
                    admin_id: string
                    action_type: string
                    target_user_id: string | null
                    details: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    admin_id: string
                    action_type: string
                    target_user_id?: string | null
                    details?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    admin_id?: string
                    action_type?: string
                    target_user_id?: string | null
                    details?: Json | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: UserRole
            doctor_status: DoctorStatus
            appointment_status: AppointmentStatus
            payment_status: PaymentStatus
            payment_method: PaymentMethod
        }
    }
}
