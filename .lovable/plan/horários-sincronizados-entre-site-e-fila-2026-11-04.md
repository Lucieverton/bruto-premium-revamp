# Horários sincronizados entre site e fila

## O problema encontrado
- Página inicial ("Entre em contato"): horário escrito fixo no site — "Segunda a Sábado, 8h às 19h; 1º e 2º domingo, 9h às 12h".
- Fila virtual: mostra o horário salvo em Configurações — hoje **08:00 – 21:00**.
- São duas fontes diferentes, por isso as informações não batem.

## O que será feito
1. **Um único lugar para o horário**: nova aba "Horário de funcionamento" em Meu site, com a semana completa:
   - Cada dia (Seg a Dom) com: aberto/fechado, abre às, fecha às.
   - Domingo com opção "apenas 1º e 2º domingo do mês".
   - Já vem preenchido com o horário atual do site (Seg–Sáb 8h–19h, domingos 9h–12h).
2. **Página inicial** passa a ler esse horário salvo e montar o texto automaticamente (ex.: "Segunda a Sábado, das 8h às 19h").
3. **Fila virtual** (cabeçalho, painel de entrada, formulário do barbeiro) mostra o horário **do dia de hoje** vindo da mesma fonte (ex.: "Hoje: 08:00 – 19:00" ou "Hoje: fechado").
4. Em Configurações, os campos antigos de abertura/fechamento são trocados por um aviso com link para Meu site → Horário, evitando duas edições.
5. A abertura da fila continua dependendo só do botão "Fila ativa" (regra atual mantida) — o horário é apenas informativo.
6. Revisar também o endereço/telefone para garantir que site e fila usam o mesmo dado salvo em "Contato e endereço".

## Detalhes técnicos
- Guardar a semana como JSON em `site_texts` (chave `business_hours`), com defaults em `src/lib/siteHoursDefaults.ts` e hook `useBusinessHours` (cache local igual aos textos do site, sem piscar).
- Helpers: `formatWeeklyHours()` (agrupa dias iguais) e `getTodayHours()` usando o fuso America/Fortaleza (`businessDay.ts`), incluindo regra do 1º/2º domingo.
- Ao salvar, também atualizar `queue_settings.opening_time/closing_time` com o horário de hoje/padrão para compatibilidade.
- Arquivos: `Contact.tsx`, `QueueStatus.tsx`, `HeroStatsPanel.tsx`, `QueueJoinForm.tsx`, `BarberQueueForm.tsx`, `Configuracoes.tsx`, `MeuSite.tsx`, novo `BusinessHoursManager.tsx`.
- Testes curtos para `getTodayHours` (domingo 1º/2º vs 3º, dia fechado).
