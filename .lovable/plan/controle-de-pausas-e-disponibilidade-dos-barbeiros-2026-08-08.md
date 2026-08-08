# Controle de Pausas e Disponibilidade dos Barbeiros

## Problema confirmado

O barbeiro fica online sozinho porque hoje existem dois pontos que ligam o status automaticamente:

1. **Login / refresh de sessão** — `src/hooks/useAuth.ts` chama `update_barber_status_on_auth(user_id, 'online')` toda vez que o papel do usuário é verificado (login, reabrir o app, renovação de token). Isso grava `status = 'online'` e `is_available = true`, apagando a pausa que o barbeiro tinha configurado.
2. **Fim de atendimento** — a função `barber_complete_service` termina com `UPDATE barbers SET status = 'online', is_available = true`. Ou seja, ao finalizar um cliente o barbeiro volta a ficar disponível mesmo se tinha pedido pausa.

Além disso, hoje só existe o par online/offline: não há um estado real de "pausa" com motivo, nem histórico para o dono acompanhar.

## O que será feito

### 1. Fim da ativação automática
- Remover a chamada de "ficar online no login" do `useAuth`. O status passa a mudar **somente** quando o barbeiro (ou o admin) mexe no painel.
- Alterar `barber_complete_service`: ao finalizar um atendimento, o barbeiro volta ao **estado anterior** que ele mesmo escolheu — se estava em pausa ou offline, continua assim; só volta a online se estava online antes de iniciar o atendimento.
- Alterar `barber_start_service`: guardar o estado escolhido pelo barbeiro antes de marcar como "atendendo", para poder restaurá-lo depois.

### 2. Estado de pausa de verdade
- Novo estado `paused` (Em pausa) além de online / atendendo / offline.
- Ao entrar em pausa o barbeiro informa:
  - **Motivo** (Almoço, Lanche, Pessoal, Fora da barbearia, Outro — com texto livre),
  - **Previsão de retorno** (15 / 30 / 60 min ou "sem previsão") — apenas informativa, **nunca** reativa o barbeiro sozinho.
- A pausa só termina quando o próprio barbeiro clica em "Voltar ao atendimento" (ou o admin força).
- Enquanto pausado: o barbeiro não recebe novas entradas na fila e aparece como "Em pausa — Almoço · volta ~14:30" para os clientes.

### 3. Painel do barbeiro (Meu Perfil)
- Substituir o switch atual por um controle de 3 estados: **Disponível / Em pausa / Encerrar expediente**.
- Card de status mostrando desde quando está naquele estado e o motivo.
- Botão grande "Voltar ao atendimento" quando estiver em pausa.
- Aviso claro de que ninguém, nem o sistema, vai reativá-lo automaticamente.

### 4. Painel do dono (Admin)
- Na tela de Barbeiros: coluna/badge com estado atual, motivo da pausa, previsão de retorno e **há quanto tempo** está nesse estado (ex.: "Em pausa há 47 min — Almoço").
- Destaque visual para pausas longas (acima de 60 min sem retorno).
- Nova seção "Histórico de pausas e ausências" com filtro por dia/barbeiro: horário de início, fim, duração e motivo — para o dono saber o que cada barbeiro fez no dia.
- O admin pode forçar o retorno de um barbeiro (com registro de quem fez isso).

## Detalhes técnicos

**Banco de dados**
- `barbers`: novas colunas `pause_reason text`, `pause_note text`, `pause_expected_return timestamptz`, `status_changed_at timestamptz`, `status_before_service text`.
- Nova tabela `barber_breaks` (barber_id, reason, note, started_at, ended_at, ended_by, expected_return) com GRANTs, RLS: barbeiro lê/insere as próprias; admin lê todas.
- Novas RPCs `SECURITY DEFINER` com `SET search_path = public`:
  - `barber_set_availability(p_barber_id, p_state, p_reason, p_note, p_expected_return)` — único caminho para mudar status; valida que é o próprio barbeiro ou admin; abre/fecha registro em `barber_breaks`.
  - `admin_force_barber_status(p_barber_id, p_state)` — só admin, registra quem forçou.
- Ajustar `barber_start_service` (salvar `status_before_service`) e `barber_complete_service` (restaurar em vez de forçar `online`).
- `get_public_barbers` e `get_public_queue` passam a expor `paused`, motivo e previsão de retorno (sem dados sensíveis).

**Frontend**
- `useAuth.ts`: remover `updateBarberStatus(... 'online')`.
- `useBarberQueue.ts`: `useUpdateBarberStatus` passa a usar a nova RPC com os estados `available | paused | offline`.
- Novo componente `BarberAvailabilityControl` usado em `MeuPerfil.tsx`.
- Mapeamento de status atualizado nos cards públicos (`BarberCard`, `BarberStatusCards`, `BarbersPanel`, `BarberSelectionGrid`, `BarberQueueCard`) para exibir "Em pausa".
- Admin: `Barbeiros.tsx` com badges de estado + tempo, e nova aba de histórico de pausas.
- Tudo em layout mobile-first, dialogs usando AlertDialog, paleta Chrome Automotive.
