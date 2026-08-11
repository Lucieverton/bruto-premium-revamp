# Correção dos cálculos financeiros e evolução diária

## O que está acontecendo (verificado no banco)

Nada foi perdido: os atendimentos continuam sendo gravados normalmente (11/08 tem 9 atendimentos, 10/08 tem 17, e assim por diante).

O problema é de **leitura**: o backend devolve no máximo 1000 registros por consulta, e o ano de 2026 já tem **3.024 atendimentos**. Como as telas pedem "o ano inteiro" de uma vez e ordenam do mais antigo para o mais novo, elas recebem só os 1000 primeiros — ou seja, **tudo depois de 04/04/2026 simplesmente some dos gráficos e dos totais**.

Isso afeta:
- Gráfico de evolução do dashboard (dia / semana / mês / ano)
- Card "Meus Ganhos" do barbeiro (os dois barbeiros já passaram de 1000 atendimentos no ano: 1.936 e 1.088)
- Gráfico anual do admin e a página Financeiro em períodos longos

Por isso a sensação de que "os dados pararam de ser computados" e a evolução diária não aparece.

## O que vai ser feito

1. **Agregar no banco, não no navegador.** Criar funções que devolvem os totais já somados por hora, por dia, por mês e por barbeiro. Assim nenhuma tela precisa baixar milhares de linhas, e o limite de 1000 deixa de existir na prática. Os cálculos de comissão passam a usar o mesmo critério em todos os lugares.

2. **Corrigir os totais das telas existentes** (dashboard financeiro, gráfico de evolução, card de ganhos do barbeiro) para consumir essas agregações — os números do ano voltam a bater com a realidade.

3. **Evolução diária para o barbeiro.** Na página "Meu Financeiro", além do extrato do dia, incluir:
   - gráfico dos últimos 30 dias (faturamento, comissão e nº de cortes por dia)
   - resumo do mês atual e comparação com o mês anterior
   - totais de cortes/comissão por dia, para o barbeiro conferir o próprio histórico

4. **Extrato e listagem por período com paginação**, para que listas longas (mês/ano) não sejam cortadas silenciosamente.

5. **Fuso horário consistente.** Fechar o dia sempre pelo horário de Fortaleza (UTC-3), evitando que atendimentos do fim da noite caiam no dia seguinte.

6. **Estados de carregamento e "sem dados"** claros, para nunca mais um período vazio parecer "dados perdidos".

## Detalhes técnicos

- Novas funções no banco (SQL, `SECURITY DEFINER`, `search_path = public`):
  - `get_financial_series(p_start, p_end, p_bucket text /* hour|day|month */, p_barber_id uuid default null)` → série já agregada com `revenue`, `commission`, `shop_profit`, `attendances`.
  - `get_financial_by_barber(p_start, p_end)` → totais por barbeiro no período.
  - Comissão calculada no SQL via `barbers.commission_percentage` (fallback 50).
  - Autorização: barbeiro só enxerga a própria série; admin enxerga tudo (`has_role`).
  - `GRANT EXECUTE ... TO authenticated`.
- `src/hooks/useBarberEarnings.ts`: `useEvolutionChartData`, `useAllBarbersAnnualData` e `useBarberEarnings` passam a chamar as RPCs agregadas (remove o `select('*')` do ano inteiro).
- `src/hooks/useFinancial.ts`: métricas por barbeiro vindas de `get_financial_by_barber`; listagem detalhada paginada por `.range()`.
- `src/pages/admin/MeuFinanceiro.tsx`: novo bloco de evolução (30 dias + mês atual vs anterior) reusando `get_financial_series` com `p_bucket = 'day'`.
- Buckets do dia gerados por `generate_series` no SQL, para dias sem atendimento aparecerem como zero em vez de sumirem.
