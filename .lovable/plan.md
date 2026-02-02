
# Plano de Correção: Fila Virtual - WhatsApp e Entrada na Fila

## Problemas Identificados

### 1. Tickets Antigos Bloqueando Novos Clientes
Um ticket do dia **24/01/2026** (Lucieverton, A-016) ainda está com status `in_progress` no dia **02/02/2026**. A função `join_queue` não considera a data - se alguém usar o mesmo telefone, recebe o erro "Você já está na fila".

**Causa Raiz**: A fila deveria zerar diariamente, mas tickets antigos ficam pendentes bloqueando novas entradas.

### 2. Botão WhatsApp Não Aparece na "Fila Atual"
A lógica atual está correta (`isMe && barber_whatsapp`), porém:
- O `localStorage` do cliente pode não ter o ticket salvo (race condition já corrigida anteriormente)
- A lista "Fila Atual" filtra apenas tickets com status `waiting` - se o cliente foi chamado ou está em atendimento, o botão desaparece

**Causa Raiz**: O botão só aparece para tickets com status `waiting`, mas desaparece assim que o status muda para `called` ou `in_progress`.

### 3. Sincronização da Página com localStorage
Quando o cliente entra na fila, o `handleJoinSuccess` em `Fila.tsx` lê o ticket do `localStorage` imediatamente. Se houver qualquer delay, o `myTicketId` não é atualizado e o cliente não vê "(você)" nem o botão WhatsApp.

---

## Soluções Propostas

### Solução 1: Atualizar RPC `join_queue` para Filtrar por Data
Modificar a verificação de ticket ativo para considerar apenas tickets do **dia atual**:

```sql
-- Verificar APENAS tickets do dia de hoje
SELECT COUNT(*) INTO v_active_ticket
FROM queue_items
WHERE customer_phone = v_phone_normalized
AND status IN ('waiting', 'called', 'in_progress')
AND created_at::date = CURRENT_DATE;  -- <- Adicionar este filtro
```

### Solução 2: Criar RPC para Limpar Tickets Antigos
Adicionar uma função que pode ser chamada pelo admin para finalizar tickets pendentes de dias anteriores:

```sql
CREATE FUNCTION cleanup_stale_tickets() 
RETURNS integer AS $$
DECLARE v_count integer;
BEGIN
  UPDATE queue_items
  SET status = 'cancelled', completed_at = now()
  WHERE status IN ('waiting', 'called', 'in_progress')
  AND created_at::date < CURRENT_DATE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Solução 3: Corrigir Sincronização do Estado no Frontend
Atualizar `Fila.tsx` para garantir que o `myTicketId` seja atualizado **imediatamente** após entrar na fila, sem depender de `localStorage`:

```typescript
// Fila.tsx - Modificar handleJoinSuccess
const handleJoinSuccess = () => {
  // Pequeno delay para garantir que localStorage foi salvo
  setTimeout(() => {
    const savedTicket = getMyTicket();
    setMyTicketId(savedTicket);
  }, 100);
};
```

### Solução 4: Expandir Visibilidade do Botão WhatsApp
Como o cliente quer ver o botão enquanto está na "Fila Atual", e a lista filtra apenas `waiting`, precisamos garantir que:

1. O botão apareça no `MyTicketCard` também (já está visível lá quando implementado)
2. A lista "Fila Atual" continue mostrando apenas quem está aguardando
3. O cliente pode ver seu botão WhatsApp **no seu card pessoal** mesmo após ser chamado

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/` | Nova migration para atualizar `join_queue` RPC |
| `src/pages/Fila.tsx` | Corrigir sincronização do `handleJoinSuccess` |
| `src/components/queue/MyTicketCard.tsx` | Adicionar botão WhatsApp para contato com barbeiro |
| `src/hooks/useQueue.ts` | Adicionar interface `barber_whatsapp` ao `PublicQueueItem` (já existe) |

---

## Detalhes Técnicos

### Migration SQL Completa

```sql
-- 1. Atualizar join_queue para filtrar por data
CREATE OR REPLACE FUNCTION public.join_queue(...)
  -- Dentro da função, modificar:
  -- CHECK IF CUSTOMER ALREADY HAS AN ACTIVE TICKET TODAY
  SELECT COUNT(*) INTO v_active_ticket
  FROM queue_items
  WHERE customer_phone = v_phone_normalized
  AND status IN ('waiting', 'called', 'in_progress')
  AND created_at::date = CURRENT_DATE;  -- Apenas hoje
...

-- 2. Criar função de limpeza para admin
CREATE FUNCTION public.cleanup_stale_tickets()...

-- 3. Cancelar tickets antigos existentes
UPDATE queue_items
SET status = 'cancelled', completed_at = now()
WHERE status IN ('waiting', 'called', 'in_progress')
AND created_at::date < CURRENT_DATE;
```

### Modificação no MyTicketCard
Adicionar um botão WhatsApp no card pessoal do cliente, que funciona independentemente de onde ele está na fila:

```tsx
// MyTicketCard.tsx - Adicionar após informações do ticket
{ticket.barber_name && ticket.barber_whatsapp && (
  <Button onClick={handleWhatsAppClick}>
    <MessageCircle /> Falar com {ticket.barber_name}
  </Button>
)}
```

---

## Ordem de Implementação

1. **Primeiro**: Migration SQL para corrigir a lógica da RPC e cancelar tickets antigos
2. **Segundo**: Atualizar `Fila.tsx` para melhor sincronização
3. **Terceiro**: Adicionar botão WhatsApp no `MyTicketCard.tsx`
4. **Quarto**: Testar end-to-end entrando na fila e verificando visibilidade do botão

---

## Resultado Esperado

Após as correções:
- Clientes não serão bloqueados por tickets de dias anteriores
- O botão WhatsApp aparecerá no card pessoal do cliente (MyTicketCard)
- O botão WhatsApp continuará aparecendo na lista "Fila Atual" para tickets com status `waiting`
- A experiência será consistente em dispositivos móveis e desktop
