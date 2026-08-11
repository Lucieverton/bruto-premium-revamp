# Dashboard financeiro: mostrar todos os barbeiros, com foto

## O que está acontecendo

Existem 2 barbeiros cadastrados no banco: **DG** (ativo) e **Paulo Cassiano** (marcado como inativo). Paulo tem 75 atendimentos no mês atual e 1.088 no total — ou seja, os dados existem.

O painel Financeiro busca a lista de barbeiros filtrando apenas os ativos. Como Paulo está inativo:

- Ele não aparece no seletor "Por barbeiro" (só DG aparece).
- No gráfico "Por Barbeiro" e na tabela "Comissões por Barbeiro" ele aparece sem nome, como "Desc.", em vez de "Paulo Cassiano".

O cálculo financeiro em si está correto: os totais já incluem os atendimentos dele.

## O que será feito

1. **Incluir barbeiros inativos no financeiro**
   - O seletor "Por barbeiro" passa a listar todos os barbeiros cadastrados, com uma marcação "Inativo" ao lado de quem não está mais ativo.
   - O nome usado nos gráficos e na tabela passa a vir da própria consulta financeira (que já devolve o nome), eliminando o "Desc.".

2. **Cards por barbeiro com foto**
   - A tabela "Comissões por Barbeiro" vira uma lista de cartões (um por barbeiro), cada um com a foto/avatar à esquerda e, ao lado: nome, marcação de inativo quando for o caso, percentual de comissão, atendimentos, faturamento, comissão e lucro da barbearia.
   - Layout em coluna única no celular (prioridade mobile), sem cortar nomes, e uma linha de TOTAL no final.
   - Barbeiros sem atendimento no período aparecem com valores zerados em vez de sumirem, para o dono saber que existem.

3. **Foto também no gráfico e na distribuição**
   - Miniaturas dos avatares abaixo do gráfico "Por Barbeiro" (em legenda), já que o gráfico de barras não comporta imagens no eixo.

## Detalhes técnicos

- `src/hooks/useAdminBarbers.ts`: novo hook `useAllBarbers` (sem filtro `is_active`), retornando também `avatar_url` e `is_active`. O hook atual continua para os fluxos de fila.
- `src/pages/admin/Financeiro.tsx`: usar `useAllBarbers` no seletor e nos lookups; usar `barber_name` vindo de `get_financial_by_barber` como fonte primária do nome; substituir a `<table>` de comissões por um novo componente de cartões.
- Novo `src/components/admin/BarberFinanceCard.tsx`: cartão com `Avatar` (shadcn) + métricas, usando tokens do design system (sem cores hardcoded).
- Sem mudanças de banco de dados — a RPC `get_financial_by_barber` já retorna todos os barbeiros com nome e comissão.
