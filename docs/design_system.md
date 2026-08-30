---
Title: Luci Design System & UI Specifications
Category: Design & User Interface
Status: Official Living Document
Version: 1.0
Owner: Lucas Vilella
Related Documents:
  - BOOT.md
  - 06_INTERFACES/MOBILE.md
  - mapas_fluxos.md
Summary: Especificação canônica de design, paleta de cores (Dark/Light mode), tipografia, superfícies táteis, anatomia do Deck Modular e biblioteca de componentes reutilizáveis da Luci.
---

# 🎨 LUCI DESIGN SYSTEM (CLEAN & SOFT-UI)

Este documento padroniza a linguagem visual, tokens CSS, componentes reutilizáveis, elevações e comportamentos táteis para todas as interfaces da Luci.

---

## 1. PALETA DE CORES & IDENTIDADE DA MARCA

O design da Luci utiliza uma estética **Clean & Soft-UI**, sem neon agressivo, priorizando contraste refinado, superfícies táteis e harmonia em ambos os modos.

### A. Cor-Mãe (Identidade Luci / Botão Central / Orb)
- **Primary Gradient:** `linear-gradient(135deg, #5c62ec 0%, #7c82ff 100%)`
- **Radial Hold Glow:** `linear-gradient(135deg, #5c62ec 0%, #7c82ff 50%, #ffccf2 100%)`
- **Active Dot / Indicator:** `#7c82ff` / `#5c62ec`
- **Shadow Brand:** `0 8px 24px rgba(92, 98, 236, 0.35)`

### B. Tokens de Superfícies & Modos

| Token CSS | Light Mode | Dark Mode | Descrição |
| :--- | :--- | :--- | :--- |
| `--bg-app` | `#f8f9fc` | `#0b0c10` | Fundo principal da aplicação |
| `--bg-deck` | `#ffffff` | `#16171d` | Fundo do deck inferior modular e modais |
| `--bg-surface-1` | `#f1f3f9` | `#1c1e26` | Cards principais e botões secundários |
| `--bg-surface-2` | `#e4e7f1` | `#252833` | Badges, chips e áreas de destaque sutil |
| `--text-primary` | `#12131a` | `#ffffff` | Títulos e textos de alto contraste |
| `--text-secondary` | `#6b7280` | `#9ca3af` | Subtítulos e ícones em repouso |
| `--text-muted` | `#9ca3af` | `#6b7280` | Labels terciárias e rodapés |
| `--border-subtle` | `rgba(0, 0, 0, 0.06)` | `rgba(255, 255, 255, 0.08)` | Bordas finas e divisores |
| `--shadow-deck` | `0 12px 36px rgba(0,0,0,0.08)` | `0 20px 48px rgba(0,0,0,0.6)` | Elevação flutuante do deck |

---

## 2. ANATOMIA DO DECK MODULAR INFERIOR

Baseado na geometria orgânica com **calota central elevada**:

```
           ╭─────────╮   <- Calota central curvada
╭──────────╯   ( + ) ╰──────────╮  <- Altura: 62px | Raio: 32px
│   [ 🏠 ]   [ 🔍 ]     [ 📚 ]   [ 👤 ]   │
╰─────────────────────────────────────────╯
```

### Especificações do Componente (`ModularDeck`):
- **Container:** `max-width: 420px`, `height: 62px`, `border-radius: 32px`, `backdrop-filter: blur(24px)`.
- **Botão Central da Luci (`LuciCentralButton`):**
  - Diâmetro: `50px` em calota elevada `-top-3` (posicionado no centro exato).
  - Anel de Progresso Radial: SVG circular com `strokeWidth: 3px`, diâmetro `64px`, gradiente `#5c62ec` a `#ffccf2`.
- **Itens do Deck:**
  - Ícones: `size: 20px` com `strokeWidth: 1.8`.
  - Indicador Ativo: Ponto circular de `4px` centralizado abaixo do ícone com animação `fade-in`.

