#!/usr/bin/env bash
# ==============================================================================
# Script de Instalação e Provisionamento de Ambiente para L.U.C.I. no Android Termux
# Arquitetura: ARM64 (aarch64) / Linux
# ==============================================================================

set -e

echo "🚀 [Luci Setup] Iniciando provisionamento no ambiente Termux / Android..."

# 1. Atualizar repositórios do Termux
echo "📦 Atualizando repositórios de pacotes..."
pkg update -y && pkg upgrade -y

# 2. Instalar pacotes essenciais do sistema
echo "🔧 Instalando pacotes básicos (Python, Node.js, Git, FFmpeg, Clang, Rust)..."
pkg install -y python python-pip nodejs-lts git ffmpeg clang build-essential rust libxml2 libxslt pkg-config libffi openssl

# 3. Instalar o gerenciador de processos PM2 e Cloudflared
echo "⚙️ Instalando PM2 globalmente via npm..."
npm install -g pm2

# 4. Baixar binário oficial do Cloudflare Tunnel (ARM64) se não existir
if ! command -v cloudflared &> /dev/null; then
    echo "🌐 Baixando e instalando Cloudflared para arquitetura ARM64..."
    curl -L --output $PREFIX/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64
    chmod +x $PREFIX/bin/cloudflared
    echo "✅ Cloudflared instalado em $PREFIX/bin/cloudflared"
fi

# 5. Criar ambiente virtual Python e instalar dependências
echo "🐍 Configurando ambiente Python..."
pip install --upgrade pip setuptools wheel
pip install fastapi uvicorn httpx pydantic python-dotenv websockets yfinance phonenumbers shazamio

# 6. Permissões de execução para scripts
chmod +x scripts/*.sh 2>/dev/null || true

echo "🎉 [Luci Setup] Ambiente provisionado com sucesso! Use './scripts/start_luci.sh' para iniciar."
