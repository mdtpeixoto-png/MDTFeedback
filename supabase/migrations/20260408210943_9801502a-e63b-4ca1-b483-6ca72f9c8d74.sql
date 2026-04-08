-- Remove identity from id column so manual IDs are respected
ALTER TABLE public.funcionarios ALTER COLUMN id DROP IDENTITY IF EXISTS;

-- Fix the existing wrong record
UPDATE public.funcionarios SET id = 3536 WHERE id = 3 AND nome_completo = 'LUIZ EDUARDO MARTINS SERRA';
