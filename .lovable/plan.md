# Plano: Impedir que acompanhantes sejam ignorados silenciosamente

## Diagnóstico

No teste do usuário, apenas 1 ticket foi criado no banco (A-019 "TESTE", `group_id = NULL`). Isso significa que o formulário chamou `join_queue` (entrada única) em vez de `join_queue_group`.

Causa raiz em `src/components/queue/BarberQueueForm.tsx` (linha 61):

```ts
const validCompanions = companions.filter(
  c => c.name.trim().length >= 2 && c.service_ids.length > 0
);

if (hasCompanions && validCompanions.length > 0) { /* group */ }
else { /* single */ }
```

O painel de "Serviços" em cada acompanhante (`CompanionEntry`) começa **fechado** (`showServices = false`). Se o usuário digita o nome mas não expande e seleciona serviços, o filtro descarta o acompanhante **em silêncio** e o formulário cai no fluxo de entrada única — por isso somente o líder aparece na fila, sem `group_id`, sem acompanhantes.

## Correções

### 1. `src/components/queue/BarberQueueForm.tsx` — validar antes de enviar
No `onSubmit`, quando `hasCompanions` estiver ligado:
- Detectar acompanhantes incompletos (nome curto OU sem serviço).
- Se houver algum incompleto, **bloquear o envio** e exibir toast de erro claro: "Complete os dados do acompanhante N: nome e ao menos um serviço."
- Só chamar `joinQueueGroup` com a lista completa (nunca cair no fluxo single quando o toggle "Vai com acompanhante?" estiver ativo).

### 2. `src/components/queue/CompanionEntry.tsx` — deixar a seleção de serviços óbvia
- Iniciar `showServices = true` para o painel já aparecer aberto.
- Rotular o botão como **"Serviços *"** (com asterisco) e destacar em vermelho quando `service_ids.length === 0` para sinalizar que é obrigatório.
- Mostrar mensagem inline "Selecione ao menos um serviço" quando vazio.

### 3. Verificação
Após aplicar, refazer o teste (líder + 2 acompanhantes) e confirmar via banco que os 3 tickets existem com o mesmo `group_id` e `companion_name` preenchido nos acompanhantes.

## Arquivos

| Arquivo | Mudança |
|---|---|
| `src/components/queue/BarberQueueForm.tsx` | Validar acompanhantes; toast de erro; forçar `joinQueueGroup` quando toggle ativo |
| `src/components/queue/CompanionEntry.tsx` | Painel de serviços aberto por padrão + destaque de obrigatoriedade |
