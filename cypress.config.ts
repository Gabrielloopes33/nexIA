import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: '2y1o7b',
  
  // Configurações de E2E
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    
    // Timeouts aumentados para rodar local (ambiente dev é mais lento)
    defaultCommandTimeout: 30000,      // 30 segundos
    requestTimeout: 30000,             // 30 segundos
    responseTimeout: 30000,            // 30 segundos
    pageLoadTimeout: 120000,           // 2 minutos
    execTimeout: 60000,                // 1 minuto
    taskTimeout: 60000,                // 1 minuto
    
    // Retry em caso de falha (útil para ambientes lentos)
    retries: {
      runMode: 2,      // 2 tentativas em modo headless
      openMode: 1,     // 1 tentativa em modo interativo
    },
    
    setupNodeEvents(on, config) {
      // Configuração para ignorar erros de hydration
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
      })
      return config
    },
  },

  // Configurações de Component Testing (opcional)
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },

  // Configurações de screenshots e videos
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',
  downloadsFolder: 'cypress/downloads',
  fixturesFolder: 'cypress/fixtures',

  // Configurações de ambiente
  env: {
    // Você pode adicionar variáveis de ambiente aqui
    // ou usar um arquivo cypress.env.json
  },
})
