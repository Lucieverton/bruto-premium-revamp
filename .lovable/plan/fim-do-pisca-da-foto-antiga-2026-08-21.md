# Fim do "pisca" da foto antiga

Hoje, ao abrir o site ou dar F5, cada imagem gerenciada pelo painel aparece assim: primeiro a imagem embutida no código (a antiga/padrão), e só depois que a consulta ao banco responde é que a foto nova entra no lugar. Isso causa o piscar. A correção elimina esse primeiro quadro errado.

## O que muda para o cliente

- Ao abrir o site, a imagem correta aparece de primeira. Nada de mostrar a foto antiga e trocar sozinha.
- Na primeira visita (sem cache), a área da imagem entra suave (fundo escuro / skeleton) e só mostra a foto definitiva — sem troca visível.
- Quando o dono troca uma foto no painel, a antiga é apagada do armazenamento; ela não volta a aparecer em nenhuma situação.
- Vale para todas as fotos: logo, ícones do menu, hero (celular e computador), Sobre nós, cadeira da fila, portfólio e produtos.

## Como será feito (técnico)

**1. Cache persistente das imagens do site (`src/hooks/useSiteImages.ts`)**
- Guardar o resultado de `site_images`, `site_gallery_items` e `site_texts` em `localStorage` a cada sucesso.
- Usar esse valor como `initialData` do React Query, então no primeiro render já existe a URL real do banco — sem passar pela imagem embutida.
- Manter `staleTime` alto e revalidação em segundo plano; se a URL mudar, o navegador já tem a nova pré-carregada antes de trocar (ver item 3).

**2. Fallback só quando realmente não há dado (`useSiteImage`)**
- Passar a retornar `{ url, resolved }`: `resolved` é falso apenas enquanto não há cache nem resposta.
- Componentes (`Hero`, `Navbar`, `Footer`, `About`, `QueueHeader`, `QueueListPanel`, `AdminLayout`, `admin/Login`) renderizam um placeholder neutro (fundo/skeleton, sem imagem) enquanto `resolved` for falso, em vez de pintar o asset embutido.
- Os arquivos em `src/assets/*` continuam como último recurso (erro de rede), nunca como primeiro quadro.

**3. Pré-carregamento antes da troca**
- Helper `preloadImage(url)`: quando a consulta traz uma URL diferente da que está na tela, a nova é carregada em memória e só então substituída. Elimina o flash entre URL antiga e nova.
- `Hero` usa `<link rel="preload">` dinâmico para a variante (mobile/desktop) em uso.

**4. Upload mais limpo (`uploadSiteImage` + `useSaveSiteImage` / galerias)**
- Após salvar a nova URL, remover o arquivo anterior do bucket (`storage.remove`) para não sobrar imagem órfã.
- Atualizar o cache do React Query de forma otimista com a nova URL (com pré-carregamento), para o painel refletir na hora, sem piscar a antiga.
- Manter nome de arquivo com timestamp (já existente), garantindo que o CDN nunca sirva versão em cache errada.

**5. Galerias (portfólio e produtos)**
- Mesmo tratamento: cache persistido + skeleton estável com a mesma altura, evitando salto de layout e troca visível de fotos.

## Fora do escopo

Nenhuma mudança em textos, cores, layout das seções ou regras da fila.
