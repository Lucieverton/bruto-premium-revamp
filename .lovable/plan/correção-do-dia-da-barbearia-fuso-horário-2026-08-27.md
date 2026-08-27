# Correção do "dia" da barbearia (fuso horário)

## O que aconteceu

Nenhum dado foi perdido. Os atendimentos de hoje (26/08) estão todos salvos no banco: 17 atendimentos, R$ 585,00, o último às 18:07 (horário local), dos dois barbeiros.

O problema é de fuso horário. O sistema conta o "dia" pelo relógio UTC, que está 3 horas à frente de Fortaleza. Às 21:00 do horário local o banco já entende que é o dia seguinte, então:

- A lista de "finalizados de hoje" fica vazia depois das 21h.
- A fila pública e as estatísticas param de mostrar os clientes do dia.
- Pior: o gatilho de limpeza automática entende que os tickets ainda em espera são "de ontem" e pode cancelá-los sozinho às 21h.

## Correção

Trocar todas as comparações de "hoje" para o fuso America/Fortaleza (UTC-3), no banco e no app.

### Banco de dados (migração)

Substituir `CURRENT_DATE` / `created_at::date` por data local em todas as funções que delimitam o dia:

- `get_public_queue`, `get_active_services_public`, `get_queue_position`, `get_queue_stats`, `get_barber_queue`
- `join_queue`, `join_queue_group`, `add_walkin_client`, `barber_add_client_direct` (limites diários de entrada)
- `generate_ticket_number` (numeração diária dos tickets)
- `cleanup_stale_tickets` e `trigger_cleanup_stale_tickets` (só cancelar tickets de dias anteriores segundo o dia local)

Padrão usado: `(qi.created_at AT TIME ZONE 'America/Fortaleza')::date = (now() AT TIME ZONE 'America/Fortaleza')::date`.

### App

- `src/hooks/useQueue.ts` (`useTodayQueue`): hoje monta a data com `toISOString()` (UTC). Passa a montar o início/fim do dia pelo horário local de Fortaleza.
- Conferir os intervalos de "Hoje" em `useFinancial.ts`, `useBarberEarnings.ts` e `Financeiro.tsx`: já usam horário local do navegador, então continuam corretos; apenas alinhar para o mesmo helper de dia local, evitando divergência quando o celular estiver com outro fuso.

### Verificação

Depois da migração, conferir com consulta direta que a fila e os atendimentos de hoje aparecem normalmente mesmo após as 21h, e que nenhum ticket em espera é cancelado nesse horário.
