-- Add new columns to ligacoes table
ALTER TABLE public.ligacoes 
  ADD COLUMN IF NOT EXISTS lead_id text,
  ADD COLUMN IF NOT EXISTS status boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS receita numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS operadora text,
  ADD COLUMN IF NOT EXISTS vendedor_nome text;

-- Clean existing data from all tables (keep structure)
DELETE FROM public.ligacoes;
DELETE FROM public.sales;
DELETE FROM public.idle_time_logs;
DELETE FROM public.ai_feedbacks;
DELETE FROM public.ai_error_logs;
DELETE FROM public.call_tags;
DELETE FROM public.calls;

-- Remove funcionarios that aren't linked to dev/admin users
DELETE FROM public.funcionarios;