import { chromium } from 'playwright';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import { emailService } from '../services/emailService.js';
import { proxyService } from '../services/proxyService.js';
import { signupOnLovable, verifyEmailInSameSession, completeOnboardingQuiz, selectTemplate, useTemplateAndPublish, fallbackToTemplate } from './lovableFlow.js';
import os from 'os';
import path from 'path';
import fs from 'fs';

/**
 * Executa o fluxo completo de um usuário
 * @param {number} userId - ID do usuário
 * @param {string} referralLink - Link de indicação (obrigatório)
 * @param {string} domain - Domínio específico para o email (opcional)
 * @param {string} proxyString - Proxy específico para usar (opcional)
 * @param {Array} simulatedErrors - Lista de erros a simular para testar fallbacks (opcional)
 * @param {boolean} turboMode - Se true, pula quiz e seleção de template, vai direto para fallback (opcional)
 * @param {boolean} checkCreditsBanner - Se true, verifica banner de créditos no editor antes de publicar (só funciona com turboMode) (opcional)
 * @param {boolean} enableConcurrentRequests - Se true, ativa teste de requisições simultâneas (opcional)
 * @param {number} concurrentRequests - Número de requisições simultâneas a fazer (padrão: 100) (opcional)
 */
export async function executeUserFlow(userId, referralLink, domain = null, proxyString = null, simulatedErrors = [], turboMode = false, checkCreditsBanner = false, enableConcurrentRequests = false, concurrentRequests = 100) {
  const startTime = Date.now();
  const result = {
    userId,
    success: false,
    email: null,
    steps: {},
    error: null,
    executionTime: 0
  };

  let context = null;
  let page = null;
  let tempDir = null;

  // Validar link de indicação
  if (!referralLink) {
    throw new Error('Link de indicação é obrigatório');
  }

  try {
    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`🚀 Iniciando fluxo do usuário ${userId}`);
    if (domain) logger.info(`📧 Usando domínio específico: ${domain}`);
    logger.info(`${'='.repeat(60)}\n`);

    // 1. Gerar email temporário único (com domínio específico se fornecido)
    logger.info('📧 Gerando email temporário...');
    const emailData = await emailService.generateEmail(userId, domain);
    result.email = emailData.email;
    logger.success(`Email gerado: ${emailData.email}`);

    // 2. Configurar proxy (usar proxy específico se fornecido, senão tentar obter um)
    let finalProxyString = proxyString;
    let torProxy = null;
    
    // Se Tor está habilitado, configure-o como proxy
    if (config.torEnabled && !finalProxyString) {
      torProxy = {
        server: `socks5://${config.torSocksHost}:${config.torSocksPort}`
      };
      logger.info('🧅 Usando Tor (SOCKS5 Proxy)', {
        host: config.torSocksHost,
        port: config.torSocksPort
      });
    }
    
    if (!finalProxyString && !torProxy && config.proxyEnabled) {
      finalProxyString = proxyService.getRandomProxy();
    }
    const proxyConfig = finalProxyString ? proxyService.getProxyConfig(finalProxyString) : torProxy;
    const usingProxy = !!proxyConfig;
    
    if (proxyConfig) {
      logger.info('🌐 Usando proxy', { 
        proxy: proxyConfig.server,
        hasAuth: !!(proxyConfig.username && proxyConfig.password)
      });
      logger.info('⏱️ Timeouts aumentados para navegação com proxy');
    } else {
      logger.info('🌐 Usando IP local (sem proxy)');
    }

    // 3. Criar diretório temporário único (simula modo incógnito isolado)
    tempDir = path.join(os.tmpdir(), `playwright-incognito-${userId}-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    logger.info(`📁 Diretório temporário: ${tempDir}`);

    // 4. Iniciar navegador em MODO INCÓGNITO REAL (launchPersistentContext)
    logger.info('🌐 Iniciando navegador em MODO INCÓGNITO REAL...');
    
    const contextOptions = {
      headless: config.headless,
      args: [
        '--incognito'  // APENAS modo anônimo básico
      ]
    };

    if (proxyConfig) {
      contextOptions.proxy = proxyConfig;
    }

    // ✅ USAR launchPersistentContext (modo incógnito REAL)
    context = await chromium.launchPersistentContext(tempDir, contextOptions);
    
    logger.info('✅ Contexto criado em modo incógnito (via --incognito flag)');
    
    // Fechar páginas extras que possam ter sido abertas
    const pages = context.pages();
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close().catch(() => {});
    }
    
    // SEM scripts - navegador 100% nativo

    // ✅ USAR a página que já foi criada automaticamente
    page = context.pages()[0] || await context.newPage();
    
    logger.info(`✅ Navegador anônimo iniciado (${context.pages().length} página)`);

    // 4. Realizar cadastro na Lovable
    logger.info('\n📝 Etapa 1: Cadastro na Lovable');
    logger.info(`🔗 Usando link de indicação: ${referralLink}`);
    const password = generateRandomPassword();
    
    // Salvar credenciais no resultado para o dashboard
    result.credentials = {
      email: emailData.email,
      password: password
    };
    
    const signupResult = await signupOnLovable(page, emailData.email, password, userId, referralLink, usingProxy);
    result.steps.signup = signupResult.executionTime;

    // 5. Aguardar email de verificação
    logger.info('\n📬 Etapa 2: Aguardando Email de Verificação');
    const verificationEmail = await emailService.waitForVerificationEmail(
      emailData, // Passa o objeto completo com email, proxyId, etc
      5, // 5 tentativas × 3s = 15s total
      3000 // 3 segundos entre tentativas
    );
    
    // 6. Extrair link de verificação com fallback
    let verificationLink;
    try {
      verificationLink = emailService.extractVerificationLink(verificationEmail);
    } catch (linkError) {
      logger.error('❌ Erro ao extrair link de verificação:', linkError.message);
      // Se não encontrou o link, fazer fallback para template (como se a verificação tivesse falhado)
      logger.warning('⚠️ Link de verificação não encontrado no email. Fazendo fallback para template...');
      await fallbackToTemplate(page, userId, usingProxy);
      result.steps.emailVerification = 0; // Marcado como pulado (fallback usado)
      
      // Continuar fluxo a partir do template (independente do modo)
      if (turboMode) {
        result.steps.onboardingQuiz = 0; // Marcado como pulado
        result.steps.selectTemplate = 0; // Marcado como pulado
        logger.info('\n🚀 Etapa 6: Usando Template e Publicando (Modo Turbo - Fallback)');
        const publishResult = await useTemplateAndPublish(page, userId, usingProxy, simulatedErrors, checkCreditsBanner);
        result.steps.useTemplateAndPublish = publishResult.executionTime;
        
        // Se a publicação falhou (ex: banner não encontrado), marcar como falha mas não lançar erro
        // O projeto foi publicado, mas não encontrou o banner, então é uma falha
        if (!publishResult.success) {
          result.success = false;
          result.error = publishResult.error || 'Erro ao publicar projeto';
          result.failedStep = 'Banner de Créditos no Editor';
          logger.warning(`⚠️ Publicação concluída, mas marcada como falha: ${result.error}`);
          return result;
        }
      } else {
        // Modo normal: continuar com quiz e depois publicar
        logger.info('\n📝 Etapa 4: Completando Quiz de Onboarding (Fallback)');
        const quizResult = await completeOnboardingQuiz(page, userId, emailData.email, usingProxy);
        result.steps.onboardingQuiz = quizResult.executionTime;
        
        logger.info('\n🎨 Etapa 5: Seleção de Template (já no template via fallback)');
        result.steps.selectTemplate = 0; // Já estamos no template
        
        logger.info('\n🚀 Etapa 6: Usando Template e Publicando (Fallback)');
        const publishResult = await useTemplateAndPublish(page, userId, usingProxy, simulatedErrors, false);
        result.steps.useTemplateAndPublish = publishResult.executionTime;
        
        // Se a publicação falhou (ex: banner não encontrado), marcar como falha mas não lançar erro
        // O projeto foi publicado, mas não encontrou o banner, então é uma falha
        if (!publishResult.success) {
          result.success = false;
          result.error = publishResult.error || 'Erro ao publicar projeto';
          result.failedStep = 'Banner de Créditos no Editor';
          logger.warning(`⚠️ Publicação concluída, mas marcada como falha: ${result.error}`);
          return result;
        }
      }
      
      // Marcar como sucesso após fallback
      result.success = true;
      result.creditsEarned = 10;
      result.executionTime = Date.now() - startTime;
      logger.success(`✅ Usuário ${userId} completou via fallback após erro no link!`);
      return result;
    }
    
    // 6. Clicar no link de verificação NA MESMA SESSÃO
    logger.info('\n✅ Etapa 3: Clicando em Link de Verificação (mesma sessão)');
    const verifyResult = await verifyEmailInSameSession(page, verificationLink, userId, usingProxy);
    result.steps.emailVerification = verifyResult.executionTime;

    // Se modo turbo está ativo, pular quiz e seleção de template, ir direto para fallback
    if (turboMode) {
      logger.info('\n⚡ Modo Turbo ativo: Pulando quiz e seleção de template, indo direto para template fallback');
      await fallbackToTemplate(page, userId, usingProxy);
      result.steps.onboardingQuiz = 0; // Marcado como pulado
      result.steps.selectTemplate = 0; // Marcado como pulado
      
      // 9. Usar template e publicar (já estamos no template após o fallback)
      logger.info('\n🚀 Etapa 6: Usando Template e Publicando (Modo Turbo)');
      const publishResult = await useTemplateAndPublish(page, userId, usingProxy, simulatedErrors, checkCreditsBanner, enableConcurrentRequests, concurrentRequests);
      result.steps.useTemplateAndPublish = publishResult.executionTime;
      
      // Se a publicação falhou (ex: banner não encontrado), marcar como falha mas não lançar erro
      // O projeto foi publicado, mas não encontrou o banner, então é uma falha
      if (!publishResult.success) {
        result.success = false;
        result.error = publishResult.error || 'Erro ao publicar projeto';
        result.failedStep = 'Banner de Créditos no Editor';
        logger.warning(`⚠️ Publicação concluída, mas marcada como falha: ${result.error}`);
        return result;
      }
    } else {
      // Modo normal: completar todas as etapas
      // 7. Completar quiz de onboarding
      logger.info('\n📝 Etapa 4: Completando Quiz de Onboarding');
      const quizResult = await completeOnboardingQuiz(page, userId, emailData.email, usingProxy);
      result.steps.onboardingQuiz = quizResult.executionTime;

      // 8. Selecionar template
      logger.info('\n🎨 Etapa 5: Selecionando Template');
      const templateResult = await selectTemplate(page, userId, usingProxy, simulatedErrors);
      result.steps.selectTemplate = templateResult.executionTime;

      // 9. Usar template e publicar
      logger.info('\n🚀 Etapa 6: Usando Template e Publicando');
      const publishResult = await useTemplateAndPublish(page, userId, usingProxy, simulatedErrors, false, enableConcurrentRequests, concurrentRequests); // checkCreditsBanner só funciona com turboMode
      result.steps.useTemplateAndPublish = publishResult.executionTime;
      
      // Se a publicação falhou (ex: banner não encontrado), marcar como falha mas não lançar erro
      // O projeto foi publicado, mas não encontrou o banner, então é uma falha
      if (!publishResult.success) {
        result.success = false;
        result.error = publishResult.error || 'Erro ao publicar projeto';
        result.failedStep = 'Banner de Créditos no Editor';
        logger.warning(`⚠️ Publicação concluída, mas marcada como falha: ${result.error}`);
        return result;
      }
    }

    // 10. Sucesso!
    result.success = true;
    result.creditsEarned = 10; // Assumindo 10 créditos por indicação
    result.executionTime = Date.now() - startTime;

    logger.info(`\n${'='.repeat(60)}`);
    logger.success(`✅ Usuário ${userId} completou o fluxo com sucesso!`);
    logger.success(`💰 Créditos gerados: ${result.creditsEarned}`);
    logger.success(`⏱️  Tempo total: ${result.executionTime}ms`);
    logger.info(`${'='.repeat(60)}\n`);

  } catch (error) {
    result.success = false;
    result.error = error.message || 'Erro desconhecido';
    result.executionTime = Date.now() - startTime;
    
    // Determinar qual etapa falhou
    if (!result.steps.signup) {
      result.failedStep = 'Cadastro';
    } else if (!result.steps.emailVerification) {
      result.failedStep = 'Verificação de Email';
    } else if (!result.steps.onboardingQuiz) {
      result.failedStep = 'Quiz de Onboarding';
    } else if (!result.steps.selectTemplate) {
      result.failedStep = 'Seleção de Template';
    } else if (!result.steps.useTemplateAndPublish) {
      result.failedStep = 'Usar Template / Publicar';
    } else {
      result.failedStep = 'Desconhecida';
    }

    logger.error(`❌ Usuário ${userId} falhou na etapa: ${result.failedStep}`);
    logger.error(`❌ Erro: ${error.message}`);
  } finally {
    // FECHAR NAVEGADOR APÓS REGISTRAR ERRO
    try {
      // Registrar informações do erro antes de fechar
      if (!result.success) {
        logger.error('🚨 ERRO DETECTADO - Fechando navegador após registro do erro');
        try {
          logger.info(`📍 URL atual: ${page ? page.url() : 'indisponível'}`);
        } catch (e) {
          logger.info('📍 URL atual: indisponível');
        }
      }
      
      // Fechar navegador em todos os casos (sucesso ou erro)
      if (context) {
        await context.close().catch(() => {});
        logger.info('🧹 Navegador fechado');
      }
      
      // Limpar diretório temporário
      if (tempDir) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
          logger.info(`🧹 Diretório temporário removido: ${tempDir}`);
        } catch (e) {
          logger.warning(`⚠️ Não foi possível remover o diretório: ${e.message}`);
        }
      }
      
      logger.info('🧹 Recursos limpos');
    } catch (cleanupError) {
      logger.error('❌ Erro ao limpar recursos', cleanupError);
    }
  }

  return result;
}

/**
 * Gera User-Agent aleatório muito variado
 */
function generateRandomUserAgent() {
  const chromeVersions = ['119.0.0.0', '120.0.0.0', '121.0.0.0', '122.0.0.0'];
  const firefoxVersions = ['120.0', '121.0', '122.0', '123.0'];
  const safariVersions = ['17.1', '17.2', '17.3'];
  
  const userAgents = [
    // Chrome Windows
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersions[Math.floor(Math.random() * chromeVersions.length)]} Safari/537.36`,
    // Chrome Mac
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersions[Math.floor(Math.random() * chromeVersions.length)]} Safari/537.36`,
    // Chrome Linux
    `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersions[Math.floor(Math.random() * chromeVersions.length)]} Safari/537.36`,
    // Firefox
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${firefoxVersions[Math.floor(Math.random() * firefoxVersions.length)]}) Gecko/20100101 Firefox/${firefoxVersions[Math.floor(Math.random() * firefoxVersions.length)]}`,
    // Safari
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${safariVersions[Math.floor(Math.random() * safariVersions.length)]} Safari/605.1.15`
  ];
  
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Gera viewport aleatório (resoluções comuns)
 */
function generateRandomViewport() {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1600, height: 900 },
    { width: 2560, height: 1440 }
  ];
  
  return viewports[Math.floor(Math.random() * viewports.length)];
}

/**
 * Gera locale aleatório (focando em português/inglês)
 */
function generateRandomLocale() {
  const locales = [
    'pt-BR',
    'pt-PT', 
    'en-US',
    'en-GB',
    'es-ES'
  ];
  
  return locales[Math.floor(Math.random() * locales.length)];
}

/**
 * Gera timezone aleatório (Brasil e outros)
 */
function generateRandomTimezone() {
  const timezones = [
    'America/Sao_Paulo',
    'America/Rio_Branco',
    'America/Manaus',
    'America/Fortaleza',
    'America/Recife',
    'America/Bahia'
  ];
  
  return timezones[Math.floor(Math.random() * timezones.length)];
}

/**
 * Gera geolocalização aleatória (Brasil)
 */
function generateRandomGeolocation() {
  // Coordenadas de diferentes cidades brasileiras
  const locations = [
    { latitude: -23.5505, longitude: -46.6333 }, // São Paulo
    { latitude: -22.9068, longitude: -43.1729 }, // Rio de Janeiro
    { latitude: -15.7939, longitude: -47.8828 }, // Brasília
    { latitude: -12.9714, longitude: -38.5014 }, // Salvador
    { latitude: -25.4284, longitude: -49.2733 }, // Curitiba
    { latitude: -30.0346, longitude: -51.2177 }, // Porto Alegre
    { latitude: -3.7172, longitude: -38.5433 },  // Fortaleza
    { latitude: -8.0476, longitude: -34.8770 }   // Recife
  ];
  
  return locations[Math.floor(Math.random() * locations.length)];
}

/**
 * Gera senha aleatória
 */
function generateRandomPassword() {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%&*';
  
  // GARANTIR requisitos mínimos:
  // - Pelo menos 8 caracteres
  // - Pelo menos um número (0-9)
  let password = '';
  
  // Adicionar pelo menos um número (OBRIGATÓRIO)
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  // Adicionar pelo menos uma letra minúscula
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  
  // Adicionar pelo menos uma letra maiúscula
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  
  // Adicionar caractere especial
  password += special[Math.floor(Math.random() * special.length)];
  
  // Completar até 12 caracteres
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Embaralhar para não ter padrão
  password = password.split('').sort(() => Math.random() - 0.5).join('');
  
  return password;
}

