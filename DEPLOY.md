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

**⚠️ ATENÇÃO - ERRO COMUM**: Muitos usuários tentam compactar a pasta dist em .zip e extrair no servidor, mas isso SEMPRE dá erro! Siga o método correto abaixo.

#### Opção A - Via cPanel File Manager (MÉTODO MAIS FÁCIL):

**PASSO A PASSO DETALHADO:**

1. **No seu computador:**
   - Abra a pasta `dist` que foi criada após o build
   - Dentro dela você verá: index.html, .htaccess, pasta assets/, robots.txt, etc.
   - **SELECIONE TUDO que está DENTRO da pasta dist** (Ctrl+A ou Cmd+A)
   - ⚠️ NÃO selecione a pasta dist em si, apenas o CONTEÚDO dentro dela

2. **No cPanel:**
   - Acesse o cPanel da Hostgator
   - Clique em "Gerenciador de Arquivos" (File Manager)
   - Navegue até a pasta `public_html` (ou a pasta específica do seu domínio)
   - **IMPORTANTE**: Delete TODOS os arquivos antigos que estiverem lá

3. **Fazendo o upload:**
   - Com os arquivos selecionados no seu computador
   - Arraste e solte DIRETAMENTE na janela do File Manager
   - OU clique no botão "Upload" no File Manager e selecione os arquivos
   - Aguarde a barra de progresso completar (pode demorar alguns minutos)

4. **Verificação final:**
   - Confirme que na raiz de `public_html` você tem:
     - ✅ index.html
     - ✅ .htaccess (arquivo oculto, pode precisar ativar "Mostrar arquivos ocultos")
     - ✅ pasta assets/
     - ✅ robots.txt
   - ❌ NÃO deve ter: pasta dist/, arquivos .zip ou .rar

**❌ NÃO FAÇA ISSO:**
- ❌ Compactar a pasta dist em .zip
- ❌ Fazer upload de arquivo compactado
- ❌ Tentar extrair arquivos no servidor
- ❌ Copiar a pasta dist inteira (só o conteúdo dentro dela)

#### Opção B - Via FTP (Recomendado se o File Manager estiver lento):

**PASSO A PASSO COM FILEZILLA:**

1. **Instalar o FileZilla:**
   - Baixe em: https://filezilla-project.org/
   - Instale no seu computador

2. **Conectar ao servidor:**
   - Abra o FileZilla
   - Use as credenciais FTP do seu cPanel:
     - Host: ftp.seudominio.com.br
     - Usuário: seu usuário do cPanel
     - Senha: sua senha do cPanel
     - Porta: 21
   - Clique em "Conexão Rápida"

3. **Preparar para upload:**
   - **Lado esquerdo (Local)**: Navegue até a pasta `dist` do projeto
   - **Lado direito (Remoto)**: Navegue até `public_html`
   - Delete TODOS os arquivos antigos que estiverem em `public_html`

4. **Fazer o upload:**
   - No lado esquerdo, ENTRE na pasta `dist`
   - Selecione TODOS os arquivos e pastas que estão DENTRO de `dist`
   - Clique com botão direito e escolha "Upload"
   - OU arraste os arquivos para o lado direito (`public_html`)
   - Aguarde a transferência completar (acompanhe na parte inferior do FileZilla)

5. **Vantagens do FTP:**
   - ✅ Mais confiável para muitos arquivos
   - ✅ Mostra progresso detalhado
   - ✅ Retoma uploads interrompidos
   - ✅ Não tem limite de tempo como o navegador

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
