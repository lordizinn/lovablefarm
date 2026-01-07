# 🧅 Usando Tor com Lovable Farm

## 📋 Visão Geral

Este guia explica como configurar e usar a rede Tor para executar os testes do Lovable Farm com privacidade adicional e bypass de restrições de rede/DNS.

## 🎯 Por que usar Tor?

- **Privacidade**: Anonimiza seu tráfego através da rede Tor
- **Bypass de DNS**: Contorna bloqueios de DNS e restrições de rede
- **Múltiplos IPs**: Cada circuito Tor usa um IP diferente
- **Sem custos**: Alternativa gratuita aos serviços de proxy pagos

## 🔧 Instalação do Tor

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y tor
sudo systemctl start tor
sudo systemctl enable tor
```

### macOS
```bash
brew install tor
brew services start tor
```

### Windows
1. Baixe o Tor Browser Bundle de https://www.torproject.org/download/
2. Ou use o Tor Expert Bundle para rodar apenas o serviço

## ⚙️ Configuração

### 1. Edite o arquivo `.env`:
```env
# Habilitar Tor
TOR_ENABLED=true
TOR_SOCKS_HOST=127.0.0.1
TOR_SOCKS_PORT=9050

# Desabilitar proxy regular (opcional)
PROXY_ENABLED=false
```

### 2. Verifique se o Tor está rodando:
```bash
# Verificar status do serviço
sudo systemctl status tor

# Testar conexão
curl --socks5 127.0.0.1:9050 https://check.torproject.org/api/ip
```

### 3. Aguarde o bootstrap do Tor (30-60 segundos):
```bash
# Ver logs do Tor
sudo journalctl -u tor -f

# Procure por "Bootstrapped 100%"
```

## 🚀 Uso

Após configurar, simplesmente execute os testes normalmente:

```bash
# Teste pequeno (10 usuários)
npm run test:small

# Teste médio (100 usuários)
npm run test:medium

# Teste grande (1000 usuários)
npm run test:large
```

O sistema detectará automaticamente que Tor está habilitado e roteará todo o tráfego através dele.

## 📊 Como Funciona

1. **Configuração Automática**: Quando `TOR_ENABLED=true`, o Playwright é configurado para usar o proxy SOCKS5 do Tor
2. **Roteamento**: Todo tráfego do navegador passa pela rede Tor (127.0.0.1:9050)
3. **Anonimização**: Seu IP real fica oculto, usando IPs de saída da rede Tor
4. **DNS sobre Tor**: Resoluções DNS também passam pelo Tor

## 🔍 Logs

Quando Tor está habilitado, você verá:

```
[INFO] 🧅 Usando Tor (SOCKS5 Proxy)
  host: 127.0.0.1
  port: 9050
```

## ⚡ Performance

- **Velocidade**: ~2-3x mais lento que conexão direta
- **Latência**: +100-500ms devido aos saltos na rede Tor
- **Recomendação**: Reduza concorrência para 2-3 usuários simultâneos

```env
# Configuração otimizada para Tor
MAX_CONCURRENT_USERS=3
TIMEOUT_MS=90000
DELAY_BETWEEN_ACTIONS_MS=2000
```

## 🔄 Renovar Circuito Tor

Para obter novo IP:

```bash
# Método 1: Reiniciar serviço
sudo systemctl restart tor

# Método 2: Sinal via control port
echo -e 'AUTHENTICATE ""\nSIGNAL NEWNYM\nQUIT' | nc 127.0.0.1 9051
```

## 🛠️ Troubleshooting

### Tor não conecta
```bash
# Verificar se porta está aberta
netstat -tln | grep 9050

# Ver logs de erro
sudo journalctl -u tor --no-pager | grep -i error

# Reiniciar serviço
sudo systemctl restart tor
```

### Timeouts nos testes
- Aumente `TIMEOUT_MS` no .env para 120000 (2 minutos)
- Reduza `MAX_CONCURRENT_USERS` para 2-3
- Aumente `DELAY_BETWEEN_ACTIONS_MS` para 2000-3000

### Teste manual da conexão
```bash
# Testar com curl
curl --socks5 127.0.0.1:9050 https://check.torproject.org/api/ip

# Verificar IP de saída
curl --socks5 127.0.0.1:9050 https://api.ipify.org
```

## 🔐 Segurança

### ✅ Boas Práticas
- Use Tor para testes legítimos e educacionais
- Respeite rate limits mesmo com Tor
- Não abuse da rede Tor

### ⚠️ Avisos
- Tor não garante 100% de anonimato
- Sites podem detectar e bloquear saídas Tor
- Velocidade reduzida é esperada

## 🆚 Tor vs Proxy Regular

| Característica | Tor | Proxy |
|---------------|-----|-------|
| Custo | Gratuito | Pago (maioria) |
| Velocidade | Lenta (~2-3x) | Rápida |
| Privacidade | Alta (multi-hop) | Média (single-hop) |
| Setup | Fácil | Variável |
| DNS Bypass | ✅ Sim | Depende |
| Detecção | Sites podem bloquear | Menos detectável |

## 📚 Recursos

- [Tor Project](https://www.torproject.org/)
- [Tor FAQ](https://support.torproject.org/faq/)
- [Como Tor Funciona](https://2019.www.torproject.org/about/overview.html.en)
- [Playwright Proxy Docs](https://playwright.dev/docs/network#http-proxy)

## 🔗 Combinando Tor + Proxy

Para máxima privacidade, você pode usar Tor E proxies:

```env
TOR_ENABLED=true
PROXY_ENABLED=true
PROXY_LIST=seu_proxy_aqui
```

Isso cria: `Você → Proxy → Tor → Internet`

---

**Nota**: Este recurso é para fins educacionais e testes legítimos. Use com responsabilidade.