---

## 3. CATÁLOGO DE COMPONENTES REUTILIZÁVEIS

## 3. ESPECIFICAÇÕES DE BORDAS & ARREDONDAMENTOS (PROPORÇÃO 10% A 15%)

- **Regra de Ouro (Proporção Áurea 10% a 15%)**:
  Os cantos arredondados de cards, capas e imagens utilizam rigorosamente de **10% a 15% da altura/dimensão do elemento**, garantindo um visual profissional, limpo e sem excesso de arredondamento (*conforme referência "Fora do Padrão"*):
  - **Miniaturas e Linhas (`52px a 68px`)**: `rounded-[10px]` (~15%);
  - **Cards Médios e Carrosséis (`130px a 145px`)**: `rounded-[14px]` (~10-11%);
  - **Grelhas de 2 Colunas (`150px a 165px`)**: `rounded-[16px]` (~10%);
  - **Capas de Detalhes (`220px`)**: `rounded-[22px]` (10%);
  - **Capa do Player Expandido (`320px`)**: `rounded-[24px]` (~8-10%);
  - **Avatares de Artista**: `rounded-full` (100% circular);
  - **Modais e Deck Modular**: `rounded-[28px]` a `rounded-[32px]`.

---

## 4. BIBLIOTECA DE COMPONENTES REUTILIZÁVEIS

### A. Cabeçalhos & Navegação
1. **`AppHeader`** (`components/ui/app-header.tsx`):
   - Header superior com avatar do usuário, saudação ("Bom dia 👋"), nome, seletor de tema universal (Dark/Light), busca e notificações.
2. **`SectionHeader`** (`components/ui/section-header.tsx`):
   - Cabeçalho de seção padronizado com título e ação contextual `"Ver tudo"` na cor da marca (`var(--accent-primary)`).
3. **`LuciCentralButton`** (`components/navigation/luci-central-button.tsx`):
   - Botão físico virtual com tap simples (menu de módulos), duplo tap (Orb) e hold radial (Push-to-Talk 650ms).
4. **`ModularDeck`** (`components/navigation/modular-deck.tsx`):
   - Deck inferior fixo com geometria de calota central elevada e slots simétricos.

### B. Cards & Superfícies de Mídia
1. **`MediaCard`** (`components/ui/media-card.tsx`):
   - Card de álbum/música de proporção 1:1 com cantos arredondados de `14px` (`rounded-[14px]`), borda sutil, sombra suave e efeito hover/zoom.
2. **`ArtistCircle`** (`components/ui/artist-circle.tsx`):
   - Avatar circular de artista de `130px × 130px`, borda sutil, nome centralizado com transição de cor para a cor da marca.
3. **`ChartCard`** (`components/ui/chart-card.tsx`):
   - Card retangular de paradas musicais (`155px × 100px`) com cantos arredondados de `14px` (`rounded-[14px]`) e gradientes fluidos.
4. **`ExploreCategoryCard`** (`components/ui/explore-category-card.tsx`):
   - Card retangular de categoria / gênero musical (`height: 106px`) com cantos arredondados de `14px` (`rounded-[14px]`), fundo colorido e capa de disco inclinada a `25deg` no canto inferior direito.
5. **`TrackRow`** (`components/ui/track-row.tsx`):
   - Linha de resultado de busca / tracklist com imagem `52px × 52px` arredondada (`rounded-[10px]` ou `rounded-full` para artistas), título com truncate, subtítulo, botão circular de Play (`size-8`) na cor da marca e botão de menu três pontos.
6. **`ArtistRow`** (`components/ui/artist-row.tsx`):
   - Linha de resultado de artista com avatar circular amplo `68px × 68px`, nome em destaque com badge azul de verificado (`size-4`) e botão pílula `Seguir` (preenchido na cor da marca) ou `Seguindo` (outline com transição).
