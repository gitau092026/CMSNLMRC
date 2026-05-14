-- Ensure the SELECT policy exists for user_roles
-- Drop it first if it exists to recreate it properly
DROP POLICY IF EXISTS "Authenticated users can view all roles" ON public.user_roles;

-- Allow all authenticated users to view all roles
CREATE POLICY "Authenticated users can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);