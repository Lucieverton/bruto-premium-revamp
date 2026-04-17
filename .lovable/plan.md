

# Diagnóstico: Fila com contagem errada e barbeiros sumindo

## Problemas identificados

### Problema 1: Posição da fila errada (cliente diz que é o 6º quando há só 2)
**Causa raiz:** Existem **tickets antigos** com status `waiting`/`called`/`in_progress` de dias passados (2026-02-02, 2026-02-14, 2026-02-17) que nunca foram limpos. Verificado no banco: 7 tickets ativos, mas só 2 são de hoje.

A função `get_queue_position` (RPC que calcula a posição) **não filtra por data** — conta TODOS os tickets `waiting` no banco, incluindo os antigos. Por isso o cliente de hoje aparece como #6.

A função `cleanup_stale_tickets()` existe no banco mas **nunca é chamada automaticamente** (sem trigger, sem agendamento).

### Problema 2: Barbeiros sumindo da lista pública
**Causa raiz:** A página `/fila` (Fila.tsx) **não monta os hooks de realtime** (`useBarbersRealtime`, `useQueueRealtime`). Depende apenas de polling (`refetchInterval: 5000` + `staleTime: 0`).

Combinado com `staleTime: 0`, qualquer refetch dispara um estado de "loading" que renderiza o skeleton de barbeiros — daí o "sumiço" momentâneo. Quando o polling falha por rede instável (mobile), os barbeiros podem ficar invisíveis por mais tempo.

## Correções

### 1. Filtrar `get_queue_position` por data atual (SQL)
Adicionar `AND qi2.created_at::date = CURRENT_DATE` na contagem de posição e no `total_waiting`. Isso resolve imediatamente o problema da posição errada.

### 2. Limpar tickets antigos do banco (SQL)
Executar `cleanup_stale_tickets()` uma vez para cancelar todos os tickets de dias anteriores que ainda estão como `waiting`/`called`/`in_progress`.

### 3. Auto-limpeza diária via trigger (SQL)
Criar um trigger leve que chama `cleanup_stale_tickets()` antes de inserir um novo ticket — garante que a fila do dia sempre comece limpa, sem depender de cron job externo.

### 4. Corrigir "sumiço" dos barbeiros na página pública
- Em `src/pages/Fila.tsx`: adicionar `useBarbersRealtime()` e `useQueueRealtime()` para sincronização instantânea.
- Em `src/hooks/useQueue.ts` (`usePublicBarbers`): manter dados anteriores enquanto refetch acontece (`placeholderData: keepPreviousData`) para eliminar o flash de skeleton.

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Filtrar `get_queue_position` por `CURRENT_DATE`; rodar `cleanup_stale_tickets()`; criar trigger auto-limpeza em `queue_items` |
| `src/pages/Fila.tsx` | Adicionar `useBarbersRealtime()` e `useQueueRealtime()` |
| `src/hooks/useQueue.ts` | `usePublicBarbers`: usar `placeholderData: keepPreviousData` para evitar flash |

