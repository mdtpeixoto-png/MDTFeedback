
-- 1. Tabela de Controle de Ligações (para evitar duplicidade do MySQL)
ALTER TABLE public.ligacoes ADD COLUMN IF NOT EXISTS external_id BIGINT UNIQUE;
ALTER TABLE public.ligacoes ADD COLUMN IF NOT EXISTS score INTEGER; -- Para a curva de aprendizado
ALTER TABLE public.ligacoes ADD COLUMN IF NOT EXISTS technical_quality NUMERIC(3,2); -- 0.00 a 10.00

-- 2. Tabela: Script de Fases
CREATE TABLE IF NOT EXISTS public.ai_script_fases (
  id SERIAL PRIMARY KEY,
  fase INTEGER,
  titulo VARCHAR(50),
  objetivo TEXT,
  gatilhos_esperados TEXT
);

-- 3. Tabela: Matriz de Objeções
CREATE TABLE IF NOT EXISTS public.ai_matriz_objecoes (
  id SERIAL PRIMARY KEY,
  termo VARCHAR(100),
  argumento TEXT
);

-- 4. Tabela: Critérios de Qualidade
CREATE TABLE IF NOT EXISTS public.ai_criterio_qualidades (
  id SERIAL PRIMARY KEY,
  criterio VARCHAR(50),
  tipo VARCHAR(20), -- 'Positivo' ou 'Negativo'
  regra TEXT
);

-- Inserir dados padrão (Script Fases)
INSERT INTO public.ai_script_fases (fase, titulo, objetivo, gatilhos_esperados) VALUES
(1, 'Abertura', 'Gerar curiosidade sobre liberação de fibra.', 'Liberação de internet, Rua/Bairro, Quem responde pelo local'),
(2, 'Sondagem', 'Fazer o cliente falar sobre problemas atuais.', 'Como está a internet?, Instalação, Reparo, Sinal'),
(3, 'Comparativo', 'Explicar a superioridade da fibra vs cobre.', 'Diferença, Interferência, Oscilação, Velocidade constante'),
(4, 'Fechamento', 'Oferta ativa e escolha guiada.', '700 mega, R$130, Manhã ou tarde, Boleto ou boleto')
ON CONFLICT DO NOTHING;

-- Inserir dados padrão (Critérios)
INSERT INTO public.ai_criterio_qualidades (criterio, tipo, regra) VALUES
('Tom de Voz', 'Positivo', 'Conversa amigável e natural'),
('Escuta Ativa', 'Positivo', 'Aguardar resposta e ouvir o cliente'),
('Ética', 'Negativo', 'Proibido falar mal da concorrência'),
('Velocidade', 'Negativo', 'Proibido falar rápido demais'),
('Postura', 'Negativo', 'Proibido forçar fechamento cedo demais')
ON CONFLICT DO NOTHING;

-- Enable RLS for new tables
ALTER TABLE public.ai_script_fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_matriz_objecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_criterio_qualidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all authenticated users" ON public.ai_script_fases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for all authenticated users" ON public.ai_matriz_objecoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for all authenticated users" ON public.ai_criterio_qualidades FOR SELECT TO authenticated USING (true);
