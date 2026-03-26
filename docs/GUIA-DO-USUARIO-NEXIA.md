# 📚 Guia do Usuário - NexIA Chat

> Documento completo de apresentação do sistema para usuários finais
> **Versão:** 1.1 | **Última atualização:** Março 2026

---

## 🆕 Novidades da Versão 1.1

### ✨ Contexto do Cliente na Tela de Conversas
- Painel lateral completo com informações do contato
- Visualização de negócios relacionados com valores e estágios
- Histórico de atividades (ligações, reuniões, tarefas, notas)
- Criação de negócios diretamente durante a conversa
- Exclusão de negócios com confirmação

### 📞 Formatação Inteligente de Contatos
- Números de telefone formatados automaticamente no padrão brasileiro
- Detecção automática de grupos do WhatsApp
- Captura do nome do perfil quando disponível

### 🎯 Onboarding de 3 Etapas
- Fluxo guiado para novos usuários
- Configuração de dados da empresa
- Upload de logo (opcional)
- Convite de equipe (opcional)

---

## 🎯 O que é o NexIA Chat?

O **NexIA Chat** é um **CRM (Customer Relationship Management)** brasileiro completo e multi-tenant, projetado para empresas que precisam gerenciar relacionamentos com clientes através de múltiplos canais de comunicação.

### Principais Benefícios

- 🔄 **Comunicação Omnichannel** - WhatsApp, Instagram e Chat em um só lugar
- 📊 **Pipeline de Vendas** - Acompanhe todo funil de vendas
- 👥 **Gestão de Contatos** - Organize seus clientes com tags e listas
- 🤖 **Inteligência Artificial** - Insights automáticos das conversas
- 📅 **Agendamentos** - Tarefas, reuniões e prazos organizados
- 💳 **Cobranças** - Gestão completa de assinaturas via Stripe

---

## 🚀 Primeiros Passos

### 1. Login no Sistema

Acesse o sistema através da página de login com seu email e senha.

**URL:** `/login`

- Faça login com suas credenciais
- Ou crie uma nova conta clicando em "Criar conta"

### 2. Onboarding (Primeiro Acesso)

Ao criar uma nova conta, você será guiado através de um processo de configuração inicial em 3 etapas:

#### Etapa 1: Dados da Empresa
- Nome da organização
- Slug (URL personalizada)
- Segmento de atuação

#### Etapa 2: Logo da Empresa (Opcional)
- Faça upload do logo da sua organização
- Suporte para PNG, JPG ou GIF até 5MB
- Pode pular esta etapa se preferir

#### Etapa 3: Convites (Opcional)
- Convide membros da equipe para a organização
- Envie convites por email
- Pode adicionar membros depois nas configurações

> ✅ Após completar o onboarding, você será direcionado automaticamente para o Dashboard.

### 3. Dashboard Principal

Após o login (ou onboarding), você será direcionado para o **Dashboard** (`/dashboard`), que mostra:

- Métricas de conversas em tempo real
- Gráficos de desempenho
- Atividades recentes
- Contatos em destaque

---

## 📱 Navegação Principal

O sistema possui uma **Sidebar** (menu lateral) com as seguintes seções:

### 🏠 Início (`/dashboard`)
Visão geral do seu negócio com:
- Total de conversas e contatos
- Gráficos de desempenho
- Pipeline de vendas
- Insights de IA

---

## 👥 Módulo de Contatos

### Tela Principal (`/contatos`)

A central de gerenciamento de todos os seus clientes e leads.

**Funcionalidades:**
- 📋 Lista completa de contatos com busca e filtros
- 🏷️ Filtro por tags e status
- ➕ Adicionar novo contato manualmente
- 📥 Importar contatos em massa
- 📤 Exportar lista de contatos
- 🗑️ Lixeira para contatos excluídos

**Ações disponíveis:**
- Visualizar detalhes do contato (painel lateral)
- Editar informações
- Excluir contato
- Selecionar múltiplos contatos para ações em massa

### Tags (`/contatos/tags`)

Organize seus contatos com etiquetas coloridas.

**O que você pode fazer:**
- Criar novas tags com cores personalizadas
- Configurar automações para tags
- Definir parâmetros UTM (origem, meio, campanha)
- Ver quantidade de contatos em cada tag
- Editar ou excluir tags existentes

### Listas (`/contatos/listas`)

Crie agrupamentos específicos de contatos.

