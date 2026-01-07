# 🚀 Lovable Referral Tester

Sistema automatizado de testes em escala para validar plataforma de indicação (referral system).

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Playwright](https://img.shields.io/badge/playwright-1.48.0-45ba4b.svg)](https://playwright.dev/)
[![ProxiedMail](https://img.shields.io/badge/ProxiedMail-API-blue.svg)](https://proxiedmail.com)

> **👋 Novo por aqui?** Comece pelo **[QUICK_START.md](QUICK_START.md)** - Setup em 3 comandos!

---

## 📚 Documentação

> **📑 [Índice Completo de Documentação](INDEX.md)** - Navegue por todos os documentos

### 🚀 Começando

- **[⚡ QUICK_START.md](QUICK_START.md)** - **Setup em 3 comandos! (COMECE AQUI)**
- **[👋 Boas-Vindas](WELCOME.md)** - Tour completo do sistema
- **[⚡ Guia Rápido (5 minutos)](QUICKSTART.md)** - Início rápido alternativo

### 🔧 Configuração

- **[🔐 Configuração de Variáveis](ENV_CONFIG.md)** - Guia completo do .env
- **[🧅 TOR_GUIDE.md](TOR_GUIDE.md)** - Como usar Tor para bypass DNS
- **[🔧 Setup Detalhado](SETUP.md)** - Instalação e configuração completa

### 📖 Uso e Referência

- **[📖 Exemplos de Uso](EXAMPLES.md)** - Casos de uso práticos
- **[🎮 Comandos](COMMANDS.md)** - Referência de comandos
- **[❓ FAQ](FAQ.md)** - Perguntas frequentes

### 🏗️ Técnico

- **[📧 Monitoramento de Emails](EMAIL_MONITORING.md)** - Como funciona o sistema de emails
- **[✅ Regras de Validação](VALIDATION_RULES.md)** - Validação rigorosa de links de verificação
- **[🚀 Fluxo Lovable Completo](LOVABLE_FLOW.md)** - Automação completa do fluxo na plataforma
- **[🏗️ Arquitetura](ARCHITECTURE.md)** - Como o sistema funciona

### 📋 Gestão

- **[📦 Resumo do Projeto](PROJECT_SUMMARY.md)** - Visão geral completa
- **[📋 Resumo Executivo](EXECUTIVE_SUMMARY.md)** - Para gestores
- **[🤝 Contribuir](CONTRIBUTING.md)** - Como contribuir

---

## 📋 O que este projeto faz

Simula usuários reais completando todo o fluxo de cadastro via link de indicação:

1. ✅ Acessa link de indicação
2. ✅ Cria conta com email temporário único
3. ✅ Recebe e confirma código de verificação por email
4. ✅ Responde quiz de onboarding
5. ✅ Abre projeto template
6. ✅ Remixa o projeto
7. ✅ Publica o projeto
8. ✅ Valida que o usuário A recebeu os créditos

## 🎯 Características

- **Setup Automático**: Script `setup-complete.sh` configura tudo em um comando
- **Configuração Pronta**: Arquivo `.env.example` com todas as opções documentadas
- **Integração Tor**: Bypass de bloqueios DNS com suporte completo à rede Tor
- **Menu Interativo**: Script `start.sh` para escolher tipo de teste facilmente
- **Emails realistas**: Nomes brasileiros + números aleatórios (ex: `joao.silva1234@funcionariosdeia.com`)
- **Domínios customizados**: Alterna entre `funcionariosdeia.com` e `pixelhausia.com`
- **Monitoramento automático**: Sistema monitora chegada de emails e clica no link de verificação
- **IPs distintos**: Suporte para proxies e rotação de IP
- **Execução em escala**: Teste com 10, 100, 1000+ usuários
- **Totalmente automatizado**: Zero intervenção manual
- **Relatórios detalhados**: Métricas e logs de cada execução

---

## ⚡ Setup Automático (RECOMENDADO)

```bash
# Clone o repositório
git clone https://github.com/lordizinn/lovablefarm.git
cd lovablefarm

# Execute o setup completo (tudo automático!)
chmod +x setup-complete.sh
./setup-complete.sh

# Configure seu link de referência
nano .env  # Edite REFERRAL_LINK

# Pronto! Execute os testes
./start.sh  # Menu interativo
```

✅ **O script automático instala e configura TUDO:**
- Dependências npm
- Browsers Playwright
- Arquivo .env pronto
- Tor (opcional)
- Scripts de início rápido

📖 **[Ver guia completo →](QUICK_START.md)**

---

## 🛠️ Instalação Manual (alternativa)

```bash
# Tudo em um comando
npm run setup

# Ou passo a passo:
npm install
npm run install:browsers
cp .env.example .env
```

**Importante**: Edite o arquivo `.env` e configure seu `REFERRAL_LINK`!

📖 **[Ver guia completo de instalação →](SETUP.md)**

## ⚙️ Configuração

Edite o arquivo `.env`:

```env
# URL da plataforma
LOVABLE_BASE_URL=https://lovable.dev

# Link de indicação (OBRIGATÓRIO)
REFERRAL_LINK=https://lovable.dev/ref/SEU_CODIGO_AQUI

# Configurações opcionais
MAX_CONCURRENT_USERS=5
HEADLESS=true
```

## 🚀 Uso

```bash
# Teste pequeno (10 usuários)
npm run test:small

# Teste médio (100 usuários)
npm run test:medium

# Teste grande (1000 usuários)
npm run test:large

# Personalizado
node src/index.js --users=50 --concurrent=10
```

## 📊 Relatórios

Os relatórios são salvos em `reports/` com:

- Taxa de sucesso
- Tempo médio por etapa
- Erros encontrados
- Créditos gerados

## 🔧 Arquitetura

```text
src/
├── index.js              # Ponto de entrada
├── services/
│   ├── emailService.js   # Gerenciamento de emails temporários
│   ├── proxyService.js   # Rotação de IPs
│   └── reportService.js  # Geração de relatórios
├── automation/
│   ├── userFlow.js       # Fluxo completo do usuário
│   ├── signup.js         # Cadastro e verificação
│   ├── onboarding.js     # Quiz e setup inicial
│   └── project.js        # Criação e publicação de projeto
└── utils/
    ├── config.js         # Configurações
    └── logger.js         # Sistema de logs
```

## 🔐 Segurança

- Nunca commite o arquivo `.env`
- Use proxies confiáveis
- Respeite rate limits da plataforma

## 📝 Notas Importantes

- ✅ Sistema de emails proxy via [ProxiedMail](https://proxiedmail.com) já configurado
- ✅ Para rotação de IP real, configure proxies no `.env`
- ✅ Delays realistas estão implementados para simular comportamento humano
- ⚠️ Sempre comece com testes pequenos (10 usuários) antes de escalar
- ⚠️ Use proxies em produção para evitar bloqueios
- ⚠️ Respeite os rate limits da plataforma

## 🎯 Métricas de Sucesso

- **Taxa de sucesso > 90%**: Excelente ✅
- **Taxa de sucesso 70-90%**: Bom, mas pode melhorar ⚠️
- **Taxa de sucesso < 70%**: Investigar problemas ❌

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja o [guia de contribuição](CONTRIBUTING.md).

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- [Playwright](https://playwright.dev/) - Automação de navegador
- [ProxiedMail](https://proxiedmail.com) - Sistema de emails proxy ([GitHub](https://github.com/proxied-mail))
- Comunidade open source

## ⚠️ Aviso Legal

Este sistema é para **testes internos** da sua própria plataforma. Use com responsabilidade:

- ✅ Testar sua própria plataforma
- ✅ Validar sistema de indicação
- ✅ Stress testing
- ❌ Não use para fraude
- ❌ Não abuse de plataformas de terceiros

---

### Desenvolvido com ❤️ para testes de qualidade em escala
