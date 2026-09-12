# Corrigir notificações de novos clientes para os barbeiros

## O que está acontecendo

Verifiquei o sistema de notificações e encontrei problemas reais, não apenas de configuração do celular:

1. **Existem duas "chaves de notificação" salvas no sistema** (uma de fevereiro, outra de maio). O código espera encontrar apenas uma; ao achar duas, ele falha e responde "chaves não configuradas" — ou seja, nenhum envio chega ao celular dos barbeiros.
2. **Os celulares cadastrados estão desatualizados.** Só existem 3 registros de aparelho, o mais recente de 29/05. Como a chave mudou, esses registros ficaram inválidos e nunca mais seriam aceitos pelo Google.
3. **O envio das notificações não aparece em nenhum registro de execução**, indicando que os pedidos de envio feitos pelo site estão sendo recusados antes mesmo de chegar ao serviço de notificação (falta a credencial pública padrão no pedido).
4. Hoje o barbeiro só é avisado de fato quando está com a página aberta. Fora isso, depende do envio que está quebrado pelos motivos acima.

## O que será feito

1. **Limpar e unificar a chave de notificação**: manter uma única chave válida e ajustar o código para nunca mais quebrar caso exista mais de um registro (usa sempre a mais recente).
2. **Ajustar o pedido de envio do site** para incluir a credencial pública necessária, de modo que o envio realmente chegue ao serviço.
3. **Recadastrar os aparelhos automaticamente**: ao abrir o painel, o celular do barbeiro verifica se seu cadastro corresponde à chave atual; se não, refaz o cadastro sozinho. Registros antigos/inválidos são apagados.
4. **Melhorar a mensagem que chega na tela bloqueada**: enviar o conteúdo real (nome do cliente, serviço e número do ticket) em vez do texto genérico, e abrir direto a fila do barbeiro ao tocar.
5. **Tela de diagnóstico em "Meu Perfil"**: mostrar se as notificações estão ativas neste aparelho, se ele está cadastrado no sistema, e um botão "Testar notificação real" que dispara um envio verdadeiro (não apenas um aviso local), para o barbeiro confirmar com o celular bloqueado.
6. **Aviso no painel** quando o barbeiro estiver usando o site pelo navegador em iPhone sem ter instalado o app na tela inicial — nesse caso o celular não entrega notificações em segundo plano, e ele precisa instalar.
7. **Registrar falhas de envio** para que, se voltar a acontecer, seja possível ver o motivo exato.

## Detalhes técnicos

- Migração: remover/desativar linhas duplicadas em `vapid_keys`, mantendo uma; adicionar índice único parcial para impedir duplicatas futuras.
- `supabase/functions/send-push/index.ts`: trocar `.single()` por `order(created_at desc).limit(1).maybeSingle()`; enviar payload criptografado (aes128gcm) com título/corpo/URL em vez de push TTL-only; retornar erros detalhados; remover assinaturas com 404/410; adicionar endpoint `POST { type: 'test', barber_id }` autenticado para teste real.
- `src/lib/pushNotify.ts`: incluir headers `apikey` e `Authorization: Bearer <anon key>` na chamada.
- `src/hooks/usePushSubscription.ts`: comparar chave da assinatura existente com a atual, reinscrever quando divergir, apagar linhas antigas do mesmo `barber_id` com endpoint diferente, e re-verificar em `visibilitychange`.
- `public/sw-push.js`: ler o payload criptografado e montar título/corpo/`data.url` reais; manter fallback atual.
- `src/pages/admin/MeuPerfil.tsx`: bloco de status (permissão, aparelho registrado, data do registro) + botão de teste real + aviso de PWA no iOS.
