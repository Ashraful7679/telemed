// lib/supabase/types.ts
export type Database = {
  public: {
    Tables: {
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
    }
  }
}

