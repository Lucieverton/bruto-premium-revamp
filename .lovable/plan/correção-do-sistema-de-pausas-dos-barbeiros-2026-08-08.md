# Correção do sistema de pausas dos barbeiros

## O problema (causa confirmada)

Ao clicar em "Confirmar pausa" o banco recusa a gravação: a regra de validação da coluna de status da tabela de barbeiros ainda só aceita `online`, `away`, `offline` e `busy` — o novo estado `paused` não foi incluído quando a funcionalidade foi criada. Por isso aparece o erro `barbers_status_check`.

Consequência em cadeia: como nenhuma pausa consegue ser gravada, o histórico de pausas fica vazio, o dono não vê nada no painel e a fila nunca mostra "Em pausa".

## O que será feito

### 1. Liberar o estado "Em pausa" no banco
- Atualizar a regra de validação de status para aceitar: `online`, `busy`, `paused`, `offline` (mantendo `away` como sinônimo legado convertido para `paused`).
- Converter registros antigos com `away` para `paused`.

### 2. Tempo real de verdade
- Ativar o tempo real na tabela de histórico de pausas, para que o painel do dono atualize sozinho quando um barbeiro pausa ou volta.
- Assinar essa atualização nas telas de Barbeiros e Meu Perfil (hoje o histórico só carrega ao abrir a página).

### 3. Entrada e saída de pausa sem falhas
- Barbeiro: botão "Voltar ao atendimento" sempre visível quando está pausado/offline, com confirmação e feedback claro de erro.
- Bloqueio correto quando está atendendo: mensagem explicando que precisa finalizar o cliente antes de pausar.
- Ao voltar, os campos de motivo/previsão são limpos e a pausa aberta é encerrada com a duração calculada.

### 4. Estouro de pausa (visão do dono)
- Marcar como "estourada" toda pausa que passou da previsão de retorno ou que ultrapassou 30 min sem previsão.
- No painel de Barbeiros: destaque vermelho no barbeiro em estouro, com "atrasado há X min".
- No histórico de pausas: coluna/etiqueta de estouro, total de pausas do dia, tempo total pausado por barbeiro e quantas estouraram.
- Botão do dono para forçar retorno continua registrando em auditoria.

### 5. Fila e visualização pública
- Barbeiro pausado aparece como "Em pausa" (com motivo e previsão, quando houver) e não recebe novos clientes.
- Revisão dos cartões da fila para não deixar barbeiro sumir da lista ao mudar de estado.

## Detalhes técnicos

- Migração: `ALTER TABLE public.barbers DROP CONSTRAINT barbers_status_check` e recriar com `('online','busy','paused','offline')`; `UPDATE` dos registros `away`; `ALTER PUBLICATION supabase_realtime ADD TABLE public.barber_breaks`.
- `barber_set_availability` já grava/encerra `barber_breaks` corretamente — sem mudança de lógica, apenas passa a funcionar após a constraint.
- `get_barber_breaks` passa a retornar `is_overrun` e `duration_minutes` calculados no banco.
- Frontend: `useBarberAvailability` (realtime + invalidação), `BarberStatusBadge`, `BarberBreaksHistory` (resumo + estouros), `BarberAvailabilityControl` (voltar ao atendimento e mensagens de erro).
