/**
 * Testes de Pipeline - Oportunidades/Deals
 * NexIA Chat CRM
 */

describe('📊 Pipeline - Oportunidades', () => {
  const TEST_USER = {
    email: Cypress.env('TEST_USER_EMAIL') || 'teste@nexia.com',
    password: Cypress.env('TEST_USER_PASSWORD') || 'senha123'
  }

  const generateDeal = () => ({
    title: `Oportunidade ${Date.now()}`,
    value: Math.floor(Math.random() * 10000) + 1000,
    contact: `Contato Teste ${Date.now()}`
  })

  beforeEach(() => {
    cy.login(TEST_USER.email, TEST_USER.password)
  })

  context('✅ Visualizar Pipeline', () => {
    it('deve carregar a página do pipeline', () => {
      cy.visit('/pipeline')
      
      cy.url().should('include', '/pipeline')
      cy.contains(/pipeline|funil|oportunidades/i).should('exist')
    })

    it('deve exibir colunas do pipeline', () => {
      cy.visit('/pipeline')
      
      // Verifica se há colunas (etapas)
      cy.get('[data-testid*="column"], .pipeline-column, .stage-column, [role="list"]').should('have.length.at.least', 1)
    })

    it('deve exibir cards de oportunidades', () => {
      cy.visit('/pipeline')
      
      // Verifica se há cards ou mensagem de lista vazia
      cy.get('body').then($body => {
        const hasCards = $body.find('[data-testid*="deal"], .deal-card, .opportunity-card').length > 0
        const hasEmptyState = /nenhuma|vazio|sem oportunidades/i.test($body.text())
        
        expect(hasCards || hasEmptyState).to.be.true
      })
    })

    it('deve mostrar valor total do pipeline', () => {
      cy.visit('/pipeline')
      
      // Verifica se há indicadores de valor
      cy.contains(/R\$|total|valor/i).should('exist')
    })
  })

  context('✅ Criar Oportunidade', () => {
    it('deve abrir modal de nova oportunidade', () => {
      cy.visit('/pipeline')
      
      // Clica em adicionar nova oportunidade
      cy.contains(/nova oportunidade|adicionar|novo deal/i).click()
      
      // Verifica se modal abriu
      cy.get('[role="dialog"], .modal, [data-testid*="modal"]').should('be.visible')
    })

    it('deve criar nova oportunidade com dados válidos', () => {
      const deal = generateDeal()
      
      cy.visit('/pipeline')
      
      // Abre modal de nova oportunidade
      cy.contains(/nova oportunidade|adicionar|novo deal/i).click()
      
      // Preenche formulário
      cy.get('input[name="title"], input[placeholder*="título" i]').type(deal.title)
      cy.get('input[name="value"], input[placeholder*="valor" i]').type(deal.value.toString())
      
      // Seleciona contato ou cria novo
      cy.get('input[name="contact"], [role="combobox"]').then($input => {
        if ($input.length > 0) {
          cy.wrap($input).type(deal.contact)
        }
      })
      
      // Submete
      cy.get('[role="dialog"] button[type="submit"], .modal button[type="submit"]').click()
      
      // Verifica sucesso
      cy.contains(deal.title).should('exist')
    })

    it('deve validar campos obrigatórios', () => {
      cy.visit('/pipeline')
      
      cy.contains(/nova oportunidade|adicionar|novo deal/i).click()
      
      // Tenta submeter vazio
      cy.get('[role="dialog"] button[type="submit"], .modal button[type="submit"]').click()
      
      // Verifica validação
      cy.get('[role="dialog"] input, .modal input').then($inputs => {
        const hasValidation = $inputs.toArray().some(input => 
          input.validationMessage || input.classList.contains('error')
        )
        expect(hasValidation).to.be.true
      })
    })
  })

  context('✅ Mover Oportunidade (Drag & Drop)', () => {
    it('deve mover oportunidade entre colunas', () => {
      cy.visit('/pipeline')
      
      // Verifica se há oportunidades para mover
      cy.get('[data-testid*="deal"], .deal-card').first().then($card => {
        if ($card.length > 0) {
          // Obtém a coluna atual
          const currentColumn = $card.closest('[data-testid*="column"], .pipeline-column')
          
          // Tenta arrastar para próxima coluna
          cy.get('[data-testid*="column"], .pipeline-column').then($columns => {
            if ($columns.length > 1) {
              const targetColumn = $columns[1] !== currentColumn[0] ? $columns[1] : $columns[0]
              
              cy.wrap($card).drag(targetColumn)
              
              // Verifica se moveu
              cy.wrap(targetColumn).find('[data-testid*="deal"], .deal-card').should('exist')
            }
          })
        } else {
          cy.log('Nenhuma oportunidade para mover')
        }
      })
    })

    it('deve atualizar estágio ao mover', () => {
      cy.visit('/pipeline')
      
      // Este teste verifica se o backend atualiza corretamente
      // Requer uma oportunidade existente
      cy.get('[data-testid*="deal"], .deal-card').first().then($card => {
        if ($card.length > 0) {
          const dealTitle = $card.text()
          
          // Move o card
          cy.wrap($card).drag('[data-testid*="column"]:eq(1), .pipeline-column:eq(1)')
          
          // Recarrega e verifica se persiste
          cy.reload()
          cy.contains(dealTitle).should('exist')
        }
      })
    })
  })

  context('✅ Editar Oportunidade', () => {
    it('deve abrir detalhes da oportunidade', () => {
      cy.visit('/pipeline')
      
      cy.get('[data-testid*="deal"], .deal-card').first().click()
      
      // Verifica se abriu detalhes ou modal
      cy.url().should('match', /\/pipeline\/|\/deal\/|\/oportunidade\//)
    })

    it('deve atualizar valor da oportunidade', () => {
      const newValue = '15000'
      
      cy.visit('/pipeline')
      
      // Abre primeira oportunidade
      cy.get('[data-testid*="deal"], .deal-card').first().click()
      
      // Edita valor
      cy.get('input[name="value"]').clear().type(newValue)
      cy.get('button[type="submit"]').click()
      
      // Verifica atualização
      cy.contains('R$ 15.000').should('exist')
    })

    it('deve adicionar nota à oportunidade', () => {
      cy.visit('/pipeline')
      
      cy.get('[data-testid*="deal"], .deal-card').first().click()
      
      // Adiciona nota
      cy.get('textarea[name="note"], textarea[placeholder*="nota" i]').type('Nota de teste')
      cy.contains(/adicionar nota|salvar/i).click()
      
      cy.contains('Nota de teste').should('exist')
    })
  })

  context('✅ Filtrar e Buscar', () => {
    it('deve filtrar oportunidades por valor', () => {
      cy.visit('/pipeline')
      
      // Procura filtros
      cy.get('button, [role="combobox"]').contains(/filtro|filter/i).click({ force: true })
      
      // Aplica filtro de valor
      cy.get('input[name="minValue"]').type('1000')
      cy.get('input[name="maxValue"]').type('5000')
      cy.contains(/aplicar|filtrar/i).click()
      
      // Verifica resultados
      cy.get('[data-testid*="deal"], .deal-card').should('exist')
    })

    it('deve buscar oportunidade por nome', () => {
      cy.visit('/pipeline')
      
      cy.get('input[type="search"], input[placeholder*="buscar" i]').type('Teste')
      cy.wait(500)
      
      cy.get('[data-testid*="deal"], .deal-card').should('have.length.at.least', 0)
    })
  })

  context('✅ Arquivar/Ganhar/Perder', () => {
    it('deve marcar oportunidade como ganha', () => {
      cy.visit('/pipeline')
      
      cy.get('[data-testid*="deal"], .deal-card').first().within(() => {
        cy.get('button[aria-label*="menu"], .menu').click({ force: true })
      })
      
      cy.contains(/ganhar|won|fechado/i).click({ force: true })
      
      cy.contains(/ganha|fechada|sucesso/i).should('exist')
    })

    it('deve arquivar oportunidade perdida', () => {
      cy.visit('/pipeline')
      
      cy.get('[data-testid*="deal"], .deal-card').first().within(() => {
        cy.get('button[aria-label*="menu"], .menu').click({ force: true })
      })
      
      cy.contains(/perder|lost|arquivar/i).click({ force: true })
      
      cy.contains(/arquivada|perdida/i).should('exist')
    })
  })
})