**Funcionalidades:**
- Criar listas com nome, descrição e cor
- Visualizar contatos de uma lista específica
- Estatísticas (total de listas, contatos, maior lista)
- Busca por nome ou descrição

### Segmentos (`/contatos/segmentos`)

Crie segmentações avançadas de contatos baseadas em critérios.

### Campos Personalizados (`/contatos/campos`)

Adicione campos extras aos seus contatos além dos padrões (nome, telefone, email).

---

## 💬 Módulo de Conversas

### Todas as Conversas (`/conversas`)

Central unificada de atendimento ao cliente.

**Funcionalidades:**
- Visualizar todas as conversas em um só lugar
- Chat em tempo real com histórico completo
- Informações do contato no painel lateral
- Ações rápidas (marcar como resolvida, transferir, etc.)
- **Contexto do Cliente** - Painel lateral direito com informações completas

### Contexto do Cliente (Painel Lateral)

Ao abrir uma conversa, o painel lateral direito exibe informações completas do contato:

#### 📋 Informações do Contato
- Nome do contato (formatado automaticamente)
- Telefone formatado no padrão brasileiro: `(11) 99999-9999`
- Empresa e cargo (quando disponíveis)
- Avatar com iniciais do nome

> 💡 **Dica:** Para contatos do WhatsApp, o sistema tenta capturar o nome do perfil automaticamente. Para grupos, exibe o nome do grupo.

#### 💰 Negócios Relacionados
Visualize e gerencie oportunidades de vendas vinculadas ao contato:

- **Lista de negócios** com título, valor e estágio atual
- **Probabilidade de fechamento** exibida em cada negócio
- **Responsável** pelo negócio
- **Status** visual (Aberto, Ganho, Perdido, Pausado)

**Criar novo negócio:**
1. Clique no botão **+** ao lado do título "Negócios Relacionados"
2. Preencha: Título, Valor (R$) e Descrição (opcional)
3. O sistema vincula automaticamente ao contato da conversa
4. O negócio é criado no estágio padrão do pipeline

**Excluir negócio:**
- Passe o mouse sobre o negócio e clique no ícone 🗑️
- Confirme a exclusão

#### 📊 Estatísticas Rápidas
- Total de mensagens trocadas
- Mensagens não lidas

#### 📅 Histórico de Atividades
Timeline completa de interações com o contato:

- **Ligações** realizadas
- **Reuniões** agendadas
- **Tarefas** criadas
- **Notas** adicionadas
- **Negócios** criados ou atualizados
- **Mensagens** trocadas

Visualização em timeline cronológica com ícones coloridos por tipo de atividade.

### Minhas Conversas (`/conversas/minhas`)

Veja apenas as conversas atribuídas a você.

### Não Atribuídas (`/conversas/nao-atribuidas`)

Conversas pendentes de atribuição para algum atendente.

### Não Atendidas (`/conversas/unattended`)

Conversas que ainda não receberam resposta.

### Pastas Especiais

- **Prioridade** (`/conversas/folders/priority`) - Conversas marcadas como urgentes
- **Leads** (`/conversas/folders/leads`) - Conversas de potenciais clientes

### Equipes

- **Vendas** (`/conversas/teams/sales`) - Conversas da equipe comercial
- **Suporte** (`/conversas/teams/support`) - Conversas da equipe de suporte

### Canais

Filtre conversas por canal de origem:
- **WhatsApp** (`/conversas/channels/whatsapp`)
- **Instagram** (`/conversas/channels/instagram`)
- **Chat Widget** (`/conversas/channels/chat-widget`)

---

## 📊 Módulo Pipeline

### Pipeline de Vendas (`/pipeline`)

Gerencie seu funil de vendas completo com visual Kanban.

**Funcionalidades:**
- Visualização em colunas (etapas do funil)
- Drag-and-drop para mover oportunidades entre etapas
- Cards de deals (oportunidades) com valor e estimativa
- Criar novos deals diretamente no pipeline
- Criar deals a partir de conversas (via Contexto do Cliente)
- Editar informações de deals
- Histórico de atividades por deal

**Etapas padrão do funil:**
1. Novo Lead
2. Qualificação
3. Proposta
4. Negociação
5. Fechamento

### Criando Negócios

Você pode criar negócios de duas formas:

**1. Pelo Pipeline (`/pipeline`)**
- Clique no botão "Novo Negócio" na coluna desejada
- Preencha os dados do contato e oportunidade

