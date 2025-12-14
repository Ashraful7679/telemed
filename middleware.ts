export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'patient' | 'doctor' | 'admin'
          image_url: string | null
          blocked: boolean
        }
        Insert: {
          email: string
          name?: string | null
          role?: 'patient' | 'doctor' | 'admin'
          image_url?: string | null
          blocked?: boolean
        }
        Update: Partial<Insert>
      }

      availability_slots: {
        Row: {
          id: string
          doctor_id: string
          slot_date: string
          start_time: string
          end_time: string
          consultation_fee: number
          appointment_duration: number
          max_appointments: number
          allow_same_day_booking: boolean
          is_available: boolean
        }
        Insert: {
          doctor_id: string
          slot_date: string
          start_time: string
          end_time: string
          consultation_fee: number
          appointment_duration: number
          max_appointments: number
          allow_same_day_booking: boolean
          is_available: boolean
        }
        Update: Partial<Insert>
      }

      appointments: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          slot_id: string
          status: 'scheduled' | 'completed' | 'cancelled'
          payment_amount: number
          payment_method: 'bkash' | 'card' | 'other'
          created_at: string
        }
        Insert: {
          doctor_id: string
          patient_id: string
          slot_id: string
          status?: 'scheduled' | 'completed' | 'cancelled'
          payment_amount: number
          payment_method: 'bkash' | 'card' | 'other'
          created_at?: string
        }
        Update: Partial<Insert>
      }

      prescriptions: {
        Row: {
          id: string
          appointment_id: string
          doctor_id: string
          patient_id: string
          medicines: string[]
          tests: string[]
          created_at: string
        }
        Insert: {
          appointment_id: string
          doctor_id: string
          patient_id: string
          medicines: string[]
          tests: string[]
          created_at?: string
        }
        Update: Partial<Insert>
      }

      reviews: {
        Row: {
          id: string
          appointment_id: string
          patient_id: string
          doctor_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          appointment_id: string
          patient_id: string
          doctor_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: Partial<Insert>
      }
    }
  }
}
