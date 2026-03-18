

# Plano: PWA Instalável + Notificações Corrigidas

## Resumo
1. Usar `favicon.png` como ícone do PWA (remover arquivos `pwa-192x192.png` e `pwa-512x512.png`)
2. Garantir que clientes recebam apenas 1 notificação: "Você será o próximo" (posição = 1)
3. Barbeiros recebem notificação com nome do cliente apenas quando são o barbeiro escolhido
4. Ajustar todas as referências de ícones

## Mudanças

### 1. `vite.config.ts` — Ícones do PWA
- Alterar todos os ícones do manifest para usar `/favicon.png` (já usa, mas confirmar consistência)
- Adicionar `/~oauth` ao `navigateFallbackDenylist` do workbox (requisito PWA)

### 2. `src/lib/pwa.ts` — Trocar referências de ícones
- Substituir todas as ocorrências de `/pwa-192x192.png` por `/favicon.png`

### 3. `src/lib/notifications.ts` — Trocar referências de ícones
- Substituir todas as ocorrências de `/pwa-192x192.png` por `/favicon.png`

### 4. Remover arquivos desnecessários
- Deletar `public/pwa-192x192.png`
- Deletar `public/pwa-512x512.png`

### 5. `src/components/queue/MyTicketCard.tsx` — Notificação do cliente
- Já envia notificação "Você é o próximo!" quando posição muda para 1 (linha 43-51) — **funciona corretamente**
- Já envia notificação "É sua vez!" quando status muda para `called` (linha 54-60) — **funciona corretamente**
- Garantir que essas são as **únicas** notificações enviadas ao cliente (sem duplicatas)

### 6. `src/hooks/useQueueRealtime.ts` — Verificar notificação duplicada do cliente
- Já notifica quando `is_called && status === 'called'` via `notifyUserCalled` — pode duplicar com MyTicketCard
- Remover a notificação `notifyUserCalled` deste hook, pois `MyTicketCard` já cuida disso de forma mais controlada

### 7. `public/sw-push.js` — Trocar ícones
- Substituir `/favicon.png` nos ícones (já usa, confirmar que está correto)

### 8. Notificações do barbeiro — Verificação
- `useQueueAlert.ts` já filtra: `item.barber_id !== null && item.barber_id !== currentId` → ignora clientes de outros barbeiros ✅
- `item.barber_id === null` → fila geral, notifica todos os barbeiros ✅
- Push via edge function (`send-push`) já envia para `barber_id` específico quando definido ✅

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `vite.config.ts` | Adicionar `navigateFallbackDenylist` |
| `src/lib/pwa.ts` | Trocar ícones para `/favicon.png` |
| `src/lib/notifications.ts` | Trocar ícones para `/favicon.png` |
| `src/hooks/useQueueRealtime.ts` | Remover `notifyUserCalled` duplicado |
| `public/pwa-192x192.png` | Deletar |
| `public/pwa-512x512.png` | Deletar |

