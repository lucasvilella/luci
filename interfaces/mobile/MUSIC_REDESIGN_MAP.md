# 🗺️ Mapeamento de Telas, Fluxos & Arquitetura — Luci Music Redesign

Este documento mapeia **cada tela, seção, botão, ação de clique, integração com Deezer/YouTube e adaptação para Português (PT-BR)** com base nas **7 telas do novo design Figma (Design "Dark Cyber-Acoustic")**.

---

## 🎨 1. Identidade Visual & Design System (Figma)

- **Tema / Background**: `#08080A` (Preto profundo com textura sutil e degradê suave nos cards).
- **Cores de Destaque**:
  - `Cyan / Neon Teal`: `#00F2FE` / `#4FACFE` (Acentos de reprodução, ícones ativos, ondas sonoras).
  - `Purple / Magenta Gradient`: `#8A2387` -> `#E94057` -> `#F27121` (Cards de destaque "Ressonância Diária", "Liked Songs").
  - `Surface Cards`: `#111116` / `#16161E` com bordas suaves `rgba(255, 255, 255, 0.07)` e cantos arredondados de `20px` (`rounded-2xl` / `rounded-3xl`).
- **Tipografia**: 
  - Títulos elegantes com Serif estilizada / Sans moderna (`Outfit` / `Inter`).
  - Textos de apoio e badges com `text-xs font-semibold uppercase tracking-wider`.
- **Adaptabilidade**:
  - Largura fluida baseada na viewport móvel (`w-full max-w-[480px] mx-auto min-h-dvh flex flex-col`).
  - Telas longas com scroll vertical suave (`overflow-y-auto overflow-x-hidden pb-24 scrollbar-none`).
  - Mini-Player persistente acoplado acima da Bottom Navigation.

---

## 📱 2. Mapeamento Completo das 7 Telas

### 🏠 TELA 1: Início (`Home`)
*Header: Avatar do Usuário (Lucas), Nome / Status e Ícone de Opções.*

1. **Card "Ressonância Diária" (Curado para Você)**:
   - **Visual**: Card em degradê gradativo roxo/azul com capa abstrata ("Teoria da Meia-Noite") e botão Play circular flutuante com brilho neon.
   - **Ação do Botão Play**: Inicia a reprodução imediata da playlist de descobertas personalizadas (Deezer Chart / Trends).
   - **Ação de Toque no Card**: Abre a visualização da playlist detalhada.
2. **Card Secundário "Ao Vivo no Vazio" (Sessões Exclusivas)**:
   - **Ação**: Inicia a faixa ao vivo selecionada.
3. **Seção "Tocadas Recentemente" (Horizontal Scroll)**:
   - **Visual**: Cards quadrados com capas de alta resolução e texto inferior.
   - **Botão "Ver Tudo"**: Navega para a Biblioteca > Histórico.
   - **Clique no Item**: Toca a faixa/álbum imediatamente.
4. **Seção "Em Alta Agora" (Trending Now - Lista Vertical)**:
   - **Visual**: Posição numerada (`01`, `02`, `03`), capa quadrada pequena, título, artista e menu de 3 pontos.
   - **Clique na Linha**: Toca a música e abre o contexto na fila.
   - **Botão 3 Pontos**: Abre modal de ações (Adicionar à Playlist, Favoritar, Ver Artista).
5. **Seção "Artistas Populares" (Circular Grid / Carrossel)**:
   - **Visual**: Fotos circulares dos artistas mais ouvidos com efeito hover/glow.
   - **Clique no Artista**: Navega para a página dedicada do artista (`ArtistPage`).
6. **Seção "Novos Lançamentos" (Grid 2x2)**:
   - **Visual**: Cards modernos com capas de lançamentos da semana vindos da Deezer.
   - **Clique**: Reproduz o lançamento.

---

### 🔍 TELA 2: Explorar & Buscar (`Search`)
*Header: Barra de busca fixa com ícone de lupa, botão de limpar e filtro instantâneo.*

1. **Campo de Busca Ativa**:
   - **Comportamento**: Digitação com debounce de 300ms conectada a `Deezer.search(query)`.
   - **Resultados**: Lista imediata dividida entre **Músicas**, **Artistas** e **Álbuns**.
2. **Seção "Navegar por Todos os Gêneros" (Browse All - Grid Colorido)**:
   - **Gêneros**: Pop, Hip-Hop, Rock, Jazz, Eletrônica, Chill, MPB, Indie.
   - **Visual**: Cards com gradientes vibrantes únicos e imagens conceituais.
   - **Ação**: Filtra e abre a playlist oficial do gênero selecionado.
3. **Seção "Tendências Recentes" (Trending Now)**:
   - **Visual**: Lista das 5 buscas mais populares com botão "Limpar Recentes".
   - **Ação**: Preenche a busca e executa a pesquisa instantânea.

---

### 🎵 TELA 3: Tocador de Música (`Music Player` / `Now Playing`)
*Aberto em tela cheia ao tocar em qualquer música ou no Mini-Player.*

1. **Header Minimalista**:
   - Botão **Minimizar (`ChevronDown`)**: Retrai o player para o Mini-Player.
   - Título central: *"TOCANDO AGORA"*.
   - Botão **Mais Opções (`...`)**: Abre menu com *Compartilhar*, *Ver Letra*, *Detalhes da Faixa*.
2. **Arte da Capa / Disco de Vinil Holográfico**:
   - **Visual**: Capa de altíssima resolução com moldura redonda simulando vinil com rotação suave e efeito de iluminação reflexiva.
3. **Identificação da Faixa & Likes**:
   - Título grande da faixa e nome do Artista (clicável -> vai para a página do artista).
   - **Botão Curtir (Coração)**: Alterna status nos favoritos salvos localmente.
