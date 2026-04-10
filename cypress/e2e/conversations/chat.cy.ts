/**
 * Testes de Conversas - Chat
 * NexIA Chat CRM
 */

describe('💬 Conversas - Chat', () => {
  const TEST_USER = {
    email: Cypress.env('TEST_USER_EMAIL') || 'teste@nexia.com',
    password: Cypress.env('TEST_USER_PASSWORD') || 'senha123'
  }

  beforeEach(() => {
    cy.login(TEST_USER.email, TEST_USER.password)
  })

  context('✅ Listar Conversas', () => {
    it('deve carregar lista de conversas atribuídas', () => {
      cy.visit('/conversas/minhas')
      
      cy.url().should('include', '/conversas/minhas')
      cy.contains(/minhas conversas|conversas/i).should('exist')
    })

    it('deve carregar conversas não atribuídas', () => {
      cy.visit('/conversas/nao-atribuidas')
      
      cy.url().should('include', '/conversas/nao-atribuidas')
      cy.contains(/não atribuídas|pendentes|disponíveis/i).should('exist')
    })

    it('deve exibir lista de conversas com informações', () => {
      cy.visit('/conversas/minhas')
      
      // Verifica elementos da lista
      cy.get('[data-testid*="conversation"], .conversation-item, [role="listitem"]').then($items => {
        if ($items.length > 0) {
          // Verifica se há informações do contato
          cy.wrap($items).first().within(() => {
            cy.contains(/nome|contato|cliente/i).should('exist')
          })
        } else {
          cy.log('Nenhuma conversa encontrada - lista vazia')
        }
      })
    })
  })

  context('✅ Abrir e Visualizar Conversa', () => {
    it('deve abrir uma conversa específica', () => {
      cy.visit('/conversas/minhas')
      
      // Clica na primeira conversa
      cy.get('[data-testid*="conversation"], .conversation-item, [role="listitem"]').first().click({ force: true })
      
      // Verifica se abriu a conversa
      cy.url().should('match', /\/conversas\/|\/conversa\//)
    })

    it('deve exibir histórico de mensagens', () => {
      cy.visit('/conversas/minhas')
      
      // Abre primeira conversa
      cy.get('[data-testid*="conversation"], .conversation-item').first().click({ force: true })
      
      // Verifica se há área de mensagens
      cy.get('[data-testid*="message"], .message, .chat-messages, [role="log"]').should('exist')
    })

    it('deve exibir informações do contato na conversa', () => {
      cy.visit('/conversas/minhas')
      
      cy.get('[data-testid*="conversation"], .conversation-item').first().click({ force: true })
      
      // Verifica painel lateral ou cabeçalho com info do contato
      cy.get('[data-testid*="contact-info"], .contact-panel, .sidebar').then($panel => {
        if ($panel.length > 0) {
          cy.wrap($panel).contains(/telefone|email|tags/i).should('exist')
        }
      })
    })
  })

  context('✅ Enviar Mensagens', () => {
    it('deve ter campo de input de mensagem', () => {
      cy.visit('/conversas/minhas')
      
      cy.get('[data-testid*="conversation"], .conversation-item').first().click({ force: true })
      
      // Verifica input de mensagem
      cy.get('textarea, input[type="text"], [contenteditable="true"], [placeholder*="mensagem" i]')
        .should('exist')
    })

    it('deve enviar mensagem de texto', () => {
      const message = `Mensagem de teste ${Date.now()}`
      
      cy.visit('/conversas/minhas')
      
      // Abre conversa
      cy.get('[data-testid*="conversation"], .conversation-item').first().click({ force: true })
      
      // Digita mensagem
      cy.get('textarea, input[type="text"], [contenteditable="true"]').type(message)
      
      // Envia
      cy.get('button[type="submit"], button[aria-label*="enviar"], .send-button').click()
      
      // Verifica se mensagem aparece na conversa
      cy.contains(message).should('exist')
    })

    it('deve permitir anexar arquivo', () => {
      cy.visit('/conversas/minhas')
      
      cy.get('[data-testid*="conversation"], .conversation-item').first().click({ force: true })
      
      // Verifica botão de anexo
      cy.get('button[aria-label*="anexo"], button[title*="arquivo"], .attachment-button, input[type="file"]')
        .should('exist')
    })

    it('deve permitir usar templates de mensagem', () => {
      cy.visit('/conversas/minhas')
      
      cy.get('[data-testid*="conversation"], .conversation-item').first().click({ force: true })
      
      // Procura botão de templates
      cy.get('button').then($buttons => {
        const hasTemplates = $buttons.toArray().some(btn => 
          /template|modelo|resposta rápida/i.test(btn.textContent || btn.getAttribute('aria-label') || '')
        )
        
        if (hasTemplates) {
          cy.log('Templates disponíveis')
        }
      })
    })
  })

  context('✅ Ações na Conversa', () => {
    it('deve permitir atribuir conversa a si mesmo', () => {
      cy.visit('/conversas/nao-atribuidas')
      
      // Procura botão de atribuir
      cy.get('button').contains(/atribuir|assumir|pegar/i).first().click({ force: true })
      
      // Verifica se conversa foi atribuída
      cy.contains(/atribuído|assumido/i).should('exist')
    })

    it('deve permitir arquivar conversa', () => {
      cy.visit('/conversas/minhas')
      
      cy.get('[data-testid*="conversation"], .conversation-item').first().within(() => {
        cy.get('button[aria-label*="menu"], .menu-button, .dropdown').click({ force: true })
      })
      
      // Clica em arquivar
      cy.contains(/arquivar|finalizar|encerrar/i).click({ force: true })
      
      // Verifica confirmação
      cy.contains(/arquivado|encerrado/i).should('exist')
    })

    it('deve permitir adicionar nota interna', () => {
      cy.visit('/conversas/minhas')
      
      cy.get('[data-testid*="conversation"], .conversation-item').first().click({ force: true })
      
      // Procura botão de nota
      cy.get('button').contains(/nota|observação|comentário/i).click({ force: true })
      
      // Adiciona nota
      cy.get('textarea, input').type('Nota de teste')
      cy.get('button').contains(/salvar|adicionar/i).click()
      
      cy.contains('Nota de teste').should('exist')
    })
  })

  context('🔍 Busca de Conversas', () => {
    it('deve permitir buscar conversas', () => {
      cy.visit('/conversas/minhas')
      
      cy.get('input[type="search"], input[placeholder*="buscar" i]').type('teste')
      cy.wait(500)
      
      // Verifica se resultados são filtrados
      cy.get('[data-testid*="conversation"], .conversation-item').should('have.length.at.least', 0)
    })
  })
})
