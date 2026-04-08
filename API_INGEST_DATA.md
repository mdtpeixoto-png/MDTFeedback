# API de Feedback — MDTFeedback

## Autenticação

Todas as requisições devem incluir o header:
```
Authorization: Bearer <API_KEY>
```

## URL Base

```
https://miwiumgvnspnmxdmfnut.supabase.co/functions/v1/ingest-data
```

## Tipos Disponíveis

- `feedback`: registra um feedback de ligação com dados de venda
- `usuario`: cria usuário de acesso à plataforma
- `funcionario`: cadastra funcionário/vendedor manualmente
- `batch`: processa múltiplos itens em lote

---

## POST — Registrar Feedback de Ligação

### JSON completo

```json
{
  "type": "feedback",
  "data": {
    "lead_id": "LEAD-001",
    "vendedor_id": 1,
    "resumo_ligacao": "Ligação de 5 minutos sobre plano premium...",
    "pontos_fortes": "Boa entonação\nConhecimento do produto\nEmpatia com o cliente",
    "pontos_fracos": "Faltou urgência\nNão ofereceu upgrade",
    "audio_url": "https://exemplo.com/audio/ligacao-123.mp3",
    "status": true,
    "receita": 150.00,
    "operadora": "Claro"
  }
}
```

### Exemplo com curl

```bash
curl -X POST https://miwiumgvnspnmxdmfnut.supabase.co/functions/v1/ingest-data \
  -H "Authorization: Bearer SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "feedback",
    "data": {
      "lead_id": "LEAD-001",
      "vendedor_id": 1,
      "resumo_ligacao": "Cliente interessado no plano 5GB Claro",
      "pontos_fortes": "Boa comunicação\nConhecimento técnico",
      "pontos_fracos": "Demora no fechamento",
      "audio_url": "https://exemplo.com/audio.mp3",
      "status": true,
      "receita": 99.90,
      "operadora": "Claro"
    }
  }'
```

### Resposta de sucesso

```json
{
  "success": true,
  "data": {
    "id": "uuid-gerado",
    "vendedor_id": 1,
    "vendedor_nome": "João da Silva",
    "lead_id": "LEAD-001",
    "resumo": "Cliente interessado no plano 5GB Claro",
    "pontos_bons": "Boa comunicação\nConhecimento técnico",
    "pontos_ruins": "Demora no fechamento",
    "url_audio": "https://exemplo.com/audio.mp3",
    "status": true,
    "receita": 99.90,
    "operadora": "Claro",
    "created_at": "2026-04-08T12:00:00.000Z"
  }
}
```

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| lead_id | String | Não | Identificador do lead |
| vendedor_id | Number | Condicional | ID numérico do vendedor. Obrigatório se `vendedor_nome` não for enviado |
| vendedor_nome | String | Condicional | Nome do vendedor. Se `vendedor_id` não for enviado, cria um novo vendedor automaticamente |
| resumo_ligacao | Text | Não | Resumo da ligação |
| pontos_fortes | Text | Não | Pontos positivos separados por `\n` |
| pontos_fracos | Text | Não | Pontos negativos separados por `\n` |
| audio_url | URL | Não | Link para download do áudio |
| status | Boolean | Não | `true` = Venda, `false` = Não vendeu (padrão: `false`) |
| receita | Number | Não | Valor da venda (forçado a `0` se `status == false`) |
| operadora | String | Não | Nome da operadora vendida (forçado a `null` se `status == false`) |

### Regras de Consistência

- Se `status == false`: `receita` é forçada a `0` e `operadora` é forçada a `null`
- Se `vendedor_id` for informado, deve existir no banco (crie antes com type `funcionario`)
- Se `vendedor_nome` for informado sem `vendedor_id`, um novo vendedor é criado automaticamente
- `created_at` é gerado automaticamente com timestamp exato do registro

---

## POST — Criar Usuário

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

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| email | String | **Sim** | E-mail de acesso |
| password | String | **Sim** | Senha inicial |
| nome_completo | String | **Sim** | Nome completo |
| role | Enum | Não | `developer`, `admin` ou `seller` (padrão: `seller`) |
| email_confirmado | Boolean | Não | Se o e-mail já sai confirmado |

---

## POST — Cadastrar Funcionário (+ Usuário automático)

```json
{
  "type": "funcionario",
  "data": {
    "nome_completo": "João da Silva",
    "email": "joao@empresa.com",
    "password": "SenhaForte123!"
  }
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| nome_completo | String | **Sim** | Nome completo do vendedor |
| email | String | **Sim** | E-mail de acesso à plataforma |
| password | String | **Sim** | Senha inicial de acesso |

> **Nota:** Cria automaticamente o usuário de autenticação com role `seller`, o perfil e o registro de funcionário. O `funcionario_id` é gerado como número sequencial.

---

## POST — Batch (Lote)

```json
{
  "type": "batch",
  "data": {
    "items": [
      { "type": "feedback", "data": { "vendedor_id": 1, "resumo_ligacao": "...", "status": true, "receita": 100, "operadora": "Claro" } },
      { "type": "feedback", "data": { "vendedor_nome": "Novo Vendedor", "resumo_ligacao": "...", "status": false } }
    ]
  }
}
```

---

## Impacto Pós-Registro

Ao registrar um feedback, os seguintes dados são atualizados automaticamente na plataforma:

1. **Listagem de Ligações** — O feedback aparece na tela geral e na página do vendedor
2. **Análise de Desempenho** — Pontos fortes/fracos agregados são recalculados
3. **Alertas Operacionais** — Inatividade (dias sem venda) é atualizada
4. **Métricas Globais** — Receita total, quantidade de feedbacks e média por vendedor
5. **Gráficos** — Vendas por operadora e por período do dia/semana
6. **Ranking** — Posição dos vendedores recalculada