7. **`AlbumGridCard`** (`components/ui/album-grid-card.tsx`):
   - Card de álbum em grelha de 2 colunas com capa quadrada de cantos arredondados de `16px` (`rounded-[16px]`), sombra suave, título em tipografia font-extrabold, artista e ano de lançamento.
8. **`PlaylistGridCard`** (`components/ui/playlist-grid-card.tsx`):
   - Card de playlist indicada em grelha de 2 colunas com capa quadrada de cantos arredondados de `16px` (`rounded-[16px]`), sombra suave e título da playlist em tipografia font-extrabold com line-clamp-2.
9. **`LibraryMenuRow`** (`components/ui/library-menu-row.tsx`):
   - Linha de menu da biblioteca com ícone estilizado em container de `36px` (`size-9 rounded-xl`), título em tipografia font-bold, badge de contagem opcional e chevron direito com micro-animação no hover/toque.
10. **`CreatedByLuciCard`** (`components/ui/created-by-luci-card.tsx`):
   - Card superior inteligente de indicação da Luci por rotina/momento/humor com proporção horizontal (`min-h-[145px]`), cantos de `24px` (`rounded-[24px]`), fundo roxo escuro (`#2f2963`), ondas radiais decorativas em SVG no canto superior direito, foto recortada do atleta vazando pelo topo no lado direito (`-top-7`), tag de momento em caixa alta (`#9790c9`), título em 2 linhas com tipografia pesada (`text-lg font-black uppercase text-white`), barra de afinidade com fundo `#4b4382` e preenchimento **branco sólido**.
11. **`ContinuePillCard`** (`components/ui/continue-pill-card.tsx`):
   - Card em formato pílula retangular para o grid de 2 colunas do *"Continuar Ouvindo"* no topo da Home, miniatura de `48px` com cantos de `12px` e título nítido em `14px font-extrabold`.
12. **`DailyMixCard`** (`components/ui/daily-mix-card.tsx`):
   - Card vertical com proporção `1050 / 1200` (`aspect-[1050/1200]`), cantos de `14px` (`rounded-[14px]`), capa/foto do artista alinhada ao topo no fundo (`z-0`) e **moldura oficial Daily Mix sobreposta** (`dailymix_1.png` a `dailymix_5.png` em `z-10`).
13. **`PlaylistMosaicCard`** (`components/ui/playlist-mosaic-card.tsx`):
   - Card de playlist com geração automática de **mosaico 2x2 com as 4 primeiras capas de faixas**, cantos arredondados de `14px` e margem superior arejada (`mt-2.5`).
14. **`MoodFeatureCard`** (`components/ui/mood-feature-card.tsx`):
   - Card de curadorias, moods e atividades da Luci (`height: 84px`) com cantos arredondados de `14px` (`rounded-[14px]`), gradiente temático e ícone de contorno estilizado em neon suave no lado direito.

### D. Telas & Visualizações Completas
1. **`MusicHome`** (`components/music/music-home.tsx`):
   - Header com avatar, saudação, seletor de tema e sino de notificações;
   - Card de destaque **`ReleaseBannerCard`** (*Últimos lançamentos para você*);
   - Seções padronizadas com carrosséis horizontais:
     1. *Com base nas suas reproduções recentes*
     2. *Daily Mix*
     3. *Continuar ouvindo*
     4. *Seleção da semana*
     5. *Playlists Populares*
     6. *Top Estações*
     7. *Trending Artistas* (`ArtistCircle`).
   - Header com botão de voltar arredondado e seletor de tema;
   - Hero centralizado com **avatar circular gigante de `220px × 220px`**, sombra profunda de 24px, título `text-2xl font-black` e contagem de ouvintes mensais;
   - Barra de ação horizontal com botão `Seguir`/`Seguindo` na cor da marca, menu 3 pontos e **botão de Play circular gigante de `48px`** com play/pause reativo;
   - Seção de *Músicas Populares* com `SectionHeader` ("Ver tudo") e lista de `TrackRow`.