4. **Barra de Progresso & Scrubber**:
   - Linha contínua com thumb arrastável para seek temporal exato.
   - Timestamps em tempo real: `Tempo Decorrido` (ex: `1:24`) e `Tempo Total` (ex: `3:45`).
5. **Controles de Reprodução**:
   - **Shuffle (Aleatório)**: Liga/desliga ordem randômica.
   - **Voltar (`SkipBack`)**: Reinicia a faixa ou volta para a música anterior.
   - **Play/Pause Central**: Botão circular de destaque roxo/ciano com feedback háptico.
   - **Avançar (`SkipForward`)**: Pula para a próxima faixa com auto-fetch de áudio.
   - **Repetir (`Repeat`)**: Alterna entre `Desligado`, `Repetir Toda a Fila` e `Repetir Esta Música (1)`.
6. **Acesso à Letra (`Lyrics`)**:
   - Puxe para cima ou botão inferior para abrir a sincronização de letra em tela cheia.

---

### 📂 TELA 4: Playlists (`Playlists View`)
*Header: Total de Playlists (`24`), Tempo Total de Áudio (`128h 42m`) e Botão "+ Criar Playlist".*

1. **Filtros por Pílulas**:
   - `Todas`, `Colaborativas`, `Criadas por Mim`, `Baixadas`.
2. **Card de Destaque Superior ("Midnight Neon Sessions")**:
   - Capa expansiva com estatísticas (`142 Faixas • 8h 15m`), avatars de colaboradores e botão Play direto.
3. **Lista de Playlists Curadas (Cards Verticais Estilizados)**:
   - **Exemplos**: *Cyberpunk Resonance*, *Liquid Gold*, *Basement ID*, *Deep Focus Ambient*.
   - **Ação**: Ao tocar em qualquer card, expande as faixas da playlist com opção de reprodução sequencial ou aleatória.

---

### 📚 TELA 5: Biblioteca (`Library`)
*Seu Universo Musical Organizado.*

1. **Card Gigante "Músicas Curtidas" (Liked Songs)**:
   - Gradiente holográfico roxo/rosa com ícone de coração e contagem de faixas salvas.
   - **Ação**: Dá play direto em todas as músicas curtidas ou abre a lista completa.
2. **Grade de Categorias Rápidas (2x2)**:
   - ⬇️ **Baixadas / Offline**: Acesso a áudios em cache.
   - 💿 **Álbuns Salvos**: Grid de álbuns favoritados.
   - 🎙️ **Artistas Seguidos**: Lista de artistas com atualizações.
   - 📻 **Podcasts & Programas**: Episódios e estações salvas.
3. **Seção "Adicionados Recentemente"**:
   - Capas dos últimos álbuns adicionados à biblioteca.
4. **Playlists Pessoais**:
   - Lista rápida numerada (*Deep Focus Techno*, *After Hours Jazz*, etc.) com botão flutuante `+` para nova criação.

---

### 👤 TELA 6: Perfil & Atividade (`Profile`)
*Visão do Usuário e Hábitos Musicais.*

1. **Header do Perfil**:
   - Avatar circular com anel de status neon, nome ("Lucas Vilella"), badge *"Curador Elite"* e resumo de preferências.
   - Botões: *Editar Perfil* e *Compartilhar Identidade*.
2. **Métrica "Velocidade de Escuta" (Listening Velocity)**:
   - Gráfico de tendência semanal e horas totais ouvidas (`1.284 Horas`).
3. **"Vibe Atual" (Current Vibe)**:
   - Gênero predominante no momento (*Ambient Techno*) e faixa mais tocada da semana.
4. **Seção "Obsessões Musicais"**:
   - Carrossel circular dos 6 artistas mais escutados no mês.
5. **Top Rotação (Highest Rotation)**:
   - As 3 faixas com maior número de reproduções no app.
6. **Atalhos Rápidos**:
   - *Privacidade & Segurança*, *Notificações Sonoras*, *Gerenciamento de Dados* e botão *Desconectar*.

---

### ⚙️ TELA 7: Ajustes & Configurações (`Settings`)
*Preferências de Áudio, Interface e Sistema.*

1. **Experiência de Áudio**:
   - **Qualidade do Áudio**: Opções entre *Alta (320kbps / FLAC)*, *Normal* e *Econômica*.
   - **Equalizador**: Acesso a perfis de som (*Bass Boost*, *Vocal*, *Acústico*).
   - **Modo Offline**: Switch toggle para reproduzir apenas faixas em cache.
2. **Interface & Tema**:
   - **Tema Escuro Profundo (Dark Theme)**: Switch toggle ativo.
   - **Notificações**: Configurações de avisos de novos lançamentos.
3. **Rodapé**:
   - Botão de Log Out estilizado e versão do Luci Music (`v2.5.0`).

---

## ⚡ 3. Integração com APIs (Deezer + YouTube Streaming)

| Recurso do Design | Fonte de Dados / Serviço | Como Funciona |
| :--- | :--- | :--- |
| **Metadados (Músicas, Álbuns, Artistas)** | **Deezer API Global** | Traz títulos, capas em alta definição (`cover_xl`), durações reais e biografias. |
| **Streaming de Áudio Completo (100%)** | **`yt-dlp` / YouTube Audio** | Extrai áudio direto de alta fidelidade sem limite de 30 segundos, com suporte a scrub/seek. |
| **Gêneros & Descobertas** | **Deezer Editorial Charts** | Alimenta as abas de *Top Charts*, *Gêneros* e *Novos Lançamentos*. |
| **Favoritos & Playlists Pessoais** | **Armazenamento Local / SQLite Luci** | Persistência instantânea de likes, histórico e filas. |
