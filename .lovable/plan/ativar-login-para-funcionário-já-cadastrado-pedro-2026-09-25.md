# Ativar login para funcionário já cadastrado (Pedro)

## Situação
- Pedro está cadastrado como barbeiro, mas **sem login** e marcado como **inativo**.
- Hoje a tela de funcionários só permite criar login no momento do cadastro; para quem já existe não há opção.

## O que será feito
1. **Botão "Ativar login"** no cartão de cada barbeiro que ainda não tem acesso (e também dentro da janela "Editar").
2. Ao tocar, abre uma janela (formato celular) pedindo **email** e **senha** (mín. 8 caracteres e 1 número, mostrar/ocultar senha), com aviso de que senhas muito comuns são recusadas.
3. Ao confirmar, o sistema cria o acesso, vincula ao cadastro existente do Pedro (mantendo nome, foto, comissão e histórico), libera a permissão de barbeiro e **reativa** o cadastro.
4. O cartão passa a mostrar o selo de "com login" e o Pedro já consegue entrar pelo painel com o email e senha criados.
5. Mensagens claras em caso de erro (email já usado, senha fraca, sessão expirada). Se algo falhar no meio, nada fica pela metade.

## Detalhes técnicos
- `create-barber-user`: aceitar `barber_id` opcional. Se enviado: validar que o barbeiro existe e está com `user_id` nulo; criar usuário auth; `update barbers set user_id, is_active=true`; inserir `user_roles` barber; rollback (desvincular + deletar usuário) em falha; audit `enable_barber_login`.
- `src/pages/admin/Barbeiros.tsx`: novo `AlertDialog`/`Dialog` "Ativar login", mutation via `supabase.functions.invoke` com `barber_id`, botão visível quando `!barber.user_id`.
- Teste ponta a ponta com um barbeiro temporário sem login, depois removido.
