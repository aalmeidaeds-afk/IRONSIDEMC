#!/usr/bin/env bash
# ==============================================================================
# Script de Configuração & Compilação Automática do TWA para a Google Play Store
# Iron Side Road Rider M.C. - Dinastia System
# ==============================================================================

set -e

echo "=================================================================="
echo "  Iniciando Preparação do TWA para Google Play Store"
echo "  Iron Side Road Rider M.C."
echo "=================================================================="
echo ""

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Erro: Node.js não foi encontrado. Instale o Node.js v18+ para continuar."
    exit 1
fi

# 2. Instalar CLI oficial do Google (Bubblewrap) se necessário
if ! command -v bubblewrap &> /dev/null; then
    echo "📦 Instalando ferramenta oficial do Google: @bubblewrap/cli..."
    npm install -g @bubblewrap/cli
else
    echo "✅ Bubblewrap CLI já está instalado."
fi

# 3. Definir Variáveis Padrão
DEFAULT_DOMAIN="https://seumotoclube.com.br"
DEFAULT_PACKAGE="br.com.ironsidemc.app"
DEFAULT_APP_NAME="Iron Side Road Rider M.C."
DEFAULT_SHORT_NAME="Iron Side"

DOMAIN="${1:-$DEFAULT_DOMAIN}"
PACKAGE_NAME="${2:-$DEFAULT_PACKAGE}"

echo ""
echo "Configurações do TWA:"
echo " - Domínio: ${DOMAIN}"
echo " - Package ID: ${PACKAGE_NAME}"
echo " - Manifesto: ${DOMAIN}/manifest.webmanifest"
echo ""

# 4. Criar diretório de build do TWA
mkdir -p build-twa
cd build-twa

echo "🚀 Inicializando projeto TWA com o Bubblewrap..."
# Se já existir twa-manifest.json no diretório scripts, copia para cá
if [ -f "../scripts/twa-manifest.json" ]; then
    cp ../scripts/twa-manifest.json ./twa-manifest.json
    echo "✅ Usando twa-manifest.json pré-configurado."
    bubblewrap update
else
    bubblewrap init --manifest="${DOMAIN}/manifest.webmanifest"
fi

echo ""
echo "🔨 Compilando Android App Bundle (.aab) de Produção..."
bubblewrap build

echo ""
echo "=================================================================="
echo "✅ COMPILAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=================================================================="
echo "Arquivo gerado: build-twa/app-release-bundle.aab"
echo ""
echo "PRÓXIMOS PASSOS OBRIGATÓRIOS PARA ATIVAR O MODO NATIVO (SEM BARRA DE URL):"
echo "1. Extraia o SHA-256 da sua keystore com o comando:"
echo "   keytool -list -v -keystore android.keystore -alias android"
echo ""
echo "2. Atualize o arquivo /.well-known/assetlinks.json no seu servidor Hostinger"
echo "   com o SHA-256 extraído acima."
echo ""
echo "3. Faça upload do arquivo app-release-bundle.aab no Google Play Console!"
echo "=================================================================="
