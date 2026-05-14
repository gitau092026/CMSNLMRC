-- Drop the overly restrictive policy that blocks user role insertion
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Allow users to insert their own role during signup
CREATE POLICY "Users can insert own role during signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow admins to manage all roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Keep the existing SELECT policy for all authenticated users
-- (it should already exist from the previous migration)