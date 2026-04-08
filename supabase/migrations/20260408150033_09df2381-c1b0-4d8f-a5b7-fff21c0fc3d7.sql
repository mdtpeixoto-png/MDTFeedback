
-- Drop policies on ligacoes first
DROP POLICY IF EXISTS "Admins can view all ligacoes" ON public.ligacoes;
DROP POLICY IF EXISTS "Devs can view all ligacoes" ON public.ligacoes;
DROP POLICY IF EXISTS "Sellers can view own ligacoes" ON public.ligacoes;

-- Drop policies on funcionarios
DROP POLICY IF EXISTS "Authenticated users can view funcionarios" ON public.funcionarios;

-- Now drop tables
DROP TABLE IF EXISTS public.ligacoes;
DROP TABLE IF EXISTS public.funcionarios;

-- Recreate funcionarios with bigint ID
CREATE TABLE public.funcionarios (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_completo varchar NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view funcionarios" ON public.funcionarios
  FOR SELECT TO authenticated USING (true);

-- Recreate ligacoes with bigint vendedor_id
CREATE TABLE public.ligacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedor_id bigint NOT NULL REFERENCES public.funcionarios(id),
  vendedor_nome text,
  lead_id text,
  pontos_bons text,
  pontos_ruins text,
  resumo text,
  url_audio text,
  status boolean DEFAULT false,
  receita numeric DEFAULT 0,
  operadora text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ligacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all ligacoes" ON public.ligacoes
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Devs can view all ligacoes" ON public.ligacoes
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'developer'));

CREATE POLICY "Sellers can view own ligacoes" ON public.ligacoes
  FOR SELECT TO authenticated USING (
    vendedor_id IN (SELECT f.id FROM funcionarios f WHERE f.id = ligacoes.vendedor_id)
  );