**2. Pelo Contexto do Cliente (durante conversa)**
- Abra uma conversa no módulo Conversas
- No painel lateral direito "Contexto do Cliente", clique em **+**
- Preencha: Título, Valor e Descrição
- O negócio é criado automaticamente vinculado ao contato

> 💡 **Vantagem:** Criar pelo Contexto do Cliente já vincula o negócio ao contato correto automaticamente!

---

## 📅 Módulo de Agendamentos

### Visão Geral (`/agendamentos`)

Gerencie todas as suas atividades e compromissos.

**Funcionalidades:**
- Calendário de atividades
- Lista de tarefas pendentes
- Reuniões agendadas
- Ligações para fazer
- Prazos importantes

### Fila de Atendimento (`/agendamentos/fila`)

Fila organizada de atendimentos pendentes.

### Histórico de Reuniões (`/agendamentos/reunioes`)

Todas as reuniões realizadas e futuras.

### Concluídas (`/agendamentos/concluidas`)

Histórico de atividades já finalizadas.

---

## 🔗 API Oficial Meta

### Visão Geral (`/meta-api`)

Central de integrações oficiais com a Meta (Facebook).

### WhatsApp Business (`/meta-api/whatsapp`)

Gerencie sua conta oficial do WhatsApp Business.

**Funcionalidades:**
- **Conectar** (`/meta-api/whatsapp/connect`) - Conectar número oficial
- **Templates** (`/meta-api/whatsapp/templates`) - Gerenciar modelos de mensagens aprovados
- **Números** (`/meta-api/whatsapp/numeros`) - Configurar números de telefone
- **Analytics** (`/meta-api/whatsapp/analytics`) - Estatísticas de uso
- **Enviar Mensagens** (`/meta-api/whatsapp/send`) - Envio de mensagens
- **Envio de Formulários** (`/meta-api/whatsapp/form-submissions`) - Gerenciar leads de formulários
- **Webhooks** (`/meta-api/whatsapp/webhooks`) - Configuração de webhooks
- **Logs** (`/meta-api/whatsapp/logs`) - Registro de atividades

### Instagram (`/meta-api/instagram`)

Gerencie sua integração com Instagram Business.

- Mensagens diretas
- Comentários
- Stories e mídias
- Menções e tags

### Compliance (`/meta-api/compliance`)

Ferramentas de conformidade e políticas da Meta.

- Monitoramento de bloqueios
- Qualidade de número
- Histórico de violações

### Configurações (`/meta-api/configuracoes`)

Configure tokens, webhooks e permissões da API.

---

## 🔌 Integrações

### Central de Integrações (`/integracoes`)

Gerencie todas as integrações do sistema.

**Integrações disponíveis:**
- WhatsApp Não Oficial (Evolution API) - via QR Code
- Webhooks personalizados
- Logs de integrações
- Sincronização de dados
- Filtros avançados
- Tokens de API
- Exportação de dados

---

## ⚙️ Configurações

### Painel de Configurações (`/configuracoes`)

Central de configurações do sistema dividida em seções:

### Conta

- **Perfil** (`/configuracoes/perfil`) - Dados pessoais e avatar
- **Empresa** (`/configuracoes/empresa`) - Informações da organização atual
- **Usuários** (`/configuracoes/usuarios`) - Gerenciar equipe e permissões
- **Organizações** (`/configuracoes/organizacoes`) - Trocar ou criar organizações

### Assinaturas (Apenas OWNER)

> ⚠️ Esta seção é visível apenas para o proprietário da organização.

- **Visão Geral** (`/configuracoes/assinaturas`) - Dashboard financeiro
- **Assinaturas** (`/configuracoes/assinaturas/assinaturas`) - Gerenciar planos ativos
- **Faturas** (`/configuracoes/assinaturas/faturas`) - Histórico de cobranças
- **Clientes** (`/configuracoes/assinaturas/clientes`) - Lista de assinantes
- **Métodos de Pagamento** (`/configuracoes/assinaturas/pagamentos`) - Cartões e dados
- **Histórico** (`/configuracoes/assinaturas/historico`) - Log de transações
- **Reembolsos** (`/configuracoes/assinaturas/reembolsos`) - Gestão de estornos
- **Descontos** (`/configuracoes/assinaturas/cupons`) - Cupons promocionais
- **Planos** (`/configuracoes/assinaturas/planos`) - Configurar planos oferecidos
- **Taxas** (`/configuracoes/assinaturas/taxas`) - Configurações de tarifas
- **Configurações** (`/configuracoes/assinaturas/configuracoes`) - Ajustes gerais

