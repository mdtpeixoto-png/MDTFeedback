
-- Create funcionarios table
CREATE TABLE public.funcionarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo varchar NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create ligacoes table
CREATE TABLE public.ligacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  pontos_bons text,
  pontos_ruins text,
  resumo text,
  url_audio text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ligacoes ENABLE ROW LEVEL SECURITY;

-- Funcionarios: authenticated users can read
CREATE POLICY "Authenticated users can view funcionarios"
ON public.funcionarios FOR SELECT TO authenticated
USING (true);

-- Ligacoes: admins and devs can view all, sellers can view own
CREATE POLICY "Admins can view all ligacoes"
ON public.ligacoes FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Devs can view all ligacoes"
ON public.ligacoes FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Sellers can view own ligacoes"
ON public.ligacoes FOR SELECT TO authenticated
USING (vendedor_id IN (
  SELECT f.id FROM public.funcionarios f
  WHERE f.id = vendedor_id
));
