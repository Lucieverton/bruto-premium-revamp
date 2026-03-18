

# Diagnóstico: Build falhando por erro de infraestrutura

O erro que está impedindo o deploy **não é do seu código**. É um problema temporário da infraestrutura do Lovable:

```
Cannot find package 'rollup' imported from /opt/template-node-modules/vite/dist/node/cli.js
```

Isso significa que o pacote `rollup` (dependência interna do Vite) não está disponível no servidor de build. Seu código está correto — o problema é no ambiente de compilação.

## Solução

Fazer uma alteração mínima no `package.json` para forçar uma reinstalação das dependências e um novo build. Adicionar `rollup` como dependência explícita para resolver o problema.

| Arquivo | Mudança |
|---------|---------|
| `package.json` | Adicionar `"rollup"` como devDependency para garantir que o pacote esteja disponível |

Isso deve destravar o build e permitir que todas as mudanças pendentes sejam publicadas.

