# Plano de Implementação: Integração Multicanal (WhatsApp & Telegram) + Motor de Áudio Neural

Este plano detalha a expansão da **Luci** para se tornar um assistente cognitivo multicanal de alto nível, conectando os canais do **WhatsApp** e **Telegram**, gerando respostas em voz (arquivos de áudio `.mp3`/`.ogg`) e integrando perfeitamente a Memória Cognitiva existente.

---

## User Review Required

> [!IMPORTANT]
> **Conexão dos Canais**:
> 1. **Telegram**: Requer a criação de um Bot Token via `@BotFather` no Telegram (processo simples de 1 minuto).
> 2. **WhatsApp**: Utilizará a biblioteca de conexão nativa de QR Code (`@whiskeysockets/baileys`). Um QR Code será exibido no console/terminal para pareamento do seu WhatsApp.

> [!TIP]
> **Respostas em Áudio pelo Celular**:
> Quando você mandar uma mensagem de texto ou de voz pelo Telegram/WhatsApp, a Luci poderá responder tanto com **texto** quanto com uma **nota de voz (.ogg / .mp3)** nativa no seu chat!

---

## Proposed Changes

### Servidor Backend & Canais (`server/`)

#### [NEW] [telegramChannel.ts](file:///e:/Projects/luci/server/channels/telegramChannel.ts)
- Implementa o conector do Telegram.
- Processa mensagens de texto e áudios de voz recebidos no celular.
- Roteia as mensagens para o `ModelRouter` da Luci preservando a **Memória Cognitiva**.
- Envia respostas em texto e notas de voz (`voice audio`).

#### [NEW] [whatsappChannel.ts](file:///e:/Projects/luci/server/channels/whatsappChannel.ts)
- Implementa a ponte de conexão do WhatsApp via `@whiskeysockets/baileys`.
- Exibe o QR Code de autenticação no terminal na primeira inicialização.
- Processa mensagens do seu número de celular autorizando respostas em texto e voz.

#### [NEW] [audioSynthesisService.ts](file:///e:/Projects/luci/server/tts/audioSynthesisService.ts)
- Gerador local de arquivos de áudio `.ogg`/`.mp3` para enviar como mensagens de voz no WhatsApp e Telegram.

#### [MODIFY] [api.ts](file:///e:/Projects/luci/server/api.ts)
- Inicializa os conectores do Telegram e WhatsApp junto com a API REST.
- Adiciona endpoints de status dos canais (`GET /api/channels/status`).

---

### Interface Desktop (`interfaces/desktop/`)

#### [MODIFY] [ChatPanel.tsx](file:///e:/Projects/luci/interfaces/desktop/src/components/chat/ChatPanel.tsx)
- Adiciona indicadores visuais de status das conexões do WhatsApp e Telegram no painel do chat.

---

## Verification Plan

### Automated & Integration Tests
- **Teste de Roteamento de Mensagens**: Validar o processamento de texto e retorno do `ModelRouter` para instâncias de mensagens.
- **Compilação**: Executar `npm run build` na interface desktop para garantir zero erros de compilação.

### Manual Verification
1. **Pareamento WhatsApp**: Validar a leitura do QR Code e envio de mensagem de teste via WhatsApp.
2. **Bot do Telegram**: Testar envio de texto e mensagem de voz pelo aplicativo do Telegram e verificar o retorno sonoro e em texto da Luci
