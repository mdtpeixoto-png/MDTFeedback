
-- 1. Add email column to funcionarios if it doesn't exist
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS email VARCHAR(150);

-- 2. Drop the old insecure policy
DROP POLICY IF EXISTS "Sellers can view own ligacoes" ON public.ligacoes;

-- 3. Create a secure policy for sellers
-- This policy ensures that a seller can only see ligacoes where the vendedor_id 
-- matches a funcionario record that has the same email as the logged-in user's profile.
CREATE POLICY "Sellers can view own ligacoes" ON public.ligacoes
  FOR SELECT TO authenticated USING (
    vendedor_id IN (
      SELECT f.id FROM public.funcionarios f
      WHERE f.email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- 4. Promote specific users to admin role
-- We use ILIKE to match emails that contain the requested usernames
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE email ILIKE '%mdt.peixoto%' OR email ILIKE '%kpadocapa12012%'
ON CONFLICT (user_id, role) DO UPDATE SET role = 'admin'::app_role;

-- 5. Remove 'seller' role for these users if they have it, to avoid confusion 
-- (although they are now admins, having both might be redundant)
DELETE FROM public.user_roles 
WHERE user_id IN (
  SELECT user_id FROM public.profiles 
  WHERE email ILIKE '%mdt.peixoto%' OR email ILIKE '%kpadocapa12012%'
) 
AND role = 'seller';
