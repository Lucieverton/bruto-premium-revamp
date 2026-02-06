

## Diagnostico: Notificacoes Nao Chegam Quando Cliente Entra na Fila

### Problemas Identificados

Apos analisar todo o fluxo do sistema de notificacoes, identifiquei **3 problemas criticos** que explicam por que as notificacoes nao funcionam na pratica, mesmo o teste funcionando:

---

### Problema 1 (CRITICO): Hook so funciona na pagina "Meu Perfil"

O `useQueueAlert` esta montado **apenas** na pagina `MeuPerfil.tsx` (linha 81). Quando o barbeiro navega para qualquer outra pagina (Atendimento, Fila, Financeiro), o hook e **desmontado** e para de escutar eventos. Ou seja, a assinatura Realtime simplesmente deixa de existir.

O teste funciona porque o barbeiro esta na pagina "Meu Perfil" quando clica o botao, mas no dia a dia ele estara em "Atendimento" ou outro painel.

### Problema 2 (CRITICO): Filtro Realtime ignora clientes sem barbeiro especifico

O canal Realtime usa o filtro:
```
filter: `barber_id=eq.${barberId}`
```

Porem, quando um cliente escolhe "Qualquer barbeiro disponivel" no formulario, o `barber_id` e inserido como `NULL`. O filtro `barber_id=eq.UUID` **nao captura registros com barber_id NULL**, entao a notificacao nunca e disparada para nenhum barbeiro.

### Problema 3 (MENOR): Dois hooks duplicados causam confusao

Existem dois hooks com funcionalidade identica:
- `useQueueAlert.ts` (com Service Worker - o mais recente)
- `useBarberQueueAlerts.ts` (antigo, sem SW)

O `useBarberQueueAlerts` **nao e usado em nenhum lugar** do projeto, gerando confusao e codigo morto.

---

### Solucao Proposta

#### 1. Mover o hook para o `AdminLayout` (escopo global)

O `useQueueAlert` sera ativado dentro do `AdminLayout.tsx`, que envolve **todas** as paginas do painel admin. Assim, nao importa em qual pagina o barbeiro esteja, a assinatura Realtime permanece ativa.

Para isso, o `AdminLayout` precisara buscar o `barber.id` do usuario logado e passar para o hook.

#### 2. Remover o filtro `barber_id` e escutar TODOS os INSERTs

Em vez de filtrar por `barber_id=eq.${barberId}`, o canal vai escutar **todos** os INSERTs na tabela `queue_items`. Dentro do callback, a logica sera:

- Se `barber_id === meuId` --> Notificar: "Novo cliente NA SUA fila!"
- Se `barber_id === null` --> Notificar: "Novo cliente na fila geral!" (para todos os barbeiros disponiveis)
- Se `barber_id !== meuId` e `!== null` --> Ignorar (e de outro barbeiro)

Isso resolve o cenario em que o cliente nao escolhe barbeiro.

#### 3. Remover o hook duplicado

Deletar `useBarberQueueAlerts.ts` e manter apenas `useQueueAlert.ts` (que usa Service Worker).

#### 4. Remover o hook do MeuPerfil

Como o hook estara no `AdminLayout`, remover a chamada duplicada de `MeuPerfil.tsx`.

---

### Detalhes Tecnicos

**Arquivo: `src/components/admin/AdminLayout.tsx`**
- Adicionar `useQuery` para buscar o perfil do barbeiro logado (mesmo padrao ja usado em `MeuPerfil.tsx` e `Atendimento.tsx`)
- Chamar `useQueueAlert(barber?.id || null)` no nivel do layout
- Isso garante que o hook permanece montado enquanto o barbeiro estiver em qualquer pagina admin

**Arquivo: `src/hooks/useQueueAlert.ts`**
- Remover o filtro `filter: barber_id=eq.${barberId}` da subscription INSERT
- Escutar todos os INSERTs sem filtro
- No callback, verificar:
  - `newItem.barber_id === barberId` --> alerta direto
  - `newItem.barber_id === null` --> alerta geral ("cliente na fila geral")
  - Outro barbeiro --> ignorar
- Manter o filtro de UPDATE para transferencias (ja funciona corretamente)

**Arquivo: `src/pages/admin/MeuPerfil.tsx`**
- Remover a linha `useQueueAlert(barber?.id || null)` (linha 81)
- Remover o import do `useQueueAlert`

**Arquivo: `src/hooks/useBarberQueueAlerts.ts`**
- Deletar o arquivo (codigo morto, nao utilizado)

---

### Resultado Esperado

Apos a implementacao:
- Barbeiro recebe notificacao em **qualquer pagina** do painel admin
- Barbeiro recebe notificacao quando cliente escolhe **ele especificamente**
- Barbeiro recebe notificacao quando cliente escolhe **"qualquer barbeiro"**
- Notificacoes continuam funcionando em segundo plano via Service Worker
- Codigo mais limpo sem duplicacao

