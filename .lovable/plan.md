

# Plan: Dynamic Evolution Chart by Date Range

## Current State
The `AnnualChart` always shows yearly data (12 months) regardless of the selected filter. It uses `useAllBarbersAnnualData` which always fetches the full year.

## Changes

### 1. Update `AnnualChart` to accept `dateRange` prop
Pass the current `dateRange` from `Financeiro.tsx` into `<AnnualChart dateRange={dateRange} />`.

### 2. New hook: `useEvolutionChartData` in `useBarberEarnings.ts`
A single hook that fetches `attendance_records` for the relevant period and groups data by the appropriate granularity:

| Mode | Query Range | X-Axis Labels | Grouping |
|------|------------|---------------|----------|
| today | Today 00:00-23:59 | Hours (8h, 9h...19h) | By hour |
| week | Last 7 days (Mon-Sat) | Seg, Ter, Qua, Qui, Sex, Sáb | By weekday |
| month | Last 30 days | 01, 02...30 | By day |
| year | Jan 1 - Dec 31 | Jan, Fev...Dez | By month (existing) |

Each data point includes: `revenue`, `commission`, `shopProfit`, `attendances`, plus per-barber breakdown in the tooltip.

### 3. Update `AnnualChart` component
- Dynamic title: "Evolução de Hoje" / "Evolução da Semana" / "Evolução do Mês" / "Evolução Anual 2026"
- Dynamic subtitle describing the granularity
- Remove month indicator dots for non-year modes
- Tooltip shows barber names and their individual contributions per data point

### 4. Add custom date picker in `Financeiro.tsx`
Add a date input next to the existing filter buttons so the admin can pick a specific date to view that day's data in detail.

### Files Modified
| File | Change |
|------|--------|
| `src/hooks/useBarberEarnings.ts` | Add `useEvolutionChartData(dateRange, customDate?)` hook |
| `src/components/admin/AnnualChart.tsx` | Accept `dateRange` prop, use new hook, dynamic titles |
| `src/pages/admin/Financeiro.tsx` | Pass `dateRange` to `AnnualChart`, add date picker input |

