-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marks table
CREATE TABLE public.marks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  marks NUMERIC(5,2) NOT NULL CHECK (marks >= 0 AND marks <= 100),
  grade TEXT,
  term TEXT NOT NULL,
  year INTEGER NOT NULL,
  remarks TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, subject_id, term, year)
);

-- Enable Row Level Security
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subjects table
CREATE POLICY "Authenticated users can view subjects"
  ON public.subjects
  FOR SELECT
  USING (true);

CREATE POLICY "Education staff and admins can insert subjects"
  ON public.subjects
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'education'::app_role)
  );

CREATE POLICY "Education staff and admins can update subjects"
  ON public.subjects
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'education'::app_role)
  );

CREATE POLICY "Education staff and admins can delete subjects"
  ON public.subjects
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'education'::app_role)
  );

-- RLS Policies for marks table
CREATE POLICY "Authenticated users can view marks"
  ON public.marks
  FOR SELECT
  USING (true);

CREATE POLICY "Education staff and admins can insert marks"
  ON public.marks
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'education'::app_role)
  );

CREATE POLICY "Education staff and admins can update marks"
  ON public.marks
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'education'::app_role)
  );

CREATE POLICY "Education staff and admins can delete marks"
  ON public.marks
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'education'::app_role)
  );

-- Create trigger for automatic timestamp updates on subjects
CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on marks
CREATE TRIGGER update_marks_updated_at
  BEFORE UPDATE ON public.marks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_marks_client_id ON public.marks(client_id);
CREATE INDEX idx_marks_subject_id ON public.marks(subject_id);
CREATE INDEX idx_marks_term_year ON public.marks(term, year);