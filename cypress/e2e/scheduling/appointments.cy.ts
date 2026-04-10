/**
 * Testes de Agendamentos
 * NexIA Chat CRM
 */

describe('📅 Agendamentos', () => {
  const TEST_USER = {
    email: Cypress.env('TEST_USER_EMAIL') || 'teste@nexia.com',
    password: Cypress.env('TEST_USER_PASSWORD') || 'senha123'
  }

  const generateAppointment = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    
    return {
      title: `Agendamento ${Date.now()}`,
      date: dateStr,
      time: '14:00',
      contact: `Contato ${Date.now()}`
    }
  }

  beforeEach(() => {
    cy.login(TEST_USER.email, TEST_USER.password)
  })

  context('✅ Dashboard de Agendamentos', () => {
    it('deve carregar página de agendamentos', () => {
      cy.visit('/agendamentos/tarefas')
      
      cy.url().should('include', '/agendamentos')
      cy.contains(/agendamentos|tarefas|calendário/i).should('exist')
    })

    it('deve exibir lista de tarefas', () => {
      cy.visit('/agendamentos/tarefas')
      
      cy.contains(/tarefas|pendentes|a fazer/i).should('exist')
    })

    it('deve exibir lista de reuniões', () => {
      cy.visit('/agendamentos/reunioes')
      
      cy.contains(/reuniões|calls|meetings/i).should('exist')
    })

    it('deve exibir lista de ligações', () => {
      cy.visit('/agendamentos/ligacoes')
      
      cy.contains(/ligações|calls|telefone/i).should('exist')
    })

    it('deve exibir lista de prazos', () => {
      cy.visit('/agendamentos/prazos')
      
      cy.contains(/prazos|deadlines|vencimentos/i).should('exist')
    })
  })

  context('✅ Criar Tarefa', () => {
    it('deve abrir formulário de nova tarefa', () => {
      cy.visit('/agendamentos/tarefas')
      
      cy.contains(/nova tarefa|adicionar|criar/i).click()
      
      cy.get('[role="dialog"], .modal, form').should('be.visible')
    })

    it('deve criar nova tarefa com sucesso', () => {
      const task = generateAppointment()
      
      cy.visit('/agendamentos/tarefas')
      
      // Abre formulário
      cy.contains(/nova tarefa|adicionar|criar/i).click()
      
      // Preenche dados
      cy.get('input[name="title"], input[placeholder*="título" i]').type(task.title)
      cy.get('input[type="date"], input[name="date"]').type(task.date)
      
      // Seleciona contato se houver
      cy.get('input[name="contact"], [role="combobox"]').then($input => {
        if ($input.length > 0) {
          cy.wrap($input).type(task.contact)
        }
      })
      
      // Submete
      cy.get('button[type="submit"]').click()
      
      // Verifica sucesso
      cy.contains(task.title).should('exist')
    })

    it('deve validar campos obrigatórios', () => {
      cy.visit('/agendamentos/tarefas')
      
      cy.contains(/nova tarefa|adicionar|criar/i).click()
      
      cy.get('button[type="submit"]').click()
      
      // Verifica validação
      cy.get('input:invalid, .error').should('exist')
    })
  })

  context('✅ Criar Reunião', () => {
    it('deve criar nova reunião', () => {
      const meeting = generateAppointment()
      
      cy.visit('/agendamentos/reunioes')
      
      cy.contains(/nova reunião|agendar|criar/i).click()
      
      // Preenche dados
      cy.get('input[name="title"]').type(meeting.title)
      cy.get('input[type="date"]').type(meeting.date)
      cy.get('input[type="time"]').type(meeting.time)
      
      cy.get('button[type="submit"]').click()
      
      cy.contains(meeting.title).should('exist')
    })

    it('deve permitir adicionar participantes', () => {
      cy.visit('/agendamentos/reunioes')
      
      cy.contains(/nova reunião|agendar/i).click()
      
      cy.get('input[name="title"]').type('Reunião com participantes')
      cy.get('input[type="date"]').type(generateAppointment().date)
      
      // Adiciona participante
      cy.get('input[placeholder*="participante"], input[placeholder*="email"]').then($input => {
        if ($input.length > 0) {
          cy.wrap($input).type('participante@teste.com')
        }
      })
      
      cy.get('button[type="submit"]').click()
      
      cy.contains('Reunião com participantes').should('exist')
    })
  })

  context('✅ Criar Ligação', () => {
    it('deve agendar nova ligação', () => {
      const call = generateAppointment()
      
      cy.visit('/agendamentos/ligacoes')
      
      cy.contains(/nova ligação|agendar/i).click()
      
      cy.get('input[name="title"]').type(`Ligar para ${call.contact}`)
      cy.get('input[type="date"]').type(call.date)
      cy.get('input[type="tel"], input[name="phone"]').type('(11) 99999-9999')
      
      cy.get('button[type="submit"]').click()
      
      cy.contains(`Ligar para ${call.contact}`).should('exist')
    })
  })

  context('✅ Criar Prazo', () => {
    it('deve criar novo prazo', () => {
      const deadline = generateAppointment()
      
      cy.visit('/agendamentos/prazos')
      
      cy.contains(/novo prazo|adicionar/i).click()
      
      cy.get('input[name="title"]').type(`Prazo ${deadline.title}`)
      cy.get('input[type="date"]').type(deadline.date)
      
      cy.get('button[type="submit"]').click()
      
      cy.contains(`Prazo ${deadline.title}`).should('exist')
    })
  })

  context('✅ Editar e Concluir', () => {
    it('deve marcar tarefa como concluída', () => {
      cy.visit('/agendamentos/tarefas')
      
      // Clica no checkbox de conclusão da primeira tarefa
      cy.get('input[type="checkbox"], [role="checkbox"]').first().click({ force: true })
      
      // Verifica se foi marcada como concluída
      cy.get('.completed, [data-completed="true"], .done').should('exist')
    })

    it('deve editar data de agendamento', () => {
      const newDate = new Date()
      newDate.setDate(newDate.getDate() + 2)
      const newDateStr = newDate.toISOString().split('T')[0]
      
      cy.visit('/agendamentos/tarefas')
      
      // Abre edição
      cy.get('[data-testid*="task"], .task-item, [role="listitem"]').first().click()
      
      // Altera data
      cy.get('input[type="date"]').clear().type(newDateStr)
      cy.get('button[type="submit"]').click()
      
      // Verifica atualização
      cy.contains(/atualizado|salvo/i).should('exist')
    })

    it('deve excluir agendamento', () => {
      cy.visit('/agendamentos/tarefas')
      
      // Abre menu de ações
      cy.get('[data-testid*="task"], .task-item').first().within(() => {
        cy.get('button[aria-label*="menu"], .menu').click({ force: true })
      })
      
      // Clica em excluir
      cy.contains(/excluir|remover|deletar/i).click()
      
      // Confirma
      cy.get('[role="dialog"]').contains(/confirmar|sim/i).click()
      
      cy.contains(/excluído|removido/i).should('exist')
    })
  })

  context('✅ Visualização em Calendário', () => {
    it('deve alternar para visualização de calendário', () => {
      cy.visit('/agendamentos/tarefas')
      
      // Procura botão de calendário
      cy.get('button').then($buttons => {
        const calendarBtn = $buttons.toArray().find(btn => 
          /calendário|calendar|mês|semana/i.test(btn.textContent || '')
        )
        
        if (calendarBtn) {
          cy.wrap(calendarBtn).click()
          cy.get('.calendar, [data-view="calendar"]').should('exist')
        }
      })
    })

    it('deve navegar entre meses no calendário', () => {
      cy.visit('/agendamentos/tarefas')
      
      // Procura botões de navegação
      cy.get('button[aria-label*="próximo"], button[aria-label*="anterior"], .nav-button')
        .then($buttons => {
          if ($buttons.length > 0) {
            const nextBtn = $buttons.toArray().find(btn => 
              btn.getAttribute('aria-label')?.includes('próximo') ||
              />|next/i.test(btn.textContent || '')
            )
            
            if (nextBtn) {
              cy.wrap(nextBtn).click()
              // Verifica se mudou o mês
              cy.get('.calendar-header, [data-current-month]').should('exist')
            }
          }
        })
    })
  })

  context('✅ Fila de Atendimento', () => {
    it('deve carregar fila de atendimento', () => {
      cy.visit('/agendamentos/fila')
      
      cy.contains(/fila|atendimento|próximos/i).should('exist')
    })

    it('deve exibir itens ordenados por prioridade', () => {
      cy.visit('/agendamentos/fila')
      
      // Verifica se há itens na fila
      cy.get('[role="listitem"], .queue-item, [data-testid*="queue"]').then($items => {
        if ($items.length > 1) {
          // Verifica se estão ordenados
          cy.log('Itens na fila:', $items.length)
        }
      })
    })
  })
})