2. **`AlbumDetailView`** (`components/music/album-detail-view.tsx`):
   - Header com botão de voltar arredondado e seletor de tema;
   - Hero centralizado com **capa quadrada gigante de `220px × 220px`** com cantos arredondados de `36px` (`rounded-[36px]`), sombra profunda, título `text-2xl font-black`, artista clicável e metadados (*Álbum \| Ano*);
   - Barra de ações com botão curtir (coração), adicionar à playlist, menu 3 pontos e **botão Play em pílula ampla com texto e ícone** na cor da marca Luci;
   - Seção de *Músicas* com `SectionHeader` e lista de `TrackRow`.
3. **`PlaylistDetailView`** (`components/music/playlist-detail-view.tsx`):
   - Header com botão de voltar arredondado e seletor de tema;
   - Hero centralizado com **capa quadrada gigante de `220px × 220px`** com cantos arredondados de `36px` (`rounded-[36px]`), sombra profunda, título `text-2xl font-black`, criador da playlist (*por Theresa Wilona*) e metadados (*Playlist \| Ano*);
   - Barra de ações com curtir playlist, adicionar à playlist, menu 3 pontos e **botão Play em pílula ampla** na cor da marca Luci;
   - Seção de *Músicas* com `SectionHeader` e lista de `TrackRow`.
4. **`LibraryScreen`** (`components/music/library-screen.tsx`):
   - Header com logo Luci, título *"Minha Biblioteca"*, seletor de tema, busca e menu;
   - Carrossel horizontal *"Seu Histórico"* com `MediaCard` e botão *"Ver tudo"* que navega para o Histórico completo;
   - Lista categorizada limpa (Playlists, Álbuns, Músicas, Artistas) com `LibraryMenuRow` (sem podcasts e sem downloads).
5. **`HistoryScreen`** (`components/music/history-screen.tsx`):
   - Header com botão de voltar arredondado, título *"Histórico"*, seletor de tema e busca no histórico;
   - Barra de 3 abas com linha indicadora ativa inferior na cor da marca Luci: **`Músicas`**, **`Playlists`** e **`Álbuns`** (sem podcasts);
   - Renderização reativa: lista de faixas com `TrackRow` e grelhas de 2 colunas para Playlists e Álbuns.
6. **`PlaylistsScreen`** (`components/music/playlists-screen.tsx`):
   - Header com botão de voltar, título *"Playlists"*, seletor de tema, busca e menu;
   - Barra de ordenação (*Ordenar por Adicionados Recentemente / A-Z*);
   - Botão circular de **Criar Nova Playlist** (`size-[68px]` com ícone `+`), item especial **Músicas Curtidas** com ícone de coração e lista de playlists com capas arredondadas de `22px`;
   - Integrado com o Bottom Sheet **`NewPlaylistModal`** (`components/ui/new-playlist-modal.tsx`) com inputs arredondados de `20px`, seletor de visibilidade (Público/Privado) e botões *Cancelar* e *Criar*.
7. **`AlbumsScreen`** (`components/music/albums-screen.tsx`):
   - Header com botão de voltar, título *"Álbuns"*, seletor de tema, busca e menu;
   - Barra de ordenação (*Ordenar por Adicionados Recentemente / A-Z*);
   - Lista de álbuns salvos com capas de cantos arredondados de `22px`, metadados (*Artista \| Ano*) e menu 3 pontos;
   - Integrado com o menu suspenso **`AlbumActionMenu`** (`components/ui/album-action-menu.tsx`) com ações: *Modo Aleatório*, *Adicionar à Playlist*, *Baixar*, *Remover da Biblioteca*, *Ver Artista*, *Compartilhar*.
