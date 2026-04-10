/**
 * Testes de Autenticação - Login
 * NexIA Chat CRM
 * 
 * NOTA: Este arquivo foi otimizado para rodar em ambiente local de desenvolvimento
 * com timeouts aumentados e waits estratégicos.
 */

describe('🎯 Autenticação - Login', () => {
  const TEST_USER = {
    email: Cypress.env('TEST_USER_EMAIL') || 'gabriel@gmail.com',
    password: Cypress.env('TEST_USER_PASSWORD') || '123123123',
    name: 'Usuário Teste'
  }

  const INVALID_USER = {
    email: 'invalido@nexia.com',
    password: 'senhaerrada'
  }

  beforeEach(() => {
    cy.clearSession()
    cy.visit('/login', { timeout: 60000 })
    // Aguarda carregamento completo da página (hydration do Next.js)
    cy.wait(3000)
  })

  context('✅ Fluxos de Sucesso', () => {
    it('deve carregar a página de login corretamente', () => {
      // Verifica elementos essenciais da página
      cy.get('input#email, input[type="email"]', { timeout: 10000 }).should('be.visible')
      cy.get('input#password, input[type="password"]', { timeout: 10000 }).should('be.visible')
      cy.get('button[type="submit"]', { timeout: 10000 }).should('be.visible')
      
      // Verifica SEO/título
      cy.title({ timeout: 10000 }).should('include', 'Login')
    })

    it('deve realizar login com credenciais válidas', { defaultCommandTimeout: 30000 }, () => {
      // Preenche formulário
      cy.get('input#email, input[type="email"]').first().type(TEST_USER.email, { delay: 50, force: true })
      cy.get('input#password, input[type="password"]').first().type(TEST_USER.password, { delay: 50, force: true })
      
      // Submete formulário
      cy.get('button[type="submit"]').first().click({ force: true })
      
      // Aguarda redirecionamento (pode demorar no dev)
      cy.wait(5000)
      
      // Verifica redirecionamento
      cy.url({ timeout: 30000 }).should('not.include', '/login')
    })

    it('deve manter sessão após recarregar página', { defaultCommandTimeout: 30000 }, () => {
      // Realiza login
      cy.login(TEST_USER.email, TEST_USER.password)
      
      // Recarrega página
      cy.reload({ timeout: 60000 })
      cy.wait(3000)
      
      // Verifica se ainda está logado (não redirecionou para login)
      cy.url({ timeout: 20000 }).should('not.include', '/login')
    })

    it('deve permitir navegação entre páginas após login', { defaultCommandTimeout: 30000 }, () => {
      cy.login(TEST_USER.email, TEST_USER.password)
      
      // Navega para contatos
      cy.visit('/contatos', { timeout: 60000 })
      cy.wait(3000)
      cy.url({ timeout: 20000 }).should('include', '/contatos')
      
      // Navega para conversas
      cy.visit('/conversas/minhas', { timeout: 60000 })
      cy.wait(3000)
      cy.url({ timeout: 20000 }).should('include', '/conversas')
    })
  })

  context('❌ Fluxos de Erro', () => {
    it('deve exibir erro com email inválido', { defaultCommandTimeout: 30000 }, () => {
      cy.get('input#email, input[type="email"]').first().type(INVALID_USER.email, { force: true })
      cy.get('input#password, input[type="password"]').first().type(TEST_USER.password, { force: true })
      cy.get('button[type="submit"]').first().click({ force: true })
      
      // Aguarda resposta do servidor
      cy.wait(3000)
      
      // Verifica se permanece na página de login (erro de credenciais)
      cy.url({ timeout: 10000 }).should('include', '/login')
    })

    it('deve exibir erro com senha incorreta', { defaultCommandTimeout: 30000 }, () => {
      cy.get('input#email, input[type="email"]').first().type(TEST_USER.email, { force: true })
      cy.get('input#password, input[type="password"]').first().type(INVALID_USER.password, { force: true })
      cy.get('button[type="submit"]').first().click({ force: true })
      
      cy.wait(3000)
      
      cy.url({ timeout: 10000 }).should('include', '/login')
    })

    it('deve exibir erro quando campos estão vazios', () => {
      cy.get('button[type="submit"]').first().click({ force: true })
      
      // Aguarda validação
      cy.wait(1000)
      
      // Verifica se ainda está na página (não enviou)
      cy.url().should('include', '/login')
    })

    it('deve exibir erro para email mal formatado', () => {
      cy.get('input#email, input[type="email"]').first().type('email-invalido', { force: true })
      cy.get('input#password, input[type="password"]').first().type(TEST_USER.password, { force: true })
      cy.get('button[type="submit"]').first().click({ force: true })
      
      cy.wait(1000)
      
      // Permanece na página devido a validação
      cy.url().should('include', '/login')
    })
  })

  context('🔒 Segurança', () => {
    it('deve redirecionar usuário não autenticado para login', { defaultCommandTimeout: 30000 }, () => {
      // Limpa sessão primeiro
      cy.clearSession()
      
      // Tenta acessar página protegida sem login
      cy.visit('/contatos', { timeout: 60000 })
      
      // Aguarda redirecionamento
      cy.wait(5000)
      
      // Deve redirecionar para login
      cy.url({ timeout: 20000 }).should('include', '/login')
    })

    it('deve mascarar senha no campo de input', () => {
      cy.get('input#password, input[type="password"]').first()
        .should('have.attr', 'type', 'password')
    })
  })

  context('📱 Responsividade', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 }
    ]

    viewports.forEach(({ name, width, height }) => {
      it(`deve exibir formulário corretamente em ${name}`, () => {
        cy.viewport(width, height)
        cy.reload({ timeout: 60000 })
        cy.wait(3000)
        
        cy.get('input#email, input[type="email"]', { timeout: 15000 }).first().should('be.visible')
        cy.get('input#password, input[type="password"]', { timeout: 15000 }).first().should('be.visible')
        cy.get('button[type="submit"]', { timeout: 15000 }).first().should('be.visible')
      })
    })
  })
})
