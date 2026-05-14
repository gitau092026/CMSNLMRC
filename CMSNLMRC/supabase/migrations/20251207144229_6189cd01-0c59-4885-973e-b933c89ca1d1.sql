-- Create medical_records table for hospital visits tracking
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hospital_name TEXT NOT NULL,
  reason_for_visit TEXT NOT NULL,
  diagnosis TEXT,
  treatment_given TEXT,
  medications_prescribed TEXT,
  follow_up_date DATE,
  doctor_name TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view medical records" 
ON public.medical_records 
FOR SELECT 
USING (true);

CREATE POLICY "Housekeeping and admin can insert medical records" 
ON public.medical_records 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'housekeeping'::app_role));

CREATE POLICY "Housekeeping and admin can update medical records" 
ON public.medical_records 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'housekeeping'::app_role));

CREATE POLICY "Only admin can delete medical records" 
ON public.medical_records 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_medical_records_updated_at
BEFORE UPDATE ON public.medical_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();