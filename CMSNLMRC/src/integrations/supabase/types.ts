export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aftercare_records: {
        Row: {
          client_id: string
          completion_date: string | null
          completion_status: string
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          institution_workshop: string
          notes: string | null
          placement_course: string | null
          placement_date: string | null
          placement_fees: number | null
          placement_location: string | null
          placement_type: string | null
          placement_type_details: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          completion_date?: string | null
          completion_status?: string
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          institution_workshop: string
          notes?: string | null
          placement_course?: string | null
          placement_date?: string | null
          placement_fees?: number | null
          placement_location?: string | null
          placement_type?: string | null
          placement_type_details?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          completion_date?: string | null
          completion_status?: string
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          institution_workshop?: string
          notes?: string | null
          placement_course?: string | null
          placement_date?: string | null
          placement_fees?: number | null
          placement_location?: string | null
          placement_type?: string | null
          placement_type_details?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aftercare_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          admission_date: string | null
          admission_type: string | null
          admission_type_details: string | null
          age: number | null
          client_id: string
          contact: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          education_level: string | null
          education_status: string | null
          family_composition: string | null
          father_contact: string | null
          father_location: string | null
          father_name: string | null
          father_occupation: string | null
          father_status: string | null
          gender: string | null
          guardian_contact: string | null
          guardian_location: string | null
          guardian_name: string | null
          guardian_occupation: string | null
          guardian_status: string | null
          id: string
          intake_number: string | null
          level_reached: string | null
          mother_contact: string | null
          mother_location: string | null
          mother_name: string | null
          mother_occupation: string | null
          mother_status: string | null
          name: string
          nickname: string | null
          notes: string | null
          partner_contact: string | null
          partner_contact_person: string | null
          partner_name: string | null
          police_ob_number: string | null
          profile_picture: string | null
          rescue_details: string | null
          school_name: string | null
          siblings_info: string | null
          status: string | null
          street_duration: string | null
          street_name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          admission_type?: string | null
          admission_type_details?: string | null
          age?: number | null
          client_id: string
          contact?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          education_level?: string | null
          education_status?: string | null
          family_composition?: string | null
          father_contact?: string | null
          father_location?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_status?: string | null
          gender?: string | null
          guardian_contact?: string | null
          guardian_location?: string | null
          guardian_name?: string | null
          guardian_occupation?: string | null
          guardian_status?: string | null
          id?: string
          intake_number?: string | null
          level_reached?: string | null
          mother_contact?: string | null
          mother_location?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_status?: string | null
          name: string
          nickname?: string | null
          notes?: string | null
          partner_contact?: string | null
          partner_contact_person?: string | null
          partner_name?: string | null
          police_ob_number?: string | null
          profile_picture?: string | null
          rescue_details?: string | null
          school_name?: string | null
          siblings_info?: string | null
          status?: string | null
          street_duration?: string | null
          street_name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          admission_type?: string | null
          admission_type_details?: string | null
          age?: number | null
          client_id?: string
          contact?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          education_level?: string | null
          education_status?: string | null
          family_composition?: string | null
          father_contact?: string | null
          father_location?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_status?: string | null
          gender?: string | null
          guardian_contact?: string | null
          guardian_location?: string | null
          guardian_name?: string | null
          guardian_occupation?: string | null
          guardian_status?: string | null
          id?: string
          intake_number?: string | null
          level_reached?: string | null
          mother_contact?: string | null
          mother_location?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_status?: string | null
          name?: string
          nickname?: string | null
          notes?: string | null
          partner_contact?: string | null
          partner_contact_person?: string | null
          partner_name?: string | null
          police_ob_number?: string | null
          profile_picture?: string | null
          rescue_details?: string | null
          school_name?: string | null
          siblings_info?: string | null
          status?: string | null
          street_duration?: string | null
          street_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      exit_records: {
        Row: {
          aftercare_completion_date: string | null
          aftercare_plan: string | null
          client_id: string
          client_signature_date: string | null
          client_signature_name: string | null
          counsellor_signature_date: string | null
          counsellor_signature_name: string | null
          created_at: string | null
          created_by: string | null
          discharge_remarks: string | null
          exit_date: string
          family_involvement: string | null
          hors_signature_date: string | null
          hors_signature_name: string | null
          id: string
          incomplete_reason: string | null
          nature_of_discharge: string
          reasons_for_treatment: string | null
          receiving_adult_address: string | null
          receiving_adult_id_number: string | null
          receiving_adult_name: string | null
          receiving_adult_position: string | null
          receiving_adult_relationship: string | null
          receiving_adult_relationship_other: string | null
          receiving_adult_remarks: string | null
          receiving_adult_signature_date: string | null
          receiving_adult_signature_name: string | null
          receiving_agency_contacts: string | null
          receiving_agency_name: string | null
          treatment_plan_problems: string | null
          updated_at: string | null
        }
        Insert: {
          aftercare_completion_date?: string | null
          aftercare_plan?: string | null
          client_id: string
          client_signature_date?: string | null
          client_signature_name?: string | null
          counsellor_signature_date?: string | null
          counsellor_signature_name?: string | null
          created_at?: string | null
          created_by?: string | null
          discharge_remarks?: string | null
          exit_date?: string
          family_involvement?: string | null
          hors_signature_date?: string | null
          hors_signature_name?: string | null
          id?: string
          incomplete_reason?: string | null
          nature_of_discharge: string
          reasons_for_treatment?: string | null
          receiving_adult_address?: string | null
          receiving_adult_id_number?: string | null
          receiving_adult_name?: string | null
          receiving_adult_position?: string | null
          receiving_adult_relationship?: string | null
          receiving_adult_relationship_other?: string | null
          receiving_adult_remarks?: string | null
          receiving_adult_signature_date?: string | null
          receiving_adult_signature_name?: string | null
          receiving_agency_contacts?: string | null
          receiving_agency_name?: string | null
          treatment_plan_problems?: string | null
          updated_at?: string | null
        }
        Update: {
          aftercare_completion_date?: string | null
          aftercare_plan?: string | null
          client_id?: string
          client_signature_date?: string | null
          client_signature_name?: string | null
          counsellor_signature_date?: string | null
          counsellor_signature_name?: string | null
          created_at?: string | null
          created_by?: string | null
          discharge_remarks?: string | null
          exit_date?: string
          family_involvement?: string | null
          hors_signature_date?: string | null
          hors_signature_name?: string | null
          id?: string
          incomplete_reason?: string | null
          nature_of_discharge?: string
          reasons_for_treatment?: string | null
          receiving_adult_address?: string | null
          receiving_adult_id_number?: string | null
          receiving_adult_name?: string | null
          receiving_adult_position?: string | null
          receiving_adult_relationship?: string | null
          receiving_adult_relationship_other?: string | null
          receiving_adult_remarks?: string | null
          receiving_adult_signature_date?: string | null
          receiving_adult_signature_name?: string | null
          receiving_agency_contacts?: string | null
          receiving_agency_name?: string | null
          treatment_plan_problems?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exit_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      home_visits: {
        Row: {
          aftercare_followup_plan: string | null
          assessment_report: string | null
          caregiver_contacts: string | null
          caregiver_relationship: string | null
          caseworker_name: string | null
          client_id: string
          county: string | null
          course_placement_plans: string | null
          created_at: string | null
          date_of_exit: string | null
          disability_status: string | null
          family_interventions: string | null
          id: string
          key_contacts: string | null
          nature_of_reintegration: string | null
          proposed_caregivers: string | null
          reintegration_location: string | null
          reintegration_plans: string | null
          reintegration_recommendations: string | null
          subcounty: string | null
          updated_at: string | null
          village: string | null
          visit_date: string
          visited_by: string | null
        }
        Insert: {
          aftercare_followup_plan?: string | null
          assessment_report?: string | null
          caregiver_contacts?: string | null
          caregiver_relationship?: string | null
          caseworker_name?: string | null
          client_id: string
          county?: string | null
          course_placement_plans?: string | null
          created_at?: string | null
          date_of_exit?: string | null
          disability_status?: string | null
          family_interventions?: string | null
          id?: string
          key_contacts?: string | null
          nature_of_reintegration?: string | null
          proposed_caregivers?: string | null
          reintegration_location?: string | null
          reintegration_plans?: string | null
          reintegration_recommendations?: string | null
          subcounty?: string | null
          updated_at?: string | null
          village?: string | null
          visit_date: string
          visited_by?: string | null
        }
        Update: {
          aftercare_followup_plan?: string | null
          assessment_report?: string | null
          caregiver_contacts?: string | null
          caregiver_relationship?: string | null
          caseworker_name?: string | null
          client_id?: string
          county?: string | null
          course_placement_plans?: string | null
          created_at?: string | null
          date_of_exit?: string | null
          disability_status?: string | null
          family_interventions?: string | null
          id?: string
          key_contacts?: string | null
          nature_of_reintegration?: string | null
          proposed_caregivers?: string | null
          reintegration_location?: string | null
          reintegration_plans?: string | null
          reintegration_recommendations?: string | null
          subcounty?: string | null
          updated_at?: string | null
          village?: string | null
          visit_date?: string
          visited_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_visits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      marks: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          grade: string | null
          id: string
          marks: number
          remarks: string | null
          subject_id: string
          term: string
          updated_at: string
          year: number
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          grade?: string | null
          id?: string
          marks: number
          remarks?: string | null
          subject_id: string
          term: string
          updated_at?: string
          year: number
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          grade?: string | null
          id?: string
          marks?: number
          remarks?: string | null
          subject_id?: string
          term?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "marks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string | null
          diagnosis: string | null
          doctor_name: string | null
          follow_up_date: string | null
          hospital_name: string
          id: string
          medications_prescribed: string | null
          notes: string | null
          reason_for_visit: string
          treatment_given: string | null
          updated_at: string | null
          visit_date: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by?: string | null
          diagnosis?: string | null
          doctor_name?: string | null
          follow_up_date?: string | null
          hospital_name: string
          id?: string
          medications_prescribed?: string | null
          notes?: string | null
          reason_for_visit: string
          treatment_given?: string | null
          updated_at?: string | null
          visit_date?: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          diagnosis?: string | null
          doctor_name?: string | null
          follow_up_date?: string | null
          hospital_name?: string
          id?: string
          medications_prescribed?: string | null
          notes?: string | null
          reason_for_visit?: string
          treatment_given?: string | null
          updated_at?: string | null
          visit_date?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      soap_notes: {
        Row: {
          areas_to_focus: string | null
          assessment: string | null
          client_id: string
          counsellor_name: string
          created_at: string | null
          created_by: string | null
          id: string
          next_session_date: string | null
          objective: string | null
          plan: string | null
          session_date: string
          session_time: string | null
          subjective: string | null
          updated_at: string | null
        }
        Insert: {
          areas_to_focus?: string | null
          assessment?: string | null
          client_id: string
          counsellor_name: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          next_session_date?: string | null
          objective?: string | null
          plan?: string | null
          session_date?: string
          session_time?: string | null
          subjective?: string | null
          updated_at?: string | null
        }
        Update: {
          areas_to_focus?: string | null
          assessment?: string | null
          client_id?: string
          counsellor_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          next_session_date?: string | null
          objective?: string | null
          plan?: string | null
          session_date?: string
          session_time?: string | null
          subjective?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soap_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "social_work"
        | "education"
        | "counselling"
        | "empowerment"
        | "housekeeping"
        | "finance"
        | "agriculture"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "social_work",
        "education",
        "counselling",
        "empowerment",
        "housekeeping",
        "finance",
        "agriculture",
      ],
    },
  },
} as const
