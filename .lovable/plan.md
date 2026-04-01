

# Plano: Corrigir PWA para instalação mobile + Atualizar horário

## Problemas Identificados

1. **PWA não instalável no celular**: Falta a guarda contra iframe/preview no `main.tsx`. O Service Worker registrado dentro do iframe do Lovable impede a instalação no site publicado.
2. **Horário desatualizado**: Atualmente mostra "1º, 2º e 3º domingo" — deve ser "1º, 2º domingo do mês: 9h as 12h".

## Mudanças

### 1. `src/main.tsx` — Adicionar guarda de iframe para PWA
Impedir registro do Service Worker quando o app está rodando dentro do iframe do Lovable (preview). Desregistrar SWs existentes nesses contextos. Isso resolve o problema de instalação no site publicado.

### 2. `src/components/Contact.tsx` — Corrigir horário
Linha 64: Trocar `"Domingo 1º, 2º e 3º domingo do mês: 9h as 12h"` por `"Domingo 1º, 2º domingo do mês: 9h as 12h"`.

| Arquivo | Mudança |
|---------|---------|
| `src/main.tsx` | Adicionar guarda iframe/preview para Service Worker |
| `src/components/Contact.tsx` | Corrigir texto do horário de domingo |

