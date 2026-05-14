-- Create aftercare_records table for placement tracking
CREATE TABLE public.aftercare_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  institution_workshop TEXT NOT NULL,
  placement_course TEXT,
  contact_person TEXT,
  placement_date DATE,
  completion_status TEXT NOT NULL DEFAULT 'in progress',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.aftercare_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view aftercare records" 
ON public.aftercare_records 
FOR SELECT 
USING (true);

CREATE POLICY "Social work and admin can insert aftercare records" 
ON public.aftercare_records 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'social_work'::app_role));

CREATE POLICY "Social work and admin can update aftercare records" 
ON public.aftercare_records 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'social_work'::app_role));

CREATE POLICY "Only admin can delete aftercare records" 
ON public.aftercare_records 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_aftercare_records_updated_at
BEFORE UPDATE ON public.aftercare_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();