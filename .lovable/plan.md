

## Diagnostico e Correcao: Erro na Fila + Push para Tela Bloqueada

### Problema Principal (CRITICO): Fila Quebrada

O erro ao entrar na fila e causado pelos **triggers de banco de dados** criados na ultima migracao. Esses triggers usam `net.http_post()` da extensao `pg_net`, que **nao esta habilitada** no projeto. O log do banco confirma:

```
ERROR: schema "net" does not exist
```

Quando um cliente tenta entrar na fila, o `INSERT` na tabela `queue_items` dispara o trigger `on_queue_item_insert_push`, que tenta executar `net.http_post()` e **falha**, cancelando a insercao inteira. Resultado: o cliente ve "Erro ao entrar na fila".

O mesmo problema afeta transferencias pelo trigger `on_queue_item_transfer_push`.

### Problema Secundario: Push Nao Funciona com Tela Bloqueada

O sistema atual de notificacao com tela bloqueada depende desses triggers (que estao quebrados) para chamar a edge function `send-push`. Mesmo se os triggers funcionassem, a abordagem de usar `pg_net` diretamente do banco nao e compativel com Lovable Cloud.

### Solucao

A estrategia e **remover os triggers quebrados** e mover a chamada de push para o **frontend**, disparando a edge function apos operacoes bem-sucedidas.

---

### Passo 1: Migracao SQL - Remover triggers quebrados

Remover os dois triggers e suas funcoes que usam `net.http_post`:

- `DROP TRIGGER on_queue_item_insert_push ON public.queue_items`
- `DROP TRIGGER on_queue_item_transfer_push ON public.queue_items`
- `DROP FUNCTION public.notify_barbers_push()`
- `DROP FUNCTION public.notify_barber_transfer_push()`

Isso resolve o erro na fila imediatamente.

### Passo 2: Criar helper para chamar a edge function do frontend

Criar uma funcao utilitaria `sendPushNotification()` em `src/lib/pushNotify.ts` que faz POST para a edge function `send-push` com os dados do cliente:

```
POST /functions/v1/send-push
Body: { type, customer_name, barber_id, ticket_number }
```

Esta chamada sera feita de forma **nao-bloqueante** (fire-and-forget via `.catch()`), para que falhas de push nunca afetem a operacao principal da fila.

### Passo 3: Integrar push no fluxo de entrada na fila

Modificar `src/hooks/useQueue.ts` (no `onSuccess` do `useJoinQueue`) para chamar `sendPushNotification()` apos o cliente entrar com sucesso.

### Passo 4: Integrar push no fluxo de transferencia

Modificar `src/hooks/useQueueTransfers.ts` (no `onSuccess` do `useTransferClient`) para chamar `sendPushNotification()` com tipo `transfer`.

### Passo 5: Integrar push na entrada direta do barbeiro

Modificar `src/hooks/useBarberDirectEntry.ts` (no `onSuccess` do `useBarberDirectEntry`) para tambem disparar push.

### Passo 6: Configurar JWT da edge function

Atualizar `supabase/config.toml` para que `send-push` aceite chamadas sem JWT (ja que clientes nao autenticados tambem entram na fila):

```
[functions.send-push]
verify_jwt = false
```

---

### Detalhes Tecnicos

**Novo arquivo: `src/lib/pushNotify.ts`**

```typescript
export const sendPushNotification = async (data: {
  type: 'new_client' | 'transfer';
  customer_name: string;
  barber_id?: string | null;
  ticket_number: string;
}) => {
  try {
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
  } catch (err) {
    console.warn('[Push] Failed to send:', err);
  }
};
```

**Modificacoes em `src/hooks/useQueue.ts`** (onSuccess do useJoinQueue):
- Adicionar chamada `sendPushNotification({ type: 'new_client', ... })` fire-and-forget

**Modificacoes em `src/hooks/useQueueTransfers.ts`** (onSuccess do useTransferClient):
- Adicionar chamada `sendPushNotification({ type: 'transfer', ... })` fire-and-forget

**Modificacoes em `src/hooks/useBarberDirectEntry.ts`** (onSuccess do useBarberDirectEntry):
- Adicionar chamada `sendPushNotification({ type: 'new_client', ... })` fire-and-forget

**Modificacoes em `supabase/config.toml`**:
- Adicionar secao `[functions.send-push]` com `verify_jwt = false`

---

### Resultado Esperado

1. **Fila volta a funcionar** - sem triggers bloqueantes, o INSERT completa normalmente
2. **Push continua funcionando** - a edge function e chamada do frontend apos sucesso
3. **Tela bloqueada** - o Web Push (VAPID) ja implementado continua acordando o Service Worker
4. **Sem risco** - falhas de push nunca impedem a operacao da fila (fire-and-forget)

