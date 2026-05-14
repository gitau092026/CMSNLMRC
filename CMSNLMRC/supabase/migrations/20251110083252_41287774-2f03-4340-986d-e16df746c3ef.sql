-- Update home_visits table with new comprehensive fields
ALTER TABLE home_visits 
  DROP COLUMN IF EXISTS purpose,
  DROP COLUMN IF EXISTS findings,
  DROP COLUMN IF EXISTS recommendations,
  DROP COLUMN IF EXISTS visit_time,
  DROP COLUMN IF EXISTS follow_up_required,
  DROP COLUMN IF EXISTS follow_up_date;

-- Add new comprehensive home visit fields
ALTER TABLE home_visits
  ADD COLUMN disability_status TEXT,
  ADD COLUMN date_of_exit DATE,
  ADD COLUMN assessment_report TEXT,
  ADD COLUMN key_contacts TEXT,
  ADD COLUMN reintegration_plans TEXT,
  ADD COLUMN proposed_caregivers TEXT,
  ADD COLUMN caregiver_relationship TEXT,
  ADD COLUMN caregiver_contacts TEXT,
  ADD COLUMN nature_of_reintegration TEXT,
  ADD COLUMN reintegration_location TEXT,
  ADD COLUMN village TEXT,
  ADD COLUMN subcounty TEXT,
  ADD COLUMN county TEXT,
  ADD COLUMN reintegration_recommendations TEXT,
  ADD COLUMN course_placement_plans TEXT,
  ADD COLUMN caseworker_name TEXT,
  ADD COLUMN family_interventions TEXT,
  ADD COLUMN aftercare_followup_plan TEXT;