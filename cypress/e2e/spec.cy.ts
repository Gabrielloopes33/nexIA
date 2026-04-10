describe('Teste básico do NexIA Chat', () => {
  beforeEach(() => {
    // Visita a página inicial
    cy.visit('/')
  })

  it('deve carregar a página de login', () => {
    // Verifica se estamos na página de login
    cy.url().should('include', '/login')
    
    // Verifica se o formulário de login existe
    cy.get('input[type="email"], input[name="email"]').should('exist')
    cy.get('input[type="password"], input[name="password"]').should('exist')
    cy.get('button[type="submit"]').should('exist')
  })

  it('deve mostrar erro com credenciais inválidas', () => {
    cy.visit('/login')
    
    // Preenche campos com dados inválidos
    cy.get('input[type="email"], input[name="email"]').type('teste@invalido.com')
    cy.get('input[type="password"], input[name="password"]').type('senhaerrada')
    
    // Clica no botão de login
    cy.get('button[type="submit"]').click()
    
    // Aguarda e verifica se aparece mensagem de erro
    // (ajuste o seletor conforme a implementação real)
    cy.contains(/erro|inválido|incorrect|invalid/i).should('be.visible')
  })
})
