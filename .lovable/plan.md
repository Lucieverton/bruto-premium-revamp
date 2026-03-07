

# Plan: Fix Build Errors + Complete Group/Companion Visibility

## 1. Fix Build Error (pushManager TypeScript)
The `pushManager` property error in `src/hooks/usePushSubscription.ts` is a TypeScript type issue. Fix by casting `registration` to `any` or adding the proper type assertion for the PushManager API.

## 2. Add Group/Companion Badges in Barber's Atendimento Page
Currently `src/pages/admin/Atendimento.tsx` does not display group or companion information. Add:
- **👥 Grupo** badge when `item.group_id` exists
- **c/ [responsável]** label when `item.companion_name` exists
- Show this in all three sections: waiting queue, called clients, and in-progress

## 3. Add Group Info to Attendance Records
When `barber_complete_service` runs, companion info is lost. Update the attendance flow:
- Store `group_id` and `companion_name` in `attendance_records` table (new columns via migration)
- Update the `barber_complete_service` RPC to copy these fields
- Update the `get_attendance_with_services` RPC to return these fields

## 4. Show Group Info in Financial/History Views
- Update `src/pages/admin/Financeiro.tsx` and `src/pages/admin/MeuFinanceiro.tsx` to display companion badges in attendance history rows
- Admin can see which clients entered as companions and who the responsible person was

## Summary of Changes

| File/Resource | Change |
|---|---|
| `src/hooks/usePushSubscription.ts` | Fix `pushManager` TS error with type assertion |
| `src/pages/admin/Atendimento.tsx` | Add group/companion badges in all queue sections |
| DB Migration | Add `group_id` and `companion_name` columns to `attendance_records` |
| DB Migration | Update `barber_complete_service` RPC to copy group fields |
| DB Migration | Update `get_attendance_with_services` RPC to return group fields |
| `src/pages/admin/Financeiro.tsx` | Show companion info in attendance history |
| `src/pages/admin/MeuFinanceiro.tsx` | Show companion info in barber's financial view |

