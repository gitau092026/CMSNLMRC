-- Add new columns to aftercare_records table
ALTER TABLE public.aftercare_records
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS completion_date date,
ADD COLUMN IF NOT EXISTS placement_location text,
ADD COLUMN IF NOT EXISTS placement_fees numeric;