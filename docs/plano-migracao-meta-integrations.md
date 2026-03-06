# Plano de Integração: Recursos do Projeto Piloto

## 📋 Resumo Executivo

Este documento apresenta o plano para integrar as funcionalidades de **WhatsApp Business API** e **Instagram Business API** do projeto piloto (Aurea) ao novo CRM, mantendo a arquitetura moderna Next.js + Prisma já implementada.

---

## 🎯 Escopo da Migração

### ✅ O que será TRAZIDO do Projeto Piloto

#### 1. **Integrações META (Prioridade Alta)**

| Integração | Status no Piloto | Complexidade |
|------------|-----------------|--------------|
| WhatsApp Business Cloud API | ✅ Completo | Média |
| Instagram Business API | ✅ Completo | Média |
| Embedded Signup (Facebook) | ✅ Implementado | Média |
| Sincronização de Templates | ✅ Funcionando | Baixa |
| Webhooks (recebimento) | ✅ Implementado | Média |

**Funcionalidades incluídas:**
- Autenticação OAuth com Meta (Embedded Signup)
- Envio de mensagens (texto, template, mídia)
- Recebimento de mensagens via webhooks
- Gerenciamento de templates aprovados
- Métricas e analytics
- Logs de operações

#### 2. **Schemas de Banco de Dados**

**Tabelas críticas para META:**
```
whatsapp_cloud_instances      # Contas WhatsApp conectadas
whatsapp_cloud_templates      # Templates de mensagem
whatsapp_cloud_logs          # Logs de operações
instagram_instances          # Contas Instagram conectadas
instagram_messages_log       # Logs de mensagens Instagram
```

**Tabelas de suporte (estruturais):**
```
organizations                # Multi-tenancy
organization_units          # Unidades/filiais
agents                      # Agentes de IA
chat_sessions               # Sessões de conversa
contacts                    # Contatos unificados
```

---

### ❌ O que será MANTIDO do Projeto Atual

| Componente | Justificativa |
|------------|---------------|
| **Next.js 15 + App Router** | Arquitetura moderna, SSR/SSG, melhor performance |
| **Prisma ORM** | Type-safe, migrations versionadas, melhor DX |
| **PostgreSQL** | Banco robusto, já configurado |
| **Estrutura de API Routes** | Mais controle que Edge Functions |
| **Tailwind CSS + shadcn/ui** | Design system já estabelecido |
| **Módulo de Cobranças (Stripe)** | Já funcional, não existe no piloto |
| **Sistema de Contatos atual** | Base para expansão |
| **Pipeline/Deals básico** | Estrutura inicial já criada |

---

## 🏗️ Arquitetura Proposta

