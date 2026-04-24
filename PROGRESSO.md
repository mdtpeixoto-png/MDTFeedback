# MDTFeedback - Progresso do Projeto

## O que foi implementado

### Edge Function (sync-calls)
- **Local**: `supabase/functions/sync-calls/index.ts`
- **Função**: Sincroniza ligações e vendas do MySQL + MakeSystem para o Supabase
- **Análise**: Usa Gemini AI para analisar transcrições

### Fluxos implementados
1. **Fluxo A**: Busca última venda no MakeSystem → salva em `ligacoes` (com análise) ou `vendas` (sem análise)
2. **Fluxo B**: Busca última ligação no MySQL → analisa com Gemini → salva em `ligacoes`

### Tabelas no Supabase
- `ligacoes`: Ligações com análise (pontos_bons, pontos_ruins, resumo, technical_quality, score)
- `vendas`: Vendas sem análise (apenas dados da venda)

### Frontend
- Menu "Vendas" adicionado no sidebar admin (`src/components/layout/AppSidebar.tsx`)

---

## Onde paramos

### Erro atual
```
[Fluxo B] Falha ao processar ligação para 1565: failed to lookup address information: Name or service not known
```

### Causa
O Supabase não consegue resolver o hostname `rs.gvcatelecom.com.br` - problema de rede/DNS.

### Solução necessária
Liberar o acesso do Supabase ao servidor MySQL:
- Adicionar IPs do Supabase (54.221.0.0/16, 54.160.0.0/16, 3.216.0.0/14, 52.0.0.0/14) no firewall do servidor MySQL
- Ou expor o MySQL de outra forma acessível

---

## Próximos passos

1. **Resolver acesso MySQL** - Liberar IPs do Supabase
2. **Testar edge function** - Após resolver rede
3. **Criar página de Vendas no admin** - Nova página para ver vendas (tabela `vendas`)
4. **Dashboard de vendas por produto** - Buscar operadora da fafalabs API

---

## Códigos e Chaves

- MySQL: `rs.gvcatelecom.com.br:3339` (asteriskcdrdb)
- Supabase: Projeto `tbwyveaizqgkdbmjzudz`
- Gemini AI Key: `AIzaSyCQ-h57vkue0fSb2Q-INW2wzjK0E-WG040`
- MakeSystem Key: `5B89EC45-B32C-4A2F-BFC9-A027FCAEF771`
- FafaLabs Token: `pp3lP4jqgzA8QLP6hw`

---

## Estrutura das tabelas

### ligacoes
```sql
id UUID PRIMARY KEY
external_id BIGINT
lead_id TEXT
vendedor_id INTEGER
vendedor_nome TEXT
pontos_bons TEXT
pontos_ruins TEXT
resumo TEXT
technical_quality NUMERIC
score INTEGER
status BOOLEAN
receita NUMERIC
operadora TEXT
url_audio TEXT
created_at TIMESTAMPTZ
```

### vendas
```sql
id UUID PRIMARY KEY
external_id BIGINT
lead_id TEXT UNIQUE
vendedor_id INTEGER
vendedor_nome TEXT
pontos_bons TEXT
pontos_ruins TEXT
resumo TEXT
technical_quality NUMERIC
score INTEGER
status BOOLEAN
receita NUMERIC
operadora TEXT
url_audio TEXT
created_at TIMESTAMPTZ
```