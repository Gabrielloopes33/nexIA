// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Realiza login no sistema
       * @example cy.login('email@exemplo.com', 'senha123')
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Limpa cookies e localStorage
       * @example cy.clearSession()
       */
      clearSession(): Chainable<void>
      
      /**
       * Aguarda a aplicação estar carregada
       * @example cy.waitForApp()
       */
      waitForApp(): Chainable<void>
      
      /**
       * Gera um email único para testes
       * @example cy.generateUniqueEmail()
       */
      generateUniqueEmail(): Chainable<string>
      
      /**
       * Cria um contato de teste
       * @example cy.createTestContact({ name: 'João', email: 'joao@teste.com' })
       */
      createTestContact(contactData?: { name?: string; email?: string; phone?: string }): Chainable<{ name: string; email: string; phone: string }>
      
      /**
       * Cria uma oportunidade de teste
       * @example cy.createTestDeal({ title: 'Nova Oportunidade', value: 5000 })
       */
      createTestDeal(dealData?: { title?: string; value?: number }): Chainable<{ title: string; value: number }>
      
      /**
       * Arrasta elemento para outro elemento (drag & drop)
       * @example cy.get('.card').drag('.column')
       */
      drag(targetSelector: string): Chainable<Element>
      
      /**
       * Verifica se elemento existe com retry
       * @example cy.exists('.modal') ou cy.get('.modal').exists()
       */
      exists(selector?: string): Chainable<Element>
    }
  }
}

// Comando para realizar login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login', { timeout: 60000 })
    
    // Aguarda hydration do Next.js (ambiente dev é mais lento)
    cy.wait(3000)
    
    // Preenche formulário com force para ignorar hydration issues
    cy.get('input#email, input[type="email"]', { timeout: 15000 }).first().type(email, { delay: 50, force: true })
    cy.get('input#password, input[type="password"]', { timeout: 15000 }).first().type(password, { delay: 50, force: true })
    cy.get('button[type="submit"]', { timeout: 15000 }).first().click({ force: true })
    
    // Aguarda redirecionamento (pode demorar no dev)
    cy.wait(5000)
    cy.url({ timeout: 30000 }).should('not.include', '/login')
  })
})

// Comando para limpar sessão
Cypress.Commands.add('clearSession', () => {
  cy.clearCookies()
  cy.clearLocalStorage()
  cy.window().then((win) => {
    win.sessionStorage.clear()
  })
})

// Comando para aguardar aplicação carregar
Cypress.Commands.add('waitForApp', () => {
  cy.intercept({ method: 'GET', url: '/api/**' }).as('apiRequests')
  cy.wait('@apiRequests', { timeout: 10000 })
})

// Comando para gerar email único
Cypress.Commands.add('generateUniqueEmail', () => {
  return `teste_${Date.now()}@nexia.com`
})

// Comando para criar contato de teste
Cypress.Commands.add('createTestContact', (contactData) => {
  const defaultContact = {
    name: `Contato Teste ${Date.now()}`,
    email: `contato_${Date.now()}@teste.com`,
    phone: `(11) 9${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`
  }
  
  const contact = { ...defaultContact, ...contactData }
  
  cy.visit('/contatos/novo')
  cy.get('input[name="name"], input[placeholder*="nome" i]').type(contact.name)
  cy.get('input[type="email"], input[name="email"]').type(contact.email)
  cy.get('input[type="tel"], input[name="phone"]').type(contact.phone)
  cy.get('button[type="submit"]').click()
  
  cy.contains(/criado|salvo|sucesso/i).should('exist')
  
  return cy.wrap(contact)
})

// Comando para criar oportunidade de teste
Cypress.Commands.add('createTestDeal', (dealData) => {
  const defaultDeal = {
    title: `Oportunidade ${Date.now()}`,
    value: Math.floor(Math.random() * 10000) + 1000
  }
  
  const deal = { ...defaultDeal, ...dealData }
  
  cy.visit('/pipeline')
  cy.contains(/nova oportunidade|adicionar/i).click()
  cy.get('input[name="title"]').type(deal.title)
  cy.get('input[name="value"]').type(deal.value.toString())
  cy.get('[role="dialog"] button[type="submit"]').click()
  
  return cy.wrap(deal)
})

// Comando para drag and drop (para pipeline)
Cypress.Commands.add('drag', { prevSubject: 'element' }, (subject, targetSelector) => {
  cy.wrap(subject).trigger('dragstart')
  cy.get(targetSelector).trigger('drop')
})

// Comando para verificar se elemento existe com retry
Cypress.Commands.add('exists', { prevSubject: 'optional' }, (subject, selector) => {
  if (subject) {
    return cy.wrap(subject).should('exist')
  }
  return cy.get(selector).should('exist')
})

export {}
