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
    PostgrestVersion: "14.5"
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
            referencedRelation: "client_admission_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aftercare_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_disability_assessment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aftercare_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      case_plans: {
        Row: {
          case_manager_date: string | null
          case_manager_name: string | null
          case_manager_signature: string | null
          caseworker_date: string | null
          caseworker_name: string | null
          caseworker_signature: string | null
          client_id: string
          created_at: string | null
          economic_entries: Json | null
          economic_goals: string | null
          education_entries: Json | null
          education_goals: string | null
          health_entries: Json | null
          health_goals: string | null
          id: string
          plan_date: string | null
          protection_entries: Json | null
          protection_goals: string | null
          psychosocial_entries: Json | null
          psychosocial_goals: string | null
          relationship_entries: Json | null
          relationship_goals: string | null
          saved_sections: string[] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          case_manager_date?: string | null
          case_manager_name?: string | null
          case_manager_signature?: string | null
          caseworker_date?: string | null
          caseworker_name?: string | null
          caseworker_signature?: string | null
          client_id: string
          created_at?: string | null
          economic_entries?: Json | null
          economic_goals?: string | null
          education_entries?: Json | null
          education_goals?: string | null
          health_entries?: Json | null
          health_goals?: string | null
          id?: string
          plan_date?: string | null
          protection_entries?: Json | null
          protection_goals?: string | null
          psychosocial_entries?: Json | null
          psychosocial_goals?: string | null
          relationship_entries?: Json | null
          relationship_goals?: string | null
          saved_sections?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          case_manager_date?: string | null
          case_manager_name?: string | null
          case_manager_signature?: string | null
          caseworker_date?: string | null
          caseworker_name?: string | null
          caseworker_signature?: string | null
          client_id?: string
          created_at?: string | null
          economic_entries?: Json | null
          economic_goals?: string | null
          education_entries?: Json | null
          education_goals?: string | null
          health_entries?: Json | null
          health_goals?: string | null
          id?: string
          plan_date?: string | null
          protection_entries?: Json | null
          protection_goals?: string | null
          psychosocial_entries?: Json | null
          psychosocial_goals?: string | null
          relationship_entries?: Json | null
          relationship_goals?: string | null
          saved_sections?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_admission_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_disability_assessment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_plans_client_id_fkey"
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
            referencedRelation: "client_admission_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_disability_assessment"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "client_admission_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_visits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_disability_assessment"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "client_admission_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_disability_assessment"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "client_admission_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soap_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_disability_assessment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soap_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      street_visits: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          lat: number | null
          lng: number | null
          notes: string | null
          staff: string
          street_name: string
          visit_date: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          staff: string
          street_name: string
          visit_date: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          staff?: string
          street_name?: string
          visit_date?: string
        }
        Relationships: []
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
      client_admission_details: {
        Row: {
          admission_age: string | null
          admission_date: string | null
          admission_order_issued: string | null
          client_id: string | null
          committal_date: string | null
          committal_order_no: string | null
          current_care_placement_other: string | null
          current_care_placement_type: Json | null
          current_care_provider_name: string | null
          current_care_provider_phone: string | null
          current_care_provider_reg: string | null
          history_of_placements_notes: string | null
          history_placements_data: Json | null
          id: string | null
          name: string | null
          other_admission_forms: Json | null
          placement_order_no: string | null
          pre_admission_living: string | null
          reasons_for_admission_list: Json | null
          reasons_for_admission_other: string | null
          referrer_contact: string | null
          referrer_location: string | null
          referrer_name: string | null
          referrer_relationship: string | null
          referrer_title: string | null
          vulnerability_location_separation: string | null
          vulnerability_location_street: string | null
          vulnerability_other: string | null
          vulnerability_type: Json | null
        }
        Insert: {
          admission_age?: never
          admission_date?: string | null
          admission_order_issued?: never
          client_id?: string | null
          committal_date?: never
          committal_order_no?: never
          current_care_placement_other?: never
          current_care_placement_type?: never
          current_care_provider_name?: never
          current_care_provider_phone?: never
          current_care_provider_reg?: never
          history_of_placements_notes?: never
          history_placements_data?: never
          id?: string | null
          name?: string | null
          other_admission_forms?: never
          placement_order_no?: never
          pre_admission_living?: never
          reasons_for_admission_list?: never
          reasons_for_admission_other?: never
          referrer_contact?: never
          referrer_location?: never
          referrer_name?: never
          referrer_relationship?: never
          referrer_title?: never
          vulnerability_location_separation?: never
          vulnerability_location_street?: never
          vulnerability_other?: never
          vulnerability_type?: never
        }
        Update: {
          admission_age?: never
          admission_date?: string | null
          admission_order_issued?: never
          client_id?: string | null
          committal_date?: never
          committal_order_no?: never
          current_care_placement_other?: never
          current_care_placement_type?: never
          current_care_provider_name?: never
          current_care_provider_phone?: never
          current_care_provider_reg?: never
          history_of_placements_notes?: never
          history_placements_data?: never
          id?: string | null
          name?: string | null
          other_admission_forms?: never
          placement_order_no?: never
          pre_admission_living?: never
          reasons_for_admission_list?: never
          reasons_for_admission_other?: never
          referrer_contact?: never
          referrer_location?: never
          referrer_name?: never
          referrer_relationship?: never
          referrer_title?: never
          vulnerability_location_separation?: never
          vulnerability_location_street?: never
          vulnerability_other?: never
          vulnerability_type?: never
        }
        Relationships: []
      }
      client_disability_assessment: {
        Row: {
          admission_date: string | null
          age: number | null
          birth_registered: string | null
          birth_registration_number: string | null
          client_id: string | null
          cognitive_details: string | null
          cognitive_difficulty: string | null
          communication_details: string | null
          communication_difficulty: string | null
          gender: string | null
          has_disability: boolean | null
          hearing_details: string | null
          hearing_difficulty: string | null
          id: string | null
          mobility_details: string | null
          mobility_difficulty: string | null
          name: string | null
          selfcare_details: string | null
          selfcare_difficulty: string | null
          status: string | null
          vision_details: string | null
          vision_difficulty: string | null
        }
        Insert: {
          admission_date?: string | null
          age?: number | null
          birth_registered?: never
          birth_registration_number?: never
          client_id?: string | null
          cognitive_details?: never
          cognitive_difficulty?: never
          communication_details?: never
          communication_difficulty?: never
          gender?: string | null
          has_disability?: never
          hearing_details?: never
          hearing_difficulty?: never
          id?: string | null
          mobility_details?: never
          mobility_difficulty?: never
          name?: string | null
          selfcare_details?: never
          selfcare_difficulty?: never
          status?: string | null
          vision_details?: never
          vision_difficulty?: never
        }
        Update: {
          admission_date?: string | null
          age?: number | null
          birth_registered?: never
          birth_registration_number?: never
          client_id?: string | null
          cognitive_details?: never
          cognitive_difficulty?: never
          communication_details?: never
          communication_difficulty?: never
          gender?: string | null
          has_disability?: never
          hearing_details?: never
          hearing_difficulty?: never
          id?: string | null
          mobility_details?: never
          mobility_difficulty?: never
          name?: string | null
          selfcare_details?: never
          selfcare_difficulty?: never
          status?: string | null
          vision_details?: never
          vision_difficulty?: never
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          username: string
          role: Database["public"]["Enums"]["app_role"]
        }
      }
      get_auth_user_data: {
        Args: { _user_id: string }
        Returns: {
          id: string
          email: string
          created_at: string
        }
      }
      get_dashboard_raw_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
        | "aftercare"
        | "alumni"
        | "intern_social_work"
        | "intern_counselling"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
        "aftercare",
        "alumni",
        "intern_social_work",
        "intern_counselling",
      ],
    },
  },
} as const
