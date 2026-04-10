/**
 * Testes de Autenticação - Cadastro
 * NexIA Chat CRM
 */

describe('🎯 Autenticação - Cadastro', () => {
  const generateUniqueEmail = () => `teste_${Date.now()}@nexia.com`
  
  const NEW_USER = {
    name: 'Novo Usuário Teste',
    email: generateUniqueEmail(),
    password: 'Senha@123',
    phone: '(11) 99999-9999'
  }

  beforeEach(() => {
    cy.clearSession()
  })

  context('✅ Cadastro CRM (Usuário Regular)', () => {
    beforeEach(() => {
      cy.visit('/cadastro/crm')
    })

    it('deve carregar página de cadastro CRM', () => {
      cy.get('input[name="name"], input[placeholder*="nome" i]').should('exist')
      cy.get('input[type="email"], input[name="email"]').should('exist')
      cy.get('input[type="password"], input[name="password"]').should('exist')
      cy.get('button[type="submit"]').should('contain.text', 'Cadastrar')
    })

    it('deve criar nova conta de usuário CRM', () => {
      const uniqueEmail = generateUniqueEmail()
      
      // Preenche formulário
      cy.get('input[name="name"], input[placeholder*="nome" i]').type(NEW_USER.name)
      cy.get('input[type="email"], input[name="email"]').type(uniqueEmail)
      cy.get('input[type="password"], input[name="password"]').type(NEW_USER.password)
      
      if (cy.get('input[name="phone"]').length > 0) {
        cy.get('input[name="phone"]').type(NEW_USER.phone)
      }
      
      // Aceita termos (se houver checkbox)
      cy.get('input[type="checkbox"]').then($checkbox => {
        if ($checkbox.length > 0) {
          cy.wrap($checkbox).first().check()
        }
      })
      
      // Submete
      cy.get('button[type="submit"]').click()
      
      // Verifica sucesso ou redirecionamento para onboarding
      cy.url().should('match', /\/onboarding|dashboard/)
    })
  })

  context('✅ Cadastro Revenda', () => {
    beforeEach(() => {
      cy.visit('/cadastro/revenda')
    })

    it('deve carregar página de cadastro de revenda', () => {
      cy.contains(/revenda|parceiro|reseller/i).should('exist')
      cy.get('input[type="email"]').should('exist')
    })

    it('deve criar conta de revenda', () => {
      const uniqueEmail = `revenda_${Date.now()}@nexia.com`
      
      cy.get('input[name="name"], input[placeholder*="nome" i]').type('Empresa Revenda Teste')
      cy.get('input[type="email"]').type(uniqueEmail)
      cy.get('input[type="password"]').type(NEW_USER.password)
      
      cy.get('button[type="submit"]').click()
      
      cy.url().should('match', /\/onboarding|dashboard/)
    })
  })

  context('❌ Validações de Erro', () => {
    beforeEach(() => {
      cy.visit('/cadastro/crm')
    })

    it('deve exigir nome', () => {
      cy.get('input[type="email"]').type(NEW_USER.email)
      cy.get('input[type="password"]').type(NEW_USER.password)
      cy.get('button[type="submit"]').click()
      
      cy.get('input[name="name"]').then($input => {
        expect($input[0].validationMessage).to.not.be.empty
      })
    })

    it('deve exigir email válido', () => {
      cy.get('input[name="name"]').type(NEW_USER.name)
      cy.get('input[type="email"]').type('email-invalido')
      cy.get('input[type="password"]').type(NEW_USER.password)
      cy.get('button[type="submit"]').click()
      
      cy.get('input[type="email"]').then($input => {
        expect($input[0].validationMessage).to.include('@')
      })
    })

    it('deve exigir senha forte', () => {
      cy.get('input[name="name"]').type(NEW_USER.name)
      cy.get('input[type="email"]').type(generateUniqueEmail())
      cy.get('input[type="password"]').type('123') // Senha fraca
      cy.get('button[type="submit"]').click()
      
      cy.contains(/senha|password|mínimo/i).should('be.visible')
    })

    it('deve detectar email já cadastrado', () => {
      // Primeiro cria o usuário
      const email = generateUniqueEmail()
      cy.get('input[name="name"]').type(NEW_USER.name)
      cy.get('input[type="email"]').type(email)
      cy.get('input[type="password"]').type(NEW_USER.password)
      cy.get('button[type="submit"]').click()
      
      cy.url().should('match', /\/onboarding|dashboard/)
      
      // Tenta cadastrar novamente
      cy.clearSession()
      cy.visit('/cadastro/crm')
      
      cy.get('input[name="name"]').type(NEW_USER.name)
      cy.get('input[type="email"]').type(email)
      cy.get('input[type="password"]').type(NEW_USER.password)
      cy.get('button[type="submit"]').click()
      
      cy.contains(/já existe|email em uso|already exists/i).should('be.visible')
    })
  })
})
