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

#### Opção A - Via cPanel File Manager:
1. Acesse o cPanel da Hostgator
2. Abra o "Gerenciador de Arquivos"
3. Navegue até a pasta `public_html` (ou a pasta do seu domínio)
4. Faça upload de TODOS os arquivos da pasta `dist`
5. Certifique-se que o arquivo `.htaccess` foi enviado

#### Opção B - Via FTP:
1. Use um cliente FTP (FileZilla, por exemplo)
2. Conecte-se ao servidor da Hostgator
3. Navegue até `public_html`
4. Envie todos os arquivos da pasta `dist`

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
