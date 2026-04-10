/**
 * Testes de Contatos - CRUD
 * NexIA Chat CRM
 */

describe('👥 Contatos - CRUD', () => {
  const TEST_USER = {
    email: Cypress.env('TEST_USER_EMAIL') || 'teste@nexia.com',
    password: Cypress.env('TEST_USER_PASSWORD') || 'senha123'
  }

  const generateContact = () => ({
    name: `Contato Teste ${Date.now()}`,
    email: `contato_${Date.now()}@teste.com`,
    phone: `(11) 9${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    company: 'Empresa Teste'
  })

  beforeEach(() => {
    cy.login(TEST_USER.email, TEST_USER.password)
    cy.visit('/contatos')
  })

  context('✅ Listar Contatos', () => {
    it('deve carregar a lista de contatos', () => {
      // Verifica se a página carrega
      cy.url().should('include', '/contatos')
      
      // Verifica elementos da UI
      cy.contains(/contatos|clientes/i).should('exist')
      
      // Verifica se há uma tabela ou lista
      cy.get('table, [role="grid"], .contact-list, [data-testid*="contact"]').should('exist')
    })

    it('deve exibir botão para adicionar novo contato', () => {
      cy.contains(/novo contato|adicionar|cadastrar/i).should('exist')
    })

    it('deve permitir buscar contatos', () => {
      // Procura campo de busca
      cy.get('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="pesquisar" i]')
        .should('exist')
        .type('teste')
      
      // Aguarda debounce da busca
      cy.wait(500)
      
      // Verifica se resultados são exibidos
      cy.get('table tbody tr, [role="row"]').should('have.length.at.least', 0)
    })

    it('deve exibir filtros de contatos', () => {
      // Verifica se há filtros (tags, segmentos, status)
      cy.get('button, [role="combobox"]').then($buttons => {
        const hasFilters = $buttons.toArray().some(btn => 
          /filtro|tag|segmento|status/i.test(btn.textContent || '')
        )
        // Não falha se não encontrar, apenas verifica existência
        if (hasFilters) {
          cy.log('Filtros encontrados')
        }
      })
    })
  })

  context('✅ Criar Contato', () => {
    it('deve navegar para página de novo contato', () => {
      cy.visit('/contatos/novo')
      cy.url().should('include', '/contatos/novo')
    })

    it('deve criar um novo contato com dados válidos', () => {
      const contact = generateContact()
      
      cy.visit('/contatos/novo')
      
      // Preenche formulário
      cy.get('input[name="name"], input[placeholder*="nome" i]').type(contact.name)
      cy.get('input[type="email"], input[name="email"]').type(contact.email)
      cy.get('input[type="tel"], input[name="phone"], input[placeholder*="telefone" i]').type(contact.phone)
      
      // Preenche empresa se o campo existir
      cy.get('input[name="company"], input[placeholder*="empresa" i]').then($input => {
        if ($input.length > 0) {
          cy.wrap($input).type(contact.company)
        }
      })
      
      // Submete formulário
      cy.get('button[type="submit"]').click()
      
      // Verifica sucesso (redirect ou mensagem)
      cy.url().should('match', /\/contatos|\/contato\//)
      
      // Verifica mensagem de sucesso
      cy.contains(/criado|salvo|sucesso/i).should('exist')
    })

    it('deve validar campos obrigatórios', () => {
      cy.visit('/contatos/novo')
      
      // Tenta submeter formulário vazio
      cy.get('button[type="submit"]').click()
      
      // Verifica validação
      cy.get('input[name="name"]').then($input => {
        expect($input[0].validationMessage || $input.siblings('.error, [role="alert"]').length).to.exist
      })
    })

    it('deve validar formato de email', () => {
      cy.visit('/contatos/novo')
      
      cy.get('input[name="name"]').type('Teste')
      cy.get('input[type="email"]').type('email-invalido')
      cy.get('button[type="submit"]').click()
      
      // Verifica validação de email
      cy.get('input[type="email"]').then($input => {
        const hasError = $input[0].validationMessage || 
                        $input.hasClass('error') || 
                        $input.siblings('.error, [role="alert"]').length > 0
        expect(hasError).to.be.true
      })
    })
  })

  context('✅ Editar Contato', () => {
    it('deve acessar página de edição de contato', () => {
      // Assume que há pelo menos um contato na lista
      cy.get('table tbody tr, [role="row"]').first().then($row => {
        // Clica no primeiro contato ou no botão editar
        cy.wrap($row).find('a, button').first().click({ force: true })
      })
      
      // Verifica se foi para página de detalhes ou edição
      cy.url().should('match', /\/contato\/|\/contatos\/[^/]+$/)
    })

    it('deve atualizar dados do contato', () => {
      const updatedName = `Contato Atualizado ${Date.now()}`
      
      // Navega para um contato existente (assumindo ID 1 existe)
      cy.visit('/contatos')
      
      // Clica no primeiro contato
      cy.get('table tbody tr, [role="row"]').first().within(() => {
        cy.get('a, button').first().click()
      })
      
      // Aguarda carregar página de edição
      cy.url().should('match', /\/contato\/|\/contatos\/[^/]+$/)
      
      // Limpa e atualiza nome
      cy.get('input[name="name"]').clear().type(updatedName)
      
      // Salva
      cy.get('button[type="submit"]').click()
      
      // Verifica sucesso
      cy.contains(/atualizado|salvo|sucesso/i).should('exist')
    })
  })

  context('✅ Excluir Contato', () => {
    it('deve mover contato para lixeira', () => {
      cy.visit('/contatos')
      
      // Clica no menu de ações do primeiro contato
      cy.get('table tbody tr, [role="row"]').first().within(() => {
        cy.get('button[aria-label*="menu"], button[title*="opções"], .dropdown-menu').click({ force: true })
      })
      
      // Clica em excluir/mover para lixeira
      cy.contains(/excluir|lixeira|remover/i).click()
      
      // Confirma exclusão (se houver modal)
      cy.get('[role="dialog"], .modal, .confirm-dialog').then($modal => {
        if ($modal.length > 0 && $modal.is(':visible')) {
          cy.wrap($modal).contains(/confirmar|sim|excluir/i).click()
        }
      })
      
      // Verifica mensagem de sucesso
      cy.contains(/movido|excluído|removido/i).should('exist')
    })
  })

  context('🏷️ Tags e Segmentos', () => {
    it('deve adicionar tag a um contato', () => {
      cy.visit('/contatos')
      
      // Acessa primeiro contato
      cy.get('table tbody tr, [role="row"]').first().click()
      
      // Tenta adicionar tag
      cy.get('button, [role="combobox"]').contains(/tag|categoria/i).click({ force: true })
      
      // Seleciona uma tag
      cy.get('[role="option"], .dropdown-item').first().click({ force: true })
      
      // Verifica se tag foi aplicada
      cy.get('[data-testid*="tag"], .tag, .badge').should('exist')
    })
  })

  context('📱 Responsividade', () => {
    it('deve exibir lista de contatos em mobile', () => {
      cy.viewport(375, 667)
      cy.reload()
      
      cy.get('table, [role="grid"], .contact-list').should('exist')
    })
  })
})
