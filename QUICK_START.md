# 🚀 INÍCIO RÁPIDO - LOVABLE FARM

## ⚡ Setup em 3 Comandos (Linux/macOS)

```bash
# 1. Clone o repositório
git clone https://github.com/lordizinn/lovablefarm.git
cd lovablefarm

# 2. Execute o setup automático
chmod +x setup-complete.sh
./setup-complete.sh

# 3. Configure seu link de referência e rode!
nano .env  # Edite REFERRAL_LINK com seu código
npm run test:small
```

Pronto! 🎉

---

## 📦 O que o setup automático faz?

✅ Instala todas as dependências npm  
✅ Instala browsers do Playwright  
✅ Cria arquivo .env com configurações prontas  
✅ Opcionalmente instala e configura Tor  
✅ Cria script de início rápido (start.sh)  
✅ Valida toda a configuração  

---

## 🎯 Usando o Projeto

### Opção 1: Menu Interativo
```bash
./start.sh
```
Escolha o tipo de teste no menu!

### Opção 2: Comandos Diretos
```bash
npm run test:small    # 10 usuários
npm run test:medium   # 100 usuários  
npm run test:large    # 1000 usuários
```

### Opção 3: Customizado
```bash
node src/index.js --users=50 --concurrent=10
```

---

## ⚙️ Configuração Essencial

### Obtenha seu Link de Referência

1. Acesse: https://lovable.dev/settings/referrals
2. Copie seu link de convite
3. Edite `.env`:
```bash
nano .env
```
4. Substitua:
```env
REFERRAL_LINK=https://lovable.dev/invite/SEUCODIGO
```

### Configurações Recomendadas

#### Para Desenvolvimento/Debug:
```env
HEADLESS=false           # Ver o navegador
SLOW_MO=500             # Ações mais lentas
DEBUG_MODE=true         # Mais logs
MAX_CONCURRENT_USERS=1  # Um por vez
```

#### Para Produção:
```env
HEADLESS=true           # Sem interface
SLOW_MO=0              # Velocidade normal
DEBUG_MODE=false       # Logs normais
MAX_CONCURRENT_USERS=5 # 5 simultâneos
```

#### Com Tor (Bypass DNS):
```env
TOR_ENABLED=true       # Usar Tor
HEADLESS=true
MAX_CONCURRENT_USERS=3 # Menos por ser mais lento
TIMEOUT_MS=90000       # Timeout maior
```

---

## 🧅 Usando Tor (Opcional)

### Por que usar Tor?
- Contorna bloqueios de DNS
- Anonimiza seu IP
- Gratuito

### Setup Rápido:

**Linux:**
```bash
sudo apt-get install tor
sudo systemctl start tor
```

**macOS:**
```bash
brew install tor
brew services start tor
```

**Configurar no .env:**
```env
TOR_ENABLED=true
```

Veja [TOR_GUIDE.md](TOR_GUIDE.md) para detalhes completos.

---

## 📊 Visualizando Resultados

### Relatórios são salvos em `reports/`

```bash
# Ver último relatório em texto
cat reports/report-*.txt | tail -100

# Ver todos os JSONs
ls -lah reports/*.json
```

### O que esperar:

```
═══════════════════════════════════════════════════════
           LOVABLE REFERRAL TEST REPORT
═══════════════════════════════════════════════════════

📊 RESUMO
─────────────────────────────────────────────────────
Total de Usuários:       10
✅ Sucessos:             8
❌ Falhas:               2
📈 Taxa de Sucesso:      80.00%
💰 Total de Créditos:    80
⏱️  Tempo de Execução:    5m 30s
```

---

## 🔧 Troubleshooting Rápido

### Erro: "REFERRAL_LINK não configurado"
**Solução:** Edite `.env` e configure `REFERRAL_LINK`

### Erro: "net::ERR_NAME_NOT_RESOLVED"
**Solução:** 
- Verifique sua conexão com internet
- OU use Tor: `TOR_ENABLED=true` no `.env`

### Erro: "Browsers not installed"
**Solução:**
```bash
npx playwright install chromium
```

### Erro: Timeouts constantes
**Solução:** Aumente timeout no `.env`:
```env
TIMEOUT_MS=120000  # 2 minutos
```

### Tor não conecta
**Solução:**
```bash
# Verificar se está rodando
sudo systemctl status tor

# Reiniciar
sudo systemctl restart tor

# Ver logs
sudo journalctl -u tor -f
```

---

## 📂 Estrutura do Projeto

```
lovablefarm/
├── .env.example          # Template de configuração
├── setup-complete.sh     # Setup automático ⭐
├── start.sh             # Menu de início rápido
├── package.json         # Dependências
├── src/
│   ├── index.js         # Orquestrador principal
│   ├── automation/      # Fluxos automatizados
│   ├── services/        # Serviços (email, proxy)
│   └── utils/           # Utilidades e config
├── reports/             # Relatórios gerados
├── config/              # Configurações adicionais
└── docs/                # Documentação completa
```

---

## 📚 Documentação Completa

- **[README.md](README.md)** - Visão geral completa
- **[ENV_CONFIG.md](ENV_CONFIG.md)** - Todas as configurações
- **[TOR_GUIDE.md](TOR_GUIDE.md)** - Guia completo do Tor
- **[SETUP.md](SETUP.md)** - Setup detalhado
- **[FAQ.md](FAQ.md)** - Perguntas frequentes
- **[EXAMPLES.md](EXAMPLES.md)** - Exemplos de uso

---

## 🆘 Precisa de Ajuda?

1. **Consulte [FAQ.md](FAQ.md)** - Respostas para perguntas comuns
2. **Veja exemplos em [EXAMPLES.md](EXAMPLES.md)**
3. **Leia a documentação completa em [INDEX.md](INDEX.md)**

---

## 🎓 Exemplos Práticos

### Teste com 1 usuário (debug)
```bash
node src/index.js --users=1
```

### Teste com Tor habilitado
```bash
# 1. Edite .env
echo "TOR_ENABLED=true" >> .env

# 2. Rode
npm run test:small
```

### Teste customizado
```bash
node src/index.js --users=25 --concurrent=5
```

---

## ✨ Pronto para começar!

Execute agora:
```bash
./setup-complete.sh
```

E depois:
```bash
./start.sh
```

Boa sorte! 🚀
