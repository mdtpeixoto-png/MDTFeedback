-- Aumentar a escala da coluna technical_quality para permitir nota 10.00
ALTER TABLE public.ligacoes ALTER COLUMN technical_quality TYPE NUMERIC(4,2);
