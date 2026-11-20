# Destravar o DG e evitar barbeiro preso em "Em atendimento"

## O que aconteceu (confirmado nos dados)
- Ontem às 19h54 o DG iniciou o atendimento do ticket A-021 e não finalizou.
- Hoje às 8h46 a limpeza automática do dia cancelou esse ticket, mas **não devolveu o status do DG**.
- Por isso ele continua marcado como "Em atendimento" sem nenhum cliente. O painel bloqueia a disponibilidade ("Finalize o atendimento atual"), mas não há nada para finalizar: ele fica preso e não consegue sair da fila.
- Gustavo e Pedro estão normais. Não há clientes ativos na fila agora.

## Correções
1. **Destravar o DG agora**: voltar o status dele para "Offline" (ou o que estava antes), sem mexer em atendimentos.
2. **Limpeza automática corrigida**: quando um ticket em atendimento for cancelado (virada do dia, exclusão, cancelamento pelo dono), o barbeiro volta ao status anterior.
3. **Proteção extra**: se um barbeiro estiver "Em atendimento" sem nenhum cliente ativo, o painel dele mostra o botão "Encerrar atendimento travado" em vez de bloquear tudo.
4. **Painel do dono**: em Barbeiros, aviso "status travado" e botão para forçar Disponível/Pausa/Offline (já existe a função, vou garantir que funciona também quando ele está "ocupado").
5. **Cancelamento pelo barbeiro**: se o cliente desistir durante o atendimento, o barbeiro pode marcar "Cliente desistiu" e volta ao status anterior.

## Detalhes técnicos
- Migração: trigger AFTER UPDATE em `queue_items` — quando status sai de `in_progress`/`called` para `cancelled`/`no_show` e o barbeiro não tem outro ticket ativo, `barbers.status = coalesce(status_before_service,'offline')`, `is_available` coerente, `status_before_service = null`.
- `barber_set_availability` e `admin_force_barber_status`: permitir sair de `busy` quando não houver ticket `called/in_progress` do barbeiro.
- Correção pontual de dados do DG (status `offline`, `status_before_service` null).
- UI: `BarberAvailabilityControl.tsx` detecta busy sem ticket ativo; `Barbeiros.tsx` mostra aviso e ação.
