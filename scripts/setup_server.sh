#!/usr/bin/env bash
# ==============================================================================
# Script de Instalação e Provisionamento Resiliente para Luci no Android Termux
# Arquitetura: ARM64 (aarch64) / Linux
# Trata compilações nativas de Rust/C (pydantic-core, cryptography, maturin)
# ==============================================================================

set -e

echo "🚀 [Luci Setup] Iniciando provisionamento resiliente no Termux (ARM64)..."

# 1. Atualizar repositórios de pacotes do Termux
echo "📦 1/6 Atualizando repositórios de pacotes..."
pkg update -y && pkg upgrade -y

# 2. Instalar toolchain completa de compilação nativa C/C++ e Rust no Termux
echo "🔧 2/6 Instalando toolchain nativa de compilação (Rust, Clang, Binutils, Make, LibFFI, OpenSSL)..."
pkg install -y \
    python \
    python-pip \
    nodejs-lts \
    git \
    ffmpeg \
    rust \
    clang \
    binutils \
    make \
    cmake \
    pkg-config \
    libffi \
    openssl \
    libxml2 \
    libxslt \
    libjpeg-turbo \
    zlib

# 3. Exportar variáveis de ambiente para compilação Rust e Clang no Termux
echo "⚙️ 3/6 Configurando flags de compilação de sistema para ARM64..."
export CC=clang
export CXX=clang++
export RUSTFLAGS="-C link-arg=-Wl,-rpath=$PREFIX/lib"
export CARGO_BUILD_TARGET="aarch64-linux-android"

# 4. Instalar gerenciador de processos PM2 e Cloudflared (Túnel 24/7)
echo "🌐 4/6 Instalando PM2 e Cloudflared..."
npm install -g pm2

if ! command -v cloudflared &> /dev/null; then
    echo "Baixando binário oficial do Cloudflare Tunnel para ARM64..."
    curl -L --output "$PREFIX/bin/cloudflared" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64
    chmod +x "$PREFIX/bin/cloudflared"
    echo "✅ Cloudflared instalado em $PREFIX/bin/cloudflared"
fi

# 5. Instalar Maturin, Wheel, Setuptools e compilar dependências Python
echo "🐍 5/6 Preparando ambiente Python e instalando maturin/wheel..."
pip install --upgrade pip setuptools wheel maturin

echo "📦 Instalando dependências do projeto Luci (pydantic, fastapi, uvicorn, etc.)..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    pip install \
        fastapi \
        "uvicorn[standard]" \
        httpx \
        pydantic \
        python-dotenv \
        websockets \
        yfinance \
        phonenumbers \
        shazamio
fi

# 6. Permissões de execução para scripts de inicialização
echo "🔒 6/6 Configurando permissões de execução..."
chmod +x scripts/*.sh 2>/dev/null || true

echo ""
echo "🎉 [Luci Setup] Provisionamento concluído com sucesso!"
echo "👉 Agora configure seu arquivo .env com suas chaves de API: nano .env"
echo "👉 Depois inicie o servidor 24/7 com: bash scripts/start_luci.sh"
