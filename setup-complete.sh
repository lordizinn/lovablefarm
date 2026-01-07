#!/bin/bash

# ============================================
# LOVABLE FARM - SETUP AUTOMÁTICO COMPLETO
# ============================================
# Este script configura tudo automaticamente
# Execute: chmod +x setup-complete.sh && ./setup-complete.sh

set -e  # Parar em caso de erro

echo "╔══════════════════════════════════════════════════════╗"
echo "║      🚀 LOVABLE FARM - SETUP AUTOMÁTICO 🚀          ║"
echo "╔══════════════════════════════════════════════════════╗"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logs
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# ============================================
# 1. VERIFICAR PRÉ-REQUISITOS
# ============================================
echo ""
log_info "Verificando pré-requisitos..."
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js não encontrado!"
    log_info "Instale Node.js 18+ de: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node --version)
    log_success "Node.js instalado: $NODE_VERSION"
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    log_error "npm não encontrado!"
    exit 1
else
    NPM_VERSION=$(npm --version)
    log_success "npm instalado: $NPM_VERSION"
fi

# ============================================
# 2. INSTALAR DEPENDÊNCIAS
# ============================================
echo ""
log_info "Instalando dependências do Node.js..."
npm install

log_success "Dependências instaladas!"

# ============================================
# 3. INSTALAR BROWSERS DO PLAYWRIGHT
# ============================================
echo ""
log_info "Instalando browsers do Playwright (pode demorar alguns minutos)..."
npx playwright install chromium

log_success "Browsers instalados!"

# ============================================
# 4. CONFIGURAR ARQUIVO .env
# ============================================
echo ""
log_info "Configurando arquivo .env..."

if [ -f .env ]; then
    log_warning "Arquivo .env já existe!"
    read -p "Deseja sobrescrever? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_info "Mantendo .env existente"
    else
        cp .env.example .env
        log_success "Arquivo .env criado a partir do .env.example"
    fi
else
    cp .env.example .env
    log_success "Arquivo .env criado a partir do .env.example"
fi

# ============================================
# 5. PERGUNTAR SOBRE TOR (OPCIONAL)
# ============================================
echo ""
log_info "Deseja instalar e configurar Tor para bypass de bloqueios?"
echo "  (Recomendado se houver restrições de rede/DNS)"
read -p "Instalar Tor? (s/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Ss]$ ]]; then
    log_info "Instalando Tor..."
    
    # Detectar sistema operacional
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            sudo apt-get update -qq
            sudo apt-get install -y tor
            sudo systemctl start tor
            sudo systemctl enable tor
            log_success "Tor instalado e iniciado (Linux/Debian)"
        elif command -v yum &> /dev/null; then
            sudo yum install -y tor
            sudo systemctl start tor
            sudo systemctl enable tor
            log_success "Tor instalado e iniciado (Linux/RHEL)"
        else
            log_warning "Sistema Linux não suportado automaticamente"
            log_info "Instale manualmente: https://www.torproject.org/download/"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install tor
            brew services start tor
            log_success "Tor instalado e iniciado (macOS)"
        else
            log_warning "Homebrew não encontrado"
            log_info "Instale Homebrew: https://brew.sh/"
            log_info "Depois: brew install tor"
        fi
    else
        log_warning "Sistema operacional não suportado para instalação automática"
        log_info "Baixe Tor manualmente: https://www.torproject.org/download/"
    fi
    
    # Habilitar Tor no .env
    if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sed -i.bak 's/TOR_ENABLED=false/TOR_ENABLED=true/' .env 2>/dev/null || \
        sed -i '' 's/TOR_ENABLED=false/TOR_ENABLED=true/' .env 2>/dev/null || \
        log_warning "Habilite manualmente TOR_ENABLED=true no .env"
        log_info "TOR_ENABLED=true configurado no .env"
    fi
    
    # Aguardar Tor inicializar
    log_info "Aguardando Tor inicializar (10 segundos)..."
    sleep 10
    
    # Verificar se Tor está rodando
    if netstat -tln 2>/dev/null | grep -q 9050 || ss -tln 2>/dev/null | grep -q 9050; then
        log_success "Tor está rodando na porta 9050"
    else
        log_warning "Tor pode não estar rodando corretamente"
        log_info "Verifique com: sudo systemctl status tor"
    fi
else
    log_info "Tor não será instalado (você pode instalar depois)"
fi