---

## 💳 Módulo de Cobranças

### Painel de Cobranças (`/cobrancas`)

Visualize e gerencie suas assinaturas e pagamentos.

**Informações disponíveis:**
- Status da assinatura ativa
- Valor mensal do plano
- Próxima data de cobrança
- Dias restantes no período atual
- Total em aberto
- Faturas pendentes
- Histórico de faturas recentes

### Fatura Individual (`/cobrancas/fatura/[id]`)

Detalhes de uma fatura específica para pagamento.

### Sucesso (`/cobrancas/sucesso`)

Página de confirmação após pagamento bem-sucedido.

---

## 🎨 Interface do Usuário

### Sidebar (Menu Lateral)

A navegação principal fica na barra lateral esquerda com:
- Cor de destaque: Roxo (#46347F)
- Indicador amarelo para item ativo
- Grupos expansíveis para organizar submenus
- Ícones intuitivos do Lucide React

### Painel de Detalhes do Contato

Ao clicar em um contato, um painel lateral direito abre mostrando:
- Informações completas do contato
- Histórico de conversas
- Tags associadas
- Deals relacionados
- Atividades agendadas

### Temas e Cores

O sistema utiliza um tema claro profissional com:
- Cor primária: Roxo (#46347F)
- Background: Branco
- Texto: Cinza escuro
- Destaques: Amarelo (#f3c845) para indicadores

---

## 🔐 Permissões e Papéis

O sistema possui diferentes níveis de acesso:

| Papel | Acesso |
|-------|--------|
| **OWNER** | Acesso total, incluindo assinaturas e financeiro |
| **ADMIN** | Gerenciamento completo, exceto assinaturas |
| **MANAGER** | Gestão de equipe e operações |
| **USER** | Acesso operacional básico |

---

## 💡 Dicas de Uso

### Atalhos Úteis

- Use a **busca global** para encontrar contatos rapidamente
- **Filtre conversas** por canal para organizar o atendimento
- **Arraste deals** no pipeline para atualizar status visualmente
- **Marque conversas** com prioridade para não esquecer atendimentos urgentes
- **Crie negócios pelo Contexto do Cliente** durante o atendimento para não perder oportunidades
- **Verifique o histórico de atividades** antes de iniciar uma conversa para contextualizar o atendimento

### Boas Práticas

1. **Sempre use tags** para organizar contatos por origem ou interesse
2. **Mantenha o pipeline atualizado** movendo deals conforme evoluem
3. **Configure templates de WhatsApp** para respostas rápidas
4. **Use agendamentos** para não perder prazos importantes
5. **Monitore o compliance** para manter sua conta saudável
6. **Crie negócios durante o atendimento** quando identificar oportunidades de venda
7. **Consulte o Contexto do Cliente** antes de responder para ter informações completas

---

## ❓ Suporte

Em caso de dúvidas ou problemas:

1. Verifique se está logado na organização correta
2. Confira suas permissões de acesso
3. Consulte os logs em **Configurações > Sistema > Logs**
4. Entre em contato com o administrador da sua organização

---

## 📝 Glossário

| Termo | Significado |
|-------|-------------|
| **CRM** | Customer Relationship Management - Gestão de Relacionamento com Clientes |
| **Deal** | Oportunidade de venda no pipeline |
| **Lead** | Potencial cliente que demonstrou interesse |
| **Tag** | Etiqueta para categorizar contatos |
| **Pipeline** | Funil de vendas com etapas |
| **Template** | Modelo de mensagem pré-aprovado |
| **Webhook** | Notificação automática de eventos |
| **MRR** | Monthly Recurring Revenue - Receita Mensal Recorrente |
| **Contexto do Cliente** | Painel lateral com informações completas do contato durante uma conversa |
| **Onboarding** | Processo de configuração inicial para novos usuários |
| **Slug** | Identificador único da organização na URL |
| **Timeline** | Visualização cronológica de atividades e eventos |

---

**Desenvolvido com ❤️ pela NexIA Labs**

*Este documento é atualizado periodicamente. Para sugestões, entre em contato com o suporte.*
