-- Create soap_notes table for counselling session notes
CREATE TABLE public.soap_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  counsellor_name text NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  session_time text,
  subjective text,
  objective text,
  assessment text,
  plan text,
  next_session_date date,
  areas_to_focus text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.soap_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view soap notes"
ON public.soap_notes FOR SELECT
USING (true);

CREATE POLICY "Counselling and admin can insert soap notes"
ON public.soap_notes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'counselling'));

CREATE POLICY "Counselling and admin can update soap notes"
ON public.soap_notes FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'counselling'));

CREATE POLICY "Only admin can delete soap notes"
ON public.soap_notes FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_soap_notes_updated_at
BEFORE UPDATE ON public.soap_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();