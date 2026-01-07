#!/usr/bin/env node

import { parseArgs } from 'util';
import pLimit from 'p-limit';
import ora from 'ora';
import chalk from 'chalk';
import { config, validateConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { emailService } from './services/emailService.js';
import { proxyService } from './services/proxyService.js';
import { reportService } from './services/reportService.js';
import { executeUserFlow } from './automation/userFlow.js';

/**
 * Orchestrator principal - executa testes em escala
 */
class ReferralTester {
  constructor(options = {}) {
    this.totalUsers = options.users || 10;
    this.concurrency = options.concurrent || config.maxConcurrentUsers;
    this.spinner = null;
  }

  /**
   * Executa os testes
   */
  async run() {
    try {
      // Banner
      this.displayBanner();

      // Validar configuração
      logger.info('🔍 Validando configuração...');
      validateConfig();
      logger.success('✅ Configuração válida');

      // Inicializar serviços
      logger.info('🚀 Inicializando serviços...');
      await proxyService.initialize();
      logger.success('✅ Serviços inicializados');

      // Iniciar relatório
      reportService.start();

      // Exibir configuração
      this.displayConfiguration();

      // Executar testes
      logger.info(`\n🎯 Iniciando testes com ${this.totalUsers} usuários...\n`);
      
      const results = await this.executeTests();

      // Gerar relatório
      logger.info('\n📊 Gerando relatório...');
      const report = await reportService.finish();
      
      // Exibir relatório
      reportService.displayReport(report);

      // Exibir estatísticas finais
      this.displayFinalStats(report);

      return report;
    } catch (error) {
      logger.error('❌ Erro fatal na execução', error);
      process.exit(1);
    }
  }

  /**
   * Executa os testes com controle de concorrência
   */
  async executeTests() {
    const limit = pLimit(this.concurrency);
    const promises = [];

    // Criar spinner para progresso
    this.spinner = ora({
      text: `Executando testes (0/${this.totalUsers})`,
      color: 'cyan'
    }).start();

    let completed = 0;

    for (let i = 1; i <= this.totalUsers; i++) {
      const promise = limit(async () => {
        try {
          const result = await executeUserFlow(i, config.referralLink);
          reportService.addResult(i, result);
          
          completed++;
          this.spinner.text = `Executando testes (${completed}/${this.totalUsers}) - ${result.success ? '✅' : '❌'} User ${i}`;
          
          return result;
        } catch (error) {
          completed++;
          this.spinner.text = `Executando testes (${completed}/${this.totalUsers}) - ❌ User ${i}`;
          
          logger.error(`Erro no usuário ${i}`, error);
          reportService.addResult(i, {
            userId: i,
            success: false,
            error: { type: 'Fatal', message: error.message }
          });
        }
      });

      promises.push(promise);
    }

    await Promise.all(promises);
    this.spinner.succeed(`Testes concluídos: ${completed}/${this.totalUsers}`);

    return promises;
  }

  /**
   * Exibe banner inicial
   */
  displayBanner() {
    console.log(chalk.cyan('\n' + '═'.repeat(60)));
    console.log(chalk.cyan.bold('           🚀 LOVABLE REFERRAL TESTER 🚀'));
    console.log(chalk.cyan('═'.repeat(60) + '\n'));
  }

  /**
   * Exibe configuração
   */
  displayConfiguration() {
    console.log(chalk.yellow('\n📋 CONFIGURAÇÃO:'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.white(`  Total de usuários:      ${chalk.bold(this.totalUsers)}`));
    console.log(chalk.white(`  Concorrência:           ${chalk.bold(this.concurrency)}`));
    console.log(chalk.white(`  Link de indicação:      ${chalk.bold(config.referralLink)}`));
    console.log(chalk.white(`  Proxy habilitado:       ${chalk.bold(config.proxyEnabled ? '✅ Sim' : '❌ Não')}`));
    console.log(chalk.white(`  Modo headless:          ${chalk.bold(config.headless ? '✅ Sim' : '❌ Não')}`));
    console.log(chalk.white(`  Domínio de email:       ${chalk.bold(config.inboundDomain)}`));
    console.log(chalk.gray('─'.repeat(60)));
  }

  /**
   * Exibe estatísticas finais
   */
  displayFinalStats(report) {
    console.log(chalk.green('\n✨ ESTATÍSTICAS FINAIS:'));
    console.log(chalk.gray('─'.repeat(60)));
    
    const emailStats = emailService.getStats();
    const proxyStats = proxyService.getStats();
    
    console.log(chalk.white(`  📧 Emails gerados:      ${chalk.bold(emailStats.totalEmailsGenerated)}`));
    console.log(chalk.white(`  🌐 Proxies usados:      ${chalk.bold(proxyStats.totalProxies)}`));
    console.log(chalk.white(`  💰 Créditos gerados:    ${chalk.bold(report.summary.totalCredits)}`));
    console.log(chalk.white(`  ⏱️  Tempo total:         ${chalk.bold(report.summary.executionTime)}`));
    console.log(chalk.gray('─'.repeat(60)));
    
    if (report.summary.successRate === '100.00%') {
      console.log(chalk.green.bold('\n🎉 SUCESSO TOTAL! Todos os usuários completaram o fluxo!\n'));
    } else if (parseFloat(report.summary.successRate) >= 80) {
      console.log(chalk.yellow.bold('\n⚠️  Alguns usuários falharam, mas a taxa de sucesso é boa.\n'));
    } else {
      console.log(chalk.red.bold('\n❌ Taxa de sucesso baixa. Verifique os erros no relatório.\n'));
    }
  }
}

/**
 * Parse argumentos da linha de comando
 */
function parseCommandLineArgs() {
  try {
    const { values } = parseArgs({
      options: {
        users: {
          type: 'string',
          short: 'u',
          default: '10'
        },
        concurrent: {
          type: 'string',
          short: 'c',
          default: config.maxConcurrentUsers.toString()
        },
        help: {
          type: 'boolean',
          short: 'h',
          default: false
        }
      }
    });

    if (values.help) {
      displayHelp();
      process.exit(0);
    }

    return {
      users: parseInt(values.users),
      concurrent: parseInt(values.concurrent)
    };
  } catch (error) {
    console.error(chalk.red('Erro ao parsear argumentos:', error.message));
    displayHelp();
    process.exit(1);
  }
}

/**
 * Exibe ajuda
 */
function displayHelp() {
  console.log(chalk.cyan('\n🚀 Lovable Referral Tester\n'));
  console.log(chalk.white('Uso: node src/index.js [opções]\n'));
  console.log(chalk.yellow('Opções:'));
  console.log(chalk.white('  -u, --users <número>       Número de usuários a testar (padrão: 10)'));
  console.log(chalk.white('  -c, --concurrent <número>  Número de execuções simultâneas (padrão: 5)'));
  console.log(chalk.white('  -h, --help                 Exibe esta ajuda\n'));
  console.log(chalk.yellow('Exemplos:'));
  console.log(chalk.gray('  node src/index.js --users=50'));
  console.log(chalk.gray('  node src/index.js --users=100 --concurrent=10'));
  console.log(chalk.gray('  npm run test:small'));
  console.log(chalk.gray('  npm run test:medium'));
  console.log(chalk.gray('  npm run test:large\n'));
}

/**
 * Ponto de entrada
 */
async function main() {
  try {
    const options = parseCommandLineArgs();
    const tester = new ReferralTester(options);
    await tester.run();
    process.exit(0);
  } catch (error) {
    logger.error('Erro fatal', error);
    process.exit(1);
  }
}

// Executar se for o módulo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ReferralTester };

