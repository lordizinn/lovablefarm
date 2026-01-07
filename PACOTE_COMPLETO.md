# 📦 PACOTE COMPLETO - LOVABLE FARM

## 🎯 O que você tem agora

Este repositório está **100% configurado e pronto para usar**. Baixe, configure seu link de referência e execute!

---

## ⚡ Setup em 3 Comandos

```bash
# 1. Clone
git clone https://github.com/lordizinn/lovablefarm.git
cd lovablefarm

# 2. Execute o setup automático
chmod +x setup-complete.sh
./setup-complete.sh

# 3. Configure seu link e execute
nano .env  # Edite REFERRAL_LINK
./start.sh
```

**Pronto!** 🎉

---

## 📋 O que está incluído

### 🔧 Scripts Automáticos

| Arquivo | Descrição |
|---------|-----------|
| `setup-complete.sh` | Setup completo automático - instala tudo |
| `start.sh` | Menu interativo para escolher tipo de teste |
| `test-tor.sh` | Validar instalação e funcionamento do Tor |

### ⚙️ Configuração

| Arquivo | Descrição |
|---------|-----------|
| `.env.example` | Template completo com todos os valores configurados |
| Apenas copie para `.env` e ajuste seu link de referência |

### 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| `QUICK_START.md` | **Comece aqui!** Setup em 3 comandos |
| `TOR_GUIDE.md` | Guia completo para usar Tor |
| `README.md` | Visão geral do projeto |
| `ENV_CONFIG.md` | Detalhes de todas as configurações |
| `FAQ.md` | Perguntas frequentes |

---

## 🚀 O que o setup-complete.sh faz

Quando você roda `./setup-complete.sh`, o script:

✅ **1. Verifica pré-requisitos**
- Checa se Node.js está instalado
- Checa se npm está instalado

✅ **2. Instala dependências**
- `npm install` - Todas as dependências Node.js
- `npx playwright install chromium` - Browser para automação

✅ **3. Configura .env**
- Copia `.env.example` para `.env`
- Pergunta se deseja sobrescrever caso já exista

✅ **4. Tor (Opcional)**
- Pergunta se deseja instalar Tor
- Detecta seu sistema operacional
- Instala Tor (Linux: apt-get, macOS: brew)
- Inicia serviço do Tor
- Configura `TOR_ENABLED=true` no .env
- Valida que está rodando

✅ **5. Valida configuração**
- Verifica se .env existe
- Valida REFERRAL_LINK
- Valida INBOUND_API_KEY

✅ **6. Cria script start.sh**
- Menu interativo para escolher tipo de teste
- Pronto para usar!

✅ **7. Mostra próximos passos**
- Instruções claras do que fazer

---

## 📝 Único passo manual: REFERRAL_LINK

Depois do setup automático, você precisa apenas:

```bash
# Edite o arquivo .env
nano .env

# Ou use seu editor preferido
vim .env
code .env
```

Encontre a linha:
```env
REFERRAL_LINK=https://lovable.dev/invite/3DNDOWZ
```

Substitua `3DNDOWZ` pelo **seu código de referência**.

Para obter seu código:
1. Acesse: https://lovable.dev/settings/referrals
2. Copie seu link de convite
3. Cole no .env

---

## 🎮 Como executar os testes

### Opção 1: Menu Interativo (RECOMENDADO)
```bash
./start.sh
```
Escolha entre:
- Teste pequeno (10 usuários)
- Teste médio (100 usuários)
- Teste grande (1000 usuários)
- Teste customizado

### Opção 2: Comandos diretos
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

## 🧅 Sobre o Tor

**O que é?**
- Rede de anonimato que permite bypass de bloqueios DNS
- Gratuito e open source

**Quando usar?**
- Se seu ambiente bloqueia `lovable.dev`
- Se deseja anonimizar seu IP
- Se está em rede com restrições

**Como funciona?**
1. Setup automático pergunta se deseja instalar
2. Se sim, instala e configura tudo
3. Você só precisa executar normalmente

**Manual:**
```bash
# Linux
sudo apt-get install tor
sudo systemctl start tor

# macOS
brew install tor
brew services start tor

# Configurar no .env
TOR_ENABLED=true
```

---

## 📊 Relatórios

Todos os testes geram relatórios em `reports/`:

```
reports/
├── report-2026-01-07T13-00-00-000Z.json  # JSON detalhado
└── report-2026-01-07T13-00-00-000Z.txt   # Texto legível
```

