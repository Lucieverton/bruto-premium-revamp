# Corrigir cadastro de funcionário com acesso ao painel

## O que foi verificado
- O serviço de criação de funcionário está publicado e responde (testado direto: valida os campos normalmente).
- Portanto a falha acontece no caminho entre o navegador do painel e esse serviço.

## Causas prováveis (a confirmar no primeiro passo)
1. **Bloqueio de origem (CORS)**: o serviço só aceita chamadas de endereços `*.lovable.app`. O site também roda na HostGator (domínio próprio) — de lá o navegador bloqueia a resposta e aparece erro genérico no final.
2. **Chamada sem a chave pública**: o painel chama o serviço "na mão", sem o cabeçalho `apikey`, o que pode ser recusado antes de chegar ao serviço.
3. **Checagem de email incompleta**: a verificação "email já cadastrado" só lê a primeira página de usuários; com a lista crescendo, pode falhar ou deixar passar duplicados, gerando erro ao criar.

## Correções
1. Reproduzir o cadastro no painel (navegador automatizado, logado como admin) e capturar a resposta exata para confirmar a causa.
2. Serviço de criação:
   - Aceitar a origem que fizer a chamada (a segurança continua garantida pela checagem de login + papel de admin).
   - Checar email duplicado tentando criar e tratando o erro "já cadastrado", em vez de listar usuários.
   - Mensagens de erro claras em português (email repetido, senha fraca, limite atingido).
   - Desfazer tudo (usuário, barbeiro, papel) se qualquer etapa falhar, para não deixar cadastro pela metade.
3. Painel (tela Barbeiros): trocar a chamada manual pela chamada padrão do sistema, que envia login e chave corretamente, e mostrar a mensagem real do erro.
4. Verificar se ficou algum cadastro pela metade da tentativa de hoje (usuário criado sem barbeiro/papel) e limpar ou completar.
5. Testar criando um funcionário de teste, entrar com ele no painel, e depois removê-lo.

## Detalhes técnicos
- `supabase/functions/create-barber-user/index.ts`: CORS ecoando `Origin`; remover `listUsers()`; mapear erro `email_exists`/422; rollback completo.
- `src/pages/admin/Barbeiros.tsx`: `supabase.functions.invoke('create-barber-user', { body })` e leitura de `error.context` para a mensagem.
- Consulta em `auth.users` x `barbers`/`user_roles` para órfãos recentes.
