#!/bin/bash
# Script para testar integração Tor
# Para fins educacionais - reverse engineering do bypass DNS

echo "🧅 Testando Integração Tor - Lovable Farm"
echo "=========================================="
echo ""

# 1. Verificar se Tor está instalado
echo "1. Verificando instalação do Tor..."
if ! command -v tor &> /dev/null; then
    echo "❌ Tor não encontrado. Instalando..."
    sudo apt-get update -qq
    sudo apt-get install -y tor
else
    echo "✅ Tor instalado: $(tor --version | head -1)"
fi

echo ""

# 2. Iniciar serviço Tor
echo "2. Iniciando serviço Tor..."
sudo systemctl start tor 2>/dev/null || echo "Tentando iniciar tor@default..."
sudo systemctl start tor@default 2>/dev/null

sleep 3

# 3. Verificar se está rodando
echo "3. Verificando status do Tor..."
if sudo systemctl is-active --quiet tor@default; then
    echo "✅ Tor está rodando"
    echo ""
    sudo systemctl status tor@default --no-pager | grep -E "Active:|Main PID:" | head -2
else
    echo "⚠️ Tor não está rodando ou ainda inicializando"
fi

echo ""

# 4. Verificar porta SOCKS
echo "4. Verificando porta SOCKS (9050)..."
if netstat -tln 2>/dev/null | grep -q 9050 || ss -tln 2>/dev/null | grep -q 9050; then
    echo "✅ Tor SOCKS proxy está escutando na porta 9050"
else
    echo "❌ Porta 9050 não está aberta"
fi

echo ""

# 5. Testar conexão
echo "5. Testando conexão através do Tor..."
echo "Tentando conectar via SOCKS5 (pode demorar 30-60s na primeira vez)..."

if curl --socks5 127.0.0.1:9050 --connect-timeout 30 --max-time 45 https://check.torproject.org/api/ip 2>/dev/null; then
    echo "✅ Conexão Tor funcionando!"
else
    echo "⚠️ Não foi possível conectar (pode ser restrição de rede)"
fi

echo ""

# 6. Ver logs recentes
echo "6. Logs recentes do Tor:"
echo "----------------------------------------"
sudo journalctl -u tor@default --no-pager -n 10 2>/dev/null | tail -5

echo ""
echo "=========================================="
echo "✨ Teste concluído!"
echo ""
echo "Para usar com Lovable Farm:"
echo "1. Certifique-se que TOR_ENABLED=true no .env"
echo "2. Execute: npm run test:small"
echo "3. Veja os logs para confirmar uso do Tor (🧅 emoji)"
echo ""
echo "Documentação completa: TOR_GUIDE.md"
