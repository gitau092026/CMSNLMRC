-- Add placement type columns to aftercare_records table
ALTER TABLE public.aftercare_records
ADD COLUMN IF NOT EXISTS placement_type text,
ADD COLUMN IF NOT EXISTS placement_type_details text;