# ============================================
# 6. CONFIGURAR LINK DE REFERÊNCIA
# ============================================
echo ""
log_warning "IMPORTANTE: Configure seu link de referência!"
echo ""
echo "  1. Acesse: https://lovable.dev/settings/referrals"
echo "  2. Copie seu link de convite"
echo "  3. Edite o arquivo .env"
echo "  4. Substitua o valor de REFERRAL_LINK pelo seu link"
echo ""
log_info "Exemplo: REFERRAL_LINK=https://lovable.dev/invite/SEUCODIGO"
echo ""

# ============================================
# 7. VALIDAR CONFIGURAÇÃO
# ============================================
echo ""
log_info "Validando configuração..."

# Verificar se .env existe
if [ -f .env ]; then
    log_success "Arquivo .env encontrado"
    
    # Verificar REFERRAL_LINK
    if grep -q "REFERRAL_LINK=https://lovable.dev/invite/" .env; then
        REFERRAL=$(grep "REFERRAL_LINK=" .env | cut -d'=' -f2)
        log_success "REFERRAL_LINK configurado: $REFERRAL"
    else
        log_warning "REFERRAL_LINK não configurado ou inválido"
    fi
    
    # Verificar INBOUND_API_KEY
    if grep -q "INBOUND_API_KEY=" .env && ! grep -q "INBOUND_API_KEY=$" .env; then
        log_success "INBOUND_API_KEY configurado"
    else
        log_warning "INBOUND_API_KEY não configurado"
    fi
else
    log_error "Arquivo .env não encontrado!"
fi

# ============================================
# 8. CRIAR SCRIPT DE INÍCIO RÁPIDO
# ============================================
echo ""
log_info "Criando script de início rápido..."

cat > start.sh << 'EOF'
#!/bin/bash
# Script de início rápido para Lovable Farm

echo "🚀 Iniciando Lovable Farm..."
echo ""
echo "Escolha o tipo de teste:"
echo "  1) Teste pequeno (10 usuários)"
echo "  2) Teste médio (100 usuários)"
echo "  3) Teste grande (1000 usuários)"
echo "  4) Teste customizado"
echo ""
read -p "Opção [1-4]: " -n 1 -r
echo ""

case $REPLY in
    1)
        echo "Executando teste pequeno..."
        npm run test:small
        ;;
    2)
        echo "Executando teste médio..."
        npm run test:medium
        ;;
    3)
        echo "Executando teste grande..."
        npm run test:large
        ;;
    4)
        read -p "Número de usuários: " users
        read -p "Concorrência (padrão 5): " concurrent
        concurrent=${concurrent:-5}
        echo "Executando teste customizado..."
        node src/index.js --users=$users --concurrent=$concurrent
        ;;
    *)
        echo "Opção inválida!"
        exit 1
        ;;
esac
EOF

chmod +x start.sh
log_success "Script start.sh criado"

# ============================================
# 9. RESUMO E PRÓXIMOS PASSOS
# ============================================
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║            ✓ SETUP CONCLUÍDO COM SUCESSO!           ║"
echo "╔══════════════════════════════════════════════════════╗"
echo ""
log_success "Tudo está configurado e pronto para usar!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "  1️⃣  Configure seu link de referência no arquivo .env:"
echo "      ${YELLOW}nano .env${NC}  ou  ${YELLOW}vim .env${NC}"
echo "      Substitua: REFERRAL_LINK=https://lovable.dev/invite/SEUCODIGO"
echo ""
echo "  2️⃣  Execute um teste:"
echo "      ${GREEN}./start.sh${NC}             # Menu interativo"
echo "      ${GREEN}npm run test:small${NC}     # 10 usuários"
echo "      ${GREEN}npm run test:medium${NC}    # 100 usuários"
echo "      ${GREEN}npm run test:large${NC}     # 1000 usuários"
echo ""
echo "  3️⃣  Veja os relatórios em:"
echo "      ${BLUE}reports/${NC}"
echo ""
echo "📚 DOCUMENTAÇÃO:"
echo "  • README.md - Visão geral completa"
echo "  • QUICKSTART.md - Guia de início rápido"
echo "  • TOR_GUIDE.md - Como usar Tor"
echo "  • ENV_CONFIG.md - Detalhes das configurações"
echo ""
echo "🆘 AJUDA:"
echo "  • FAQ.md - Perguntas frequentes"
echo "  • TROUBLESHOOTING em SETUP.md"
echo ""
log_info "Para mais informações, consulte a documentação!"
echo ""