**Ver último relatório:**
```bash
cat reports/report-*.txt | tail -100
```

---

## 🔧 Configurações Pré-Definidas

O `.env.example` já vem com configurações funcionais:

| Configuração | Valor Padrão | Descrição |
|--------------|--------------|-----------|
| `REFERRAL_LINK` | 3DNDOWZ | **Você deve substituir!** |
| `INBOUND_API_KEY` | Configurado | API de email funcionando |
| `TOR_ENABLED` | false | Habilite se precisar |
| `HEADLESS` | true | Navegador sem interface |
| `MAX_CONCURRENT_USERS` | 5 | 5 usuários simultâneos |
| `TIMEOUT_MS` | 60000 | Timeout de 60 segundos |

**Exemplos de configuração em `.env.example`:**
- Desenvolvimento/Debug
- Produção sem Tor
- Produção com Tor
- Teste em escala

---

## 🆘 Troubleshooting Rápido

### Erro: "REFERRAL_LINK não configurado"
```bash
nano .env  # Edite e configure seu link
```

### Erro: "net::ERR_NAME_NOT_RESOLVED" ou "net::ERR_TIMED_OUT"
```bash
# Solução: Use Tor
nano .env
# Mude: TOR_ENABLED=true

# Instale Tor se não tiver
sudo apt-get install tor  # Linux
brew install tor          # macOS
```

### Erro: "Browsers not installed"
```bash
npx playwright install chromium
```

### Tor não conecta
```bash
# Verificar status
sudo systemctl status tor

# Reiniciar
sudo systemctl restart tor

# Ver logs
sudo journalctl -u tor -f
```

---

## 📁 Estrutura do Projeto

```
lovablefarm/
├── 🔧 setup-complete.sh     # Setup automático ⭐
├── 🎮 start.sh              # Menu de testes (criado pelo setup)
├── 🧅 test-tor.sh           # Testar Tor
├── ⚙️  .env.example          # Configuração pronta
├── 📚 QUICK_START.md        # Guia de 3 comandos
├── 📖 TOR_GUIDE.md          # Guia Tor completo
├── 📋 README.md             # Documentação principal
├── 📦 package.json          # Dependências
├── 🗂️  src/                  # Código fonte
│   ├── index.js            # Orquestrador
│   ├── automation/         # Fluxos automatizados
│   ├── services/           # Serviços (email, proxy)
│   └── utils/              # Utilidades
├── 📊 reports/              # Relatórios (criado ao executar)
└── ⚙️  config/               # Configurações

Legenda:
⭐ = Comece aqui!
🔧 = Scripts úteis
📚 = Documentação essencial
🗂️  = Código
```

---

## 🎓 Exemplos Práticos

### Debug: Ver o que está acontecendo
```bash
# Edite .env
HEADLESS=false
SLOW_MO=500
DEBUG_MODE=true

# Execute 1 usuário
node src/index.js --users=1
```

### Produção: Máxima velocidade
```bash
# .env já configurado para isso!
npm run test:small
```

### Com Tor: Bypass de bloqueios
```bash
# .env
TOR_ENABLED=true
MAX_CONCURRENT_USERS=3
TIMEOUT_MS=90000

npm run test:small
```

---

## ✨ Vantagens desta Configuração

| Antes | Agora |
|-------|-------|
| ❌ Setup manual ~30min | ✅ Setup automático ~5min |
| ❌ Configurar 20+ variáveis | ✅ Configurar apenas 1 (link) |
| ❌ Instalar Tor manualmente | ✅ Setup pergunta e instala |
| ❌ Criar scripts de teste | ✅ Menu interativo pronto |
| ❌ Ler docs para configurar | ✅ Valores funcionais pré-definidos |

---

## 🎯 Checklist Final

Antes de executar os testes, verifique:

- [ ] Executou `./setup-complete.sh`
- [ ] Configurou `REFERRAL_LINK` no `.env`
- [ ] Se necessário, instalou Tor
- [ ] Tem conexão com internet (ou Tor configurado)

Pronto! Execute `./start.sh` ou `npm run test:small`

---

## 📞 Suporte

- 📖 **QUICK_START.md** - Início rápido
- 🧅 **TOR_GUIDE.md** - Problemas com Tor
- ❓ **FAQ.md** - Perguntas comuns
- 📋 **README.md** - Visão geral completa

---

**Desenvolvido com ❤️ para facilitar sua vida!**

Tudo configurado, documentado e pronto para usar. 🚀