### Diagrama de Integração

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                       │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Pages)          │  Backend (API Routes)          │
│  ─────────────────         │  ───────────────────           │
│  • /integracoes/whatsapp   │  • /api/meta/auth             │
│  • /integracoes/instagram  │  • /api/meta/send             │
│  • /conversas              │  • /api/meta/templates        │
│  • /configuracoes/canais   │  • /api/meta/webhooks         │
│                            │  • /api/meta/instagram/*      │
└────────────────────────────┴────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL + PRISMA                       │
├─────────────────────────────────────────────────────────────┤
│  • whatsapp_cloud_instances                                  │
│  • whatsapp_cloud_templates                                  │
│  • instagram_instances                                       │
│  • chat_sessions                                             │
│  • contacts                                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    META PLATFORMS                            │
├─────────────────────────────────────────────────────────────┤
│  WhatsApp Business API ◄────► Graph API v24.0               │
│  Instagram Business API ◄───►                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Análise de Esforço

### Fase 1: Foundation (1-2 semanas)
| Tarefa | Esforço | Responsável |
|--------|---------|-------------|
| Schema Prisma (WhatsApp + Instagram) | 2 dias | Backend |
| Migrations do banco | 1 dia | Backend |
| Estrutura de organizações/unidades | 3 dias | Backend |

### Fase 2: WhatsApp Business (2-3 semanas)
| Tarefa | Esforço | Responsável |
|--------|---------|-------------|
| API de autenticação (/api/meta/auth) | 3 dias | Backend |
| API de envio de mensagens | 2 dias | Backend |
| API de webhooks | 2 dias | Backend |
| API de templates | 2 dias | Backend |
| Componente EmbeddedSignupButton | 2 dias | Frontend |
| Página de configuração WhatsApp | 3 dias | Frontend |
| Integração com chat existente | 2 dias | Fullstack |

### Fase 3: Instagram Business (1-2 semanas)
| Tarefa | Esforço | Responsável |
|--------|---------|-------------|
| API de autenticação Instagram | 2 dias | Backend |
| API de envio Direct Message | 2 dias | Backend |
| Página de configuração Instagram | 2 dias | Frontend |
| Integração com chat unificado | 2 dias | Fullstack |

### Fase 4: Chat Unificado (2 semanas)
| Tarefa | Esforço | Responsável |
|--------|---------|-------------|
| Unificar WhatsApp + Instagram + Widget | 3 dias | Fullstack |
| Identificação de contatos por canal | 2 dias | Backend |
| Histórico de conversas unificado | 3 dias | Fullstack |
| Notificações em tempo real | 2 dias | Backend |

**Total estimado: 6-9 semanas (1 desenvolvedor fullstack)**

---

## 💰 Benefícios da Migração

### 1. **Canais de Comunicação**
- ✅ WhatsApp Business Oficial (API da Meta)
- ✅ Instagram Direct Messages
- ✅ Chat widget para sites
- ✅ Todos os canais em uma interface unificada

### 2. **Recursos Avançados**
- ✅ Templates de mensagem aprovados pela Meta
- ✅ Qualidade/rating de números
- ✅ Analytics de entrega
- ✅ Webhooks em tempo real
- ✅ Suporte a mídia (imagens, vídeos, documentos)

### 3. **Escalabilidade**
- ✅ Arquitetura multi-tenant (organizações)
- ✅ Suporte a múltiplas unidades/filiais
- ✅ Múltiplas instâncias por canal
- ✅ Isolamento de dados por organização

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Complexidade do OAuth Meta | Média | Alto | Usar Embedded Signup já testado |
| Rate limits da API | Baixa | Médio | Implementar filas e retry |
| Aprovação de templates | Alta | Médio | Documentar processo para clientes |
| Migração de dados | Baixa | Alto | Manter sistemas paralelos durante transição |

---

## 🔄 Alternativas Consideradas

### Opção A: Usar Evolution API (WhatsApp não-oficial)
**Vantagens:**
- Mais barato (não paga por conversação)
- Não precisa de aprovação de templates

**Desvantagens:**
- Violar termos do WhatsApp (risco de ban)
- Não oficial = instabilidade
- Sem suporte da Meta
- **Não recomendado para produção**

### Opção B: Implementar do zero
**Vantagens:**
- Código 100% proprietário
- Sem dependências

**Desvantagens:**
- 3-4 meses de desenvolvimento
- Risco de bugs em produção
- Manutenção complexa

### Opção C: Usar solução SaaS (WATI, Twilio, etc)
**Vantagens:**
- Rápido de implementar
- Suporte incluído

**Desvantagens:**
- Custo alto por mensagem
- Vendor lock-in
- Menos customização

---

## ✅ Recomendação

**Aprovar a integração das funcionalidades META do projeto piloto** por:

1. **Código testado e validado** - Já funciona em produção
2. **Velocidade** - 6-9 semanas vs 3-4 meses do zero
3. **Custo** - Apenas custos de infra (sem taxas de SaaS)
4. **Escalabilidade** - Arquitetura pronta para multi-tenant
5. **Manutenibilidade** - Baseado em APIs oficiais da Meta

---

## 📅 Próximos Passos

1. **Aprovação do CTO** deste plano
2. **Setup de ambiente de desenvolvimento** com credenciais Meta
3. **Início pela Fase 1** (Foundation - schemas)
4. **Reunião semanal** de acompanhamento

---

**Documento preparado por:** [Nome]  
**Data:** 06/03/2026  
**Versão:** 1.0
