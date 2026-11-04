# Melhorar edição do site principal ("Sobre nós" e Endereço)

## Problema encontrado
- Em "Meu site > Sobre nós", os campos de texto abrem **vazios**; o texto que aparece no site fica só como sugestão cinza. Ao clicar e digitar, a sugestão some — parece que "apagou tudo". Não dá para editar só um trecho.
- O texto padrão ainda cita "PAULO e DG" (desatualizado).
- O endereço ("Rua da Codeal, 144 Salvador Lyra, Maceió – AL") está fixo no site, sem opção de edição no painel.

## O que vou fazer

### 1. Sobre nós — editar sem apagar
- Os campos abrem já preenchidos com o texto que está publicado no site (salvo ou padrão), permitindo alterar só uma parte, ex.: trocar os nomes da equipe para "Gustavo, DG e Pedro".
- Atualizar o texto padrão da equipe para: "Nosso time é formado por três excelentes profissionais, que seguem o padrão Brutos de qualidade: Gustavo, DG e Pedro. ..."
- Botão "Desfazer alterações" (volta ao que está salvo) além do "Restaurar padrão" (com confirmação).
- Aviso "Alterações não salvas" e contador de caracteres em cada campo.
- Prévia continua mostrando em tempo real.

### 2. Nova aba "Contato e endereço" em Meu site
Campos profissionais:
- Rua/Avenida, Número, Complemento, Bairro, Cidade, Estado (lista UF), CEP (com máscara e preenchimento automático pelo CEP via ViaCEP).
- Ponto de referência (opcional).
- Link do Google Maps (gerado automaticamente a partir do endereço, podendo ser substituído).
- Prévia de como fica no site e botão "Abrir no mapa" para conferir.

### 3. Site mostra o endereço salvo
- A seção de Contato passa a exibir o endereço do painel formatado (ex.: "Rua da Codeal, 144 – Salvador Lyra, Maceió – AL, 57000-000"), tocando abre o mapa.
- Sem piscar: usa o mesmo cache local já usado nas fotos/textos; enquanto não houver nada salvo, mostra o endereço atual.

## Detalhes técnicos
- `AboutSectionManager.tsx`: inicializar `form` com `texts[k]?.trim() || ABOUT_DEFAULTS[k]`; sincronizar só na primeira carga (não sobrescrever durante edição); `dirty` comparando com salvo.
- `siteAboutDefaults.ts`: novo `about_p2`.
- Novo `src/lib/siteContactDefaults.ts` (chaves `contact_street`, `contact_number`, `contact_complement`, `contact_district`, `contact_city`, `contact_state`, `contact_zip`, `contact_reference`, `contact_maps_url`) + `formatAddress()`.
- Novo `src/components/admin/ContactSectionManager.tsx`, nova aba na página Meu site; salva via `useSaveSiteTexts` (tabela `site_texts`, sem mudança no banco).
- `Contact.tsx`: ler com `useSiteTexts` e montar endereço + link do mapa.
