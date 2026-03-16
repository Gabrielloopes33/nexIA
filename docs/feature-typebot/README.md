# Feature Typebot - Integração Plano de Ação ↔ CRM NexIA

Esta pasta contém os planos de implementação para integrar o sistema **Plano de Ação Lançamento** com o **CRM NexIA**, permitindo o envio automático de PDFs via WhatsApp após preenchimento de formulários no Typebot.

## 📁 Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `PLANO_CRM_NEXIA.md` | Plano de implementação para o **CRM NexIA** - receber webhooks, processar entrega de PDFs, enviar via WhatsApp, **interface de gerenciamento na sidebar** |
| `PLANO_PLANO_ACAO.md` | Plano de implementação para o **Plano de Ação Lançamento** - enviar webhooks ao CRM, storage de PDFs (permanentes) |
| `README.md` | Este arquivo - índice e guia rápido |

## 🏗️ Arquitetura Resumida

```
┌─────────────┐     ┌─────────────────────┐     ┌─────────────┐     ┌─────────────┐
│   Typebot   │────▶│ Plano de Ação       │────▶│  CRM NexIA  │────▶│   WhatsApp  │
│  (Form)     │     │ (Gera PDF → Webhook)│     │ (Envia PDF) │     │  (Cliente)  │
└─────────────┘     └─────────────────────┘     └─────────────┘     └─────────────┘
                                                          │
                                                          ▼
                                              ┌─────────────────────┐
                                              │ Interface na Sidebar│
                                              │ (Gerenciamento)     │
                                              └─────────────────────┘
```

## ✨ Novidades na Versão 2.0

### 🗂️ PDFs Mantidos Permanentemente
- **Antes**: PDFs temporários com cleanup após envio
- **Agora**: PDFs são mantidos permanentemente no sistema de origem
- **Benefício**: Permite download futuro pelo aluno, simplifica arquitetura

### 🖥️ Interface de Gerenciamento no CRM
Nova seção na sidebar da **API Oficial Meta**:

```
API Oficial Meta
├── ...
└── 📋 Envio de Formulários
    ├── Dashboard (estatísticas)
    ├── Entregas Pendentes (em tempo real)
    ├── Histórico (com filtros)
    └── Configurações
```

**Funcionalidades:**
- Visualizar estatísticas de envios
- Acompanhar entregas pendentes (auto-refresh)
- Reprocessar envios manualmente
- Cancelar envios
- Exportar histórico

## 🎭 Agentes AIOS

Cada plano especifica quando chamar os agents do AIOS:

| Agente | Quando Chamar |
|--------|---------------|
| **@architect** | Decisões de design, schema do banco, estrutura de arquivos, interface da sidebar |
| **@dev** | Implementação de código, endpoints, integrações, componentes React |
| **@qa** | Testes, validação, edge cases |
| **@pm** | Coordenação, requisitos, decisões de produto |
| **@devops** | Deploy, configuração de ambiente, monitoramento |

## 🚀 Ordem de Implementação

Recomenda-se implementar na seguinte ordem:

1. **CRM NexIA** primeiro (`PLANO_CRM_NEXIA.md`)
   - Criar schema `PendingFormDelivery`
   - Criar endpoint `/api/webhooks/form-submission`
   - Implementar processamento de delivery
   - **Criar interface na sidebar**

2. **Plano de Ação** depois (`PLANO_PLANO_ACAO.md`)
   - Modificar webhook do Typebot
   - Implementar storage de PDFs (permanentes)
   - Configurar mapeamento de tenants

## 🔗 Links Úteis

- [Meta WhatsApp Cloud API - Document Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/document-messages)
- [Meta WhatsApp Cloud API - Media Upload](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media)

## ❓ Dúvidas?

Consulte os planos detalhados em cada arquivo. Cada plano contém:
- Fluxos completos
- Diagramas de sequência
- Lista de tasks por agente
- Variáveis de ambiente
- Critérios de aceite
- Troubleshooting

---

**Última atualização**: 2024-01-15  
**Versão**: 2.0
