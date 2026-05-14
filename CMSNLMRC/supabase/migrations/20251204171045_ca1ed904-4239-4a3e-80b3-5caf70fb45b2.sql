-- Create exit_records table for counselling discharge forms
CREATE TABLE public.exit_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  exit_date date NOT NULL DEFAULT CURRENT_DATE,
  nature_of_discharge text NOT NULL CHECK (nature_of_discharge IN ('Complete', 'Incomplete')),
  incomplete_reason text,
  discharge_remarks text,
  reasons_for_treatment text,
  treatment_plan_problems text,
  family_involvement text,
  aftercare_plan text,
  aftercare_completion_date text,
  receiving_adult_name text,
  receiving_adult_id_number text,
  receiving_adult_relationship text,
  receiving_adult_relationship_other text,
  receiving_agency_name text,
  receiving_agency_contacts text,
  receiving_adult_position text,
  receiving_adult_address text,
  receiving_adult_remarks text,
  client_signature_name text,
  client_signature_date date,
  receiving_adult_signature_name text,
  receiving_adult_signature_date date,
  counsellor_signature_name text,
  counsellor_signature_date date,
  hors_signature_name text,
  hors_signature_date date,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exit_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view exit records"
ON public.exit_records FOR SELECT
USING (true);

CREATE POLICY "Counselling and admin can insert exit records"
ON public.exit_records FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'counselling'));

CREATE POLICY "Counselling and admin can update exit records"
ON public.exit_records FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'counselling'));

CREATE POLICY "Only admin can delete exit records"
ON public.exit_records FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_exit_records_updated_at
BEFORE UPDATE ON public.exit_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();