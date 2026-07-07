# Diagnóstico: Acompanhantes não entram na fila

## Causa raiz (bug real no código)

No hook `src/hooks/useQueueGroup.ts`, o array de `service_ids` de cada acompanhante está sendo **serializado duas vezes** antes de chegar no banco:

```ts
const companionsJson = data.companions.map(c => ({
  name: c.name,
  service_ids: JSON.stringify(c.service_ids),  // ← vira string "[uuid,uuid]"
  barber_id: c.barber_id || '',
}));
// ...
p_companions: JSON.stringify(companionsJson),  // ← stringifica de novo
```

No banco, a RPC `join_queue_group` faz:

```sql
FOR v_companion IN SELECT * FROM jsonb_to_recordset(p_companions) 
  AS x(name text, service_ids jsonb, barber_id text)
-- ...
SELECT ARRAY(SELECT jsonb_array_elements_text(v_companion.service_ids)::uuid)
```

Como `service_ids` chega como **string JSON escalar** (não array), o `jsonb_array_elements_text` lança erro `"cannot extract elements from a scalar"`. Isso derruba a transação inteira — nem o cliente principal nem o acompanhante são inseridos, ou (em alguns cenários) o toast de sucesso aparece antes do erro da mutação ser tratado corretamente, deixando a sensação de "adicionou mas não entrou".

O `p_companions` externo também deve ser passado como objeto JS puro (o supabase-js já serializa), não como string dupla.

## Correção

### `src/hooks/useQueueGroup.ts`
- Remover o `JSON.stringify(c.service_ids)` — passar o array direto.
- Remover o `JSON.stringify(companionsJson)` externo — passar o array de objetos como parâmetro nativo. O supabase-js converte para JSONB automaticamente e a RPC recebe estruturas corretas.

Depois disso:
- Líder e acompanhantes entram na mesma transação.
- A trigger `generate_ticket_number` numera sequencialmente (ex.: líder `A-005`, acompanhante `A-006`).
- Como `created_at` do líder é anterior ao dos acompanhantes por microssegundos, a ordenação da fila (`ORDER BY priority, created_at ASC`) mantém pai → filho, filho seguido, exatamente como pedido.

### Verificação extra (sem mudar lógica)
- Confirmar visualmente na `Fila Virtual` que após enviar o formulário aparecem N tickets consecutivos com o mesmo `group_id`.
- O toast já mostra os números de tickets gerados; se agora aparecerem múltiplos, o fluxo está correto.

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useQueueGroup.ts` | Parar de duplo-serializar `service_ids` e `companions`; passar arrays/objetos JS nativos para a RPC |

Nenhuma mudança de schema, RPC ou UI é necessária — o backend já suporta grupos corretamente; o bug está apenas na serialização do payload no cliente.
