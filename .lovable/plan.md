# Meu Site — gerenciador de imagens do site e da fila

Nova área no painel do dono: **Configurações → Meu site**, onde todas as imagens do site principal e da fila podem ser trocadas, recortadas e publicadas sem precisar de código.

## O que o dono vai poder fazer

- Trocar imagens únicas (slots fixos):
  - Logo (usada no menu, rodapé, login e cabeçalho da fila)
  - Ícones do menu (abrir e fechar)
  - Hero desktop e Hero mobile
  - Seção "Sobre nós": fachada e interior
  - Imagem da cadeira exibida na "Visão geral da fila atual"
- Gerenciar galerias (listas com adicionar / remover / reordenar / ativar-desativar):
  - "Nosso trabalho" (portfólio)
  - Produtos exibidos na tabela de preços (foto, nome e descrição curta)
- Em todo upload: cortar a imagem antes de salvar, com proporção sugerida por slot (logo 1:1, hero 16:9, hero mobile 9:16, sobre 4:3, portfólio 4:5, produtos 1:1) e opção de corte livre.
- Só aparece no site o que estiver salvo e ativo no painel; cada slot mostra prévia atual e botão "Restaurar padrão".

## Como vai funcionar (técnico)

**Banco (Lovable Cloud)**
- Bucket público `site-assets` para as imagens enviadas.
- Tabela `site_images`: `slot` (ex.: `logo`, `hero_desktop`, `hero_mobile`, `menu_icon`, `close_icon`, `about_front`, `about_interior`, `queue_chair`), `url`, `alt`, `updated_at`. Leitura pública (anon + authenticated); escrita apenas para admin via `has_role`.
- Tabela `site_gallery_items`: `gallery` (`portfolio` | `produtos`), `url`, `title`, `description`, `sort_order`, `is_active`. Leitura pública apenas de itens ativos; escrita apenas admin.
- GRANTs explícitos para `anon`, `authenticated` e `service_role` conforme as políticas, RLS habilitado, trigger de `updated_at`.
- Seed inicial: registros apontando para as imagens atuais, para o site não mudar de aparência ao ativar o recurso.

**Frontend**
- Rota `/admin/site` (item "Meu site" como subitem de Configurações no `AdminLayout`, visível só para admin) e página `src/pages/admin/MeuSite.tsx` com abas: Identidade (logo/ícones), Hero, Sobre nós, Nosso trabalho, Produtos, Fila.
- Componentes novos: `ImageSlotCard` (prévia + upload + restaurar padrão), `ImageCropDialog` (recorte com `react-image-crop`, saída em WebP/JPEG comprimido antes do upload), `GalleryManager` (lista com adicionar, editar, reordenar e desativar).
- Hooks `useSiteImages` / `useSiteGallery` com React Query; consumo em `Navbar`, `Footer`, `Hero`, `About`, `Portfolio`, `PriceTable`, `QueueHeader`, `QueueListPanel`, `BarberChair3D`, `admin/Login` e `AdminLayout`.
- Os imports atuais de `src/assets/*` viram **fallback**: enquanto não houver registro salvo, a imagem original é usada — nada quebra durante a transição.
- Prioridade mobile: cards empilhados, recorte com gesto de toque, botões grandes e diálogos em `AlertDialog`/`Dialog` responsivos.

## Fora do escopo

Textos, cores e conteúdo escrito do site continuam no código; esta entrega cobre apenas imagens e itens de galeria.