8. **`SongsScreen`** (`components/music/songs-screen.tsx`):
   - Header com botão de voltar, título *"Músicas"*, seletor de tema, busca e menu;
   - Barra de ordenação (*Ordenar por Adicionados Recentemente / Título*);
   - Botões duplos de reprodução rápida: **Aleatório** (preenchido com sombra na cor da marca Luci) e **Tocar** (fundo superfície);
   - Listagem completa de músicas curtidas (`TrackRow`) com play/pause e menu suspenso de ações.
9. **`ArtistsScreen`** (`components/music/artists-screen.tsx`):
   - Header com botão de voltar, título *"Artistas"*, seletor de tema, busca e menu;
   - Barra de ordenação (*Ordenar por Adicionados Recentemente / A-Z*);
   - Listagem de artistas seguidos com avatares circulares amplos de `68px × 68px`, contagem de músicas salvas e menu de 3 pontos, navegando com 1 toque para a página de detalhes do artista.
10. **`NowPlaying`** (`components/music/now-playing.tsx`):
   - Header com botão de voltar arredondado, seletor de tema e menu 3 pontos;
   - Hero com **capa 1:1 de `320px`** com cantos arredondados de `36px` (`rounded-[36px]`) e sombra profunda;
   - Barra de progresso interativa com gradiente da marca Luci e timers (*tempo decorrido / duração total*);
   - Controles de reprodução: **Anterior**, **Voltar 10s**, **Play/Pause circular de `64px`**, **Avançar 10s** e **Próximo**;
   - Barra de ferramentas secundárias: **Velocidade de reprodução** (`1x, 1.25x, 1.5x, 2x`), **Temporizador de sono**, **Cast / Transmissão** e **Mais Opções**;
   - Seção expansível de **Letras Sincronizadas** em container arredondado de `28px` com destaque dinâmico na cor da marca;
   - Card **"Sobre o Artista"** com banner de `24px`, contagem de ouvintes mensais, botão Seguir/Seguindo e biografia;
   - Carrossel horizontal **"Mais de [Artista]"** com `MediaCard`.
11. **`NotificationsScreen`** (`components/music/notifications-screen.tsx`):
   - Header com botão de voltar, título *"Notificações"*, seletor de tema e menu 3 pontos;
   - Feed contínuo de lançamentos agrupado por períodos (*Lançamentos de Hoje* e *Ontem* - sem filtros de podcasts);
   - Linhas de notificação com capas de `64px` (`rounded-[18px]`), metadados (*Data \| Duração / Artista \| Tipo*), botão play circular e menu de opções três pontos.
1. **`ModuleSelectorModal`** (`components/navigation/module-selector-modal.tsx`):
   - Modal em folha flutuante inferior (`pb-28`), bordas `rounded-3xl`, fundo com desfoque `backdrop-blur-md`.
2. **`PushToTalkOverlay`** (`components/navigation/push-to-talk-overlay.tsx`):
   - Card flutuante com indicador pulsante e barras de áudio animadas para feedback imediato de comando por voz.
3. **`TrackActionMenu`** (`components/ui/track-action-menu.tsx`):
   - Menu suspenso flutuante com largura `w-64`, cantos arredondados de `32px` (`rounded-3xl`), sombra profunda, info da faixa no header e lista de ações: *Curtir*, *Adicionar à Playlist*, *Não Tocar Isso*, *Baixar*, *Ver Artista*, *Ir para o Álbum*, *Compartilhar*.

---

## 4. REGRAS GERAIS DE DESIGN & ESTILO

1. **Nunca usar placeholders genéricos:** Toda imagem ou avatar deve ter fallback com URLs de alta qualidade ou ícones vetoriais elegantes.
2. **Mobile First & Safe Area:** Todo container raiz deve respeitar `pt-[env(safe-area-inset-top,24px)]` e `pb-[env(safe-area-inset-bottom,20px)]`.
3. **Micro-interações:** Todos os elementos interativos devem possuir resposta tátil com `active:scale-95` ou `active:scale-90`.
4. **Sem Neon Agressivo:** Cores de destaque são usadas exclusivamente para status, foco ativo e no botão central da marca.
