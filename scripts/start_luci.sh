#!/usr/bin/env bash
# ==============================================================================
# Script de Inicialização 24/7 para Luci no Android Termux
# Garante Wake Lock ativo e orquestra o ciclo de vida via PM2
# ==============================================================================

set -e

echo "🌟 [Luci Daemon] Ativando Wake Lock do Termux para operação 24/7 sem suspensão de CPU..."
if command -v termux-wake-lock &> /dev/null; then
    termux-wake-lock
    echo "🔋 Termux Wake Lock ativo com sucesso."
else
    echo "⚠️ Aviso: Comando 'termux-wake-lock' não encontrado (não está no Termux ou pacote termux-api ausente)."
fi

# Iniciar aplicações gerenciadas pelo PM2
echo "🚀 Subindo serviços FastAPI + Cloudflare Tunnel via PM2..."
pm2 start ecosystem.config.js

# Salvar lista do PM2 para auto-recuperação
pm2 save

echo "📊 Status dos serviços:"
pm2 status

echo "✅ [Luci Daemon] Todos os serviços estão ativos! Para monitorar os logs execute: 'pm2 logs'"
