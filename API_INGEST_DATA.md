# API de Ingestão de Dados — MDTFeedback

## Autenticação

Todas as requisições devem incluir o header:
```
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
```

## URL Base

```
https://miwiumgvnspnmxdmfnut.supabase.co/functions/v1/ingest-data
```

## Tipos Disponíveis

- `usuario`: cria um usuário de acesso à plataforma e registra perfil/papel. Se o papel for `seller`, o mesmo `id` também é cadastrado em `funcionarios` para uso em `vendedor_id`.
- `funcionario`: cadastra um funcionário/vendedor manualmente.
- `ligacao`: cadastra uma ligação analisada com link externo de áudio.
- `batch`: processa múltiplos itens em uma única chamada.

---

## POST — Criar Usuário

### JSON mínimo (obrigatório)

```json
{
  "type": "usuario",
  "data": {
    "email": "vendedor@empresa.com",
    "password": "SenhaForte123!",
    "nome_completo": "João da Silva"
  }
}
```

### JSON completo

```json
{
  "type": "usuario",
  "data": {
    "email": "vendedor@empresa.com",
    "password": "SenhaForte123!",
    "nome_completo": "João da Silva",
    "role": "seller",
    "email_confirmado": true
  }
}
```

### Exemplo completo com curl

```bash
curl -X POST https://miwiumgvnspnmxdmfnut.supabase.co/functions/v1/ingest-data \
  -H "Authorization: Bearer SUA_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "usuario",
    "data": {
      "email": "vendedor@empresa.com",
      "password": "SenhaForte123!",
      "nome_completo": "João da Silva",
      "role": "seller",
      "email_confirmado": true
    }
  }'
```

### Resposta de sucesso

```json
{
  "success": true,
  "data": {
    "id": "uuid-do-usuario",
    "email": "vendedor@empresa.com",
    "nome_completo": "João da Silva",
    "role": "seller",
    "email_confirmado": true,
    "funcionario_id": "uuid-do-usuario"
  }
}
```

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| email | String | **Sim** | E-mail de acesso do usuário |
| password | String | **Sim** | Senha inicial do usuário |
| nome_completo | String | **Sim** | Nome completo usado no perfil |
| role | Enum | Não | Papel do usuário: `developer`, `admin` ou `seller` (padrão: `seller`) |
| email_confirmado | Boolean | Não | Define se o usuário já sai com e-mail confirmado |

> Se `role` for `seller`, use o `funcionario_id` retornado como `vendedor_id` ao cadastrar ligações.

---

## POST — Cadastrar Funcionário

### JSON mínimo (obrigatório)

```json
{
  "type": "funcionario",
  "data": {
    "nome_completo": "João da Silva"
  }
}
```

### JSON completo (com ID personalizado)

```json
{
  "type": "funcionario",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome_completo": "João da Silva"
  }
}
```

### Exemplo completo com curl

```bash
curl -X POST https://miwiumgvnspnmxdmfnut.supabase.co/functions/v1/ingest-data \
  -H "Authorization: Bearer SUA_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "funcionario",
    "data": {
      "nome_completo": "João da Silva"
    }
  }'
```

### Resposta de sucesso

```json
{
  "success": true,
  "data": {
    "id": "uuid-gerado-automaticamente",
    "nome_completo": "João da Silva",
    "created_at": "2026-04-01T12:00:00.000Z"
  }
}
```

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Não | ID do funcionário (gerado automaticamente se não informado) |
| nome_completo | String | **Sim** | Nome completo do funcionário |

---

## POST — Cadastrar Ligação

### JSON mínimo (obrigatório)

```json
{
  "type": "ligacao",
  "data": {
    "vendedor_id": "uuid-do-funcionario",
    "resumo": "Ligação de 5 minutos sobre plano premium..."
  }
}
```

### JSON completo

```json
{
  "type": "ligacao",
  "data": {
    "id": "uuid-opcional",
    "vendedor_id": "uuid-do-funcionario",
    "pontos_bons": "Boa entonação, conhecimento do produto...",
    "pontos_ruins": "Faltou empatia, não ofereceu alternativas...",
    "resumo": "Ligação de 5 minutos sobre plano premium...",
    "url_audio": "https://exemplo.com/audio/ligacao-123.mp3"
  }
}
```

### Exemplo completo com curl

```bash
curl -X POST https://miwiumgvnspnmxdmfnut.supabase.co/functions/v1/ingest-data \
  -H "Authorization: Bearer SUA_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ligacao",
    "data": {
      "vendedor_id": "UUID_DO_FUNCIONARIO",
      "pontos_bons": "Boa comunicação",
      "pontos_ruins": "Faltou fechamento",
      "resumo": "Ligação sobre plano básico",
      "url_audio": "https://exemplo.com/audio.mp3"
    }
  }'
```

### Resposta de sucesso

```json
{
  "success": true,
  "data": {
    "id": "uuid-gerado-automaticamente",
    "vendedor_id": "uuid-do-funcionario",
    "pontos_bons": "Boa comunicação",
    "pontos_ruins": "Faltou fechamento",
    "resumo": "Ligação sobre plano básico",
    "url_audio": "https://exemplo.com/audio.mp3",
    "created_at": "2026-04-01T12:00:00.000Z"
  }
}
```

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Não | ID da ligação (gerado automaticamente se não informado) |
| vendedor_id | UUID | **Sim** | ID do funcionário (deve existir na tabela funcionarios) |
| pontos_bons | Text | Não | Pontos positivos identificados na ligação |
| pontos_ruins | Text | Não | Pontos negativos identificados na ligação |
| resumo | Text | Não | Resumo da ligação |
| url_audio | URL | Não | Link externo para download do áudio da ligação |

---

## POST — Batch (Lote)

```json
{
  "type": "batch",
  "data": {
    "items": [
      { "type": "usuario", "data": { "email": "novo@empresa.com", "password": "Senha123!", "nome_completo": "Maria Santos" } },
      { "type": "funcionario", "data": { "nome_completo": "Carlos Lima" } },
      { "type": "ligacao", "data": { "vendedor_id": "...", "resumo": "..." } }
    ]
  }
}
```
