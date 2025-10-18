# Como fazer deploy na Hostgator

## Passos para hospedar o site:

### 1. Fazer o build do projeto
Execute o comando no terminal (local):
```bash
npm run build
```
Isso criará uma pasta `dist` com todos os arquivos otimizados.

### 2. Preparar os arquivos
- A pasta `dist` conterá todos os arquivos necessários
- O arquivo `.htaccess` já está incluído em `public/` e será copiado automaticamente para `dist`

### 3. Upload para Hostgator

**IMPORTANTE**: Não tente compactar ou extrair arquivos no servidor. Envie os arquivos SOLTOS da pasta `dist`.

#### Opção A - Via cPanel File Manager (RECOMENDADO):
1. Acesse o cPanel da Hostgator
2. Abra o "Gerenciador de Arquivos" (File Manager)
3. Navegue até a pasta `public_html` (ou a pasta do seu domínio)
4. **DELETE todos os arquivos antigos** que estiverem lá (se houver)
5. Abra a pasta `dist` no seu computador
6. **Selecione TODOS os arquivos DENTRO da pasta dist** (não a pasta dist em si)
7. Arraste e solte os arquivos direto no File Manager, ou use o botão "Upload"
8. Aguarde o upload completar
9. Verifique se os arquivos estão na raiz de `public_html`:
   - index.html
   - .htaccess
   - pasta assets/
   - robots.txt

**NÃO FAÇA**: Não envie a pasta `dist` compactada (.zip ou .rar). O File Manager pode não conseguir extrair.

#### Opção B - Via FTP (Mais confiável para muitos arquivos):
1. Baixe e instale o FileZilla (https://filezilla-project.org/)
2. Conecte-se ao servidor FTP da Hostgator (use as credenciais do cPanel)
3. No lado esquerdo (local), navegue até a pasta `dist` do projeto
4. No lado direito (servidor), navegue até `public_html`
5. **DELETE todos os arquivos antigos** que estiverem em `public_html`
6. Selecione TODOS os arquivos DENTRO de `dist` (não a pasta dist)
7. Arraste para `public_html`
8. Aguarde a transferência completar

### 4. Verificar o .htaccess
- O arquivo `.htaccess` é essencial para o funcionamento das rotas
- Ele já está configurado para redirecionar todas as URLs para o index.html
- Certifique-se que ele está na raiz do domínio junto com o index.html

### 5. Testar
- Acesse seu domínio
- Navegue pelas páginas
- Teste os links diretos (ex: seusite.com.br/#servicos)
- Tudo deve funcionar sem erro 404

## Estrutura final na Hostgator:
```
public_html/
├── .htaccess (importante!)
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [imagens]
└── [outros arquivos]
```

## Troubleshooting:

### Se ainda aparecer erro 404:
1. Verifique se o `.htaccess` está na raiz
2. Verifique se o módulo mod_rewrite está ativo no servidor
3. Entre em contato com o suporte da Hostgator para ativar o mod_rewrite

### Se as imagens não carregarem:
- Verifique se a pasta `assets` foi enviada completamente
- Verifique as permissões das pastas (644 para arquivos, 755 para pastas)

### Cache do navegador:
- Se fizer alterações, limpe o cache do navegador (Ctrl+Shift+R)
