-- Script para visualizar estrutura da tabela ligacoes
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ligacoes'
ORDER BY ordinal_position;

-- Script para criarnova tabela vendas (estrutura base)
CREATE TABLE IF NOT EXISTS vendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id TEXT,
    lead_id TEXT UNIQUE,
    vendedor_id INTEGER,
    vendedor_nome TEXT,
    pontos_bons TEXT,
    pontos_ruins TEXT,
    resumo TEXT,
    technical_quality INTEGER,
    score INTEGER,
    status BOOLEAN DEFAULT false,
    receita NUMERIC(20,2),
    operadora TEXT,
    url_audio TEXT,
    id_origem INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);