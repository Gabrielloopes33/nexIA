# Funcionalidades dos Canais META

## 📱 WhatsApp Business API

### 1. Configuração e Conexão

#### ✅ Embedded Signup (Conexão Simplificada)
- **O que é:** Fluxo OAuth integrado do Facebook
- **Como funciona:** Usuário clica em botão, popup do Facebook abre, autoriza, pronto
- **Vantagens:**
  - Não precisa configurar WABA ID manualmente
  - Meta gerencia permissões automaticamente
  - Refresh token automático
  - Experiência nativa Facebook

#### ✅ Conexão Manual (Avançado)
- Inserir WABA ID, Phone Number ID e Access Token manualmente
- Útil para contas já existentes
- Validação automática dos dados

#### ✅ Múltiplas Instâncias
- Conectar vários números WhatsApp na mesma organização
- Cada número pode estar em unidades diferentes
- Gerenciamento independente por instância

---

### 2. Envio de Mensagens

#### ✅ Tipos de Mensagem Suportados

| Tipo | Descrição | Uso |
|------|-----------|-----|
| **Texto** | Mensagem simples de texto | Respostas rápidas |
| **Template** | Template pré-aprovado pela Meta | Iniciar conversa (fora 24h) |
| **Imagem** | JPG, PNG (até 5MB) | Catálogo, comprovantes |
| **Vídeo** | MP4 (até 16MB) | Tutoriais, demonstrações |
| **Áudio** | OPUS, MP3 | Mensagens de voz |
| **Documento** | PDF, DOC, etc (até 100MB) | Contratos, faturas |
| **Localização** | Coordenadas GPS | Endereço de loja |
| **Contatos** | Cartão de contato vCard | Compartilhar contato |
| **Reação** | Emoji como resposta | Curtir mensagem |
| **Interativo** | Botões, listas, CTAs | Menu de opções |

#### ✅ Recursos de Envio
- **Preview de URL:** Links com card de preview
- **Menções:** @nome em grupos (se suportado)
- **Respostas:** Citar mensagem específica
- **Edição:** Editar mensagem enviada (novo)

---

### 3. Templates de Mensagem

#### ✅ Sincronização Automática
- Buscar todos templates aprovados da conta WABA
- Atualizar status (PENDING, APPROVED, REJECTED)
- Cache local para performance

#### ✅ Categorias de Template

| Categoria | Quando Usar | Exemplo |
|-----------|-------------|---------|
| **UTILITY** | Transações, confirmações | "Seu pedido #123 foi enviado" |
| **MARKETING** | Promoções, campanhas | "50% OFF neste fim de semana" |
| **AUTHENTICATION** | Códigos OTP, 2FA | "Seu código é: 123456" |

#### ✅ Gerenciamento
- Visualizar todos templates
- Filtrar por categoria, idioma, status
- Preview do conteúdo
- Estatísticas de uso

---

### 4. Recebimento de Mensagens (Webhooks)

#### ✅ Eventos Processados

```
📥 Entrada:
├── messages (nova mensagem recebida)
│   ├── text
│   ├── image
│   ├── video
│   ├── audio
│   ├── document
│   ├── location
│   └── reaction
├── message_status (atualização de status)
│   ├── sent
│   ├── delivered
│   ├── read
│   └── failed
├── message_template_status_update
│   ├── APPROVED
│   ├── REJECTED
│   └── PAUSED
└── phone_number_quality_update
    ├── GREEN (qualidade alta)
    ├── YELLOW (atenção)
    └── RED (risco de ban)
```

#### ✅ Processamento de Entrada
1. **Validar webhook** (assinatura HMAC)
2. **Identificar instância** (phone_number_id)
3. **Buscar/criar contato** (pelo telefone)
4. **Buscar/criar conversa** (24h window)
5. **Salvar mensagem** no banco
6. **Notificar frontend** (WebSocket/SSE)
7. **Processar com IA** (se agente configurado)

---

### 5. Qualidade e Compliance

#### ✅ Quality Rating
- **GREEN:** Tudo certo, limite de mensagens normal
- **YELLOW:** Taxa de bloqueio alta, atenção necessária
- **RED:** Risco de suspensão, ação imediata necessária

#### ✅ Métricas Disponíveis
- Total de conversas (24h)
- Mensagens enviadas/entregues/lidas
- Taxa de falha
- Templates enviados
- Qualidade por número

#### ✅ Limites de Mensagens
| Tier | Limite/Dia | Critério |
|------|-----------|----------|
| 1 | 1.000 | Inicial |
| 2 | 10.000 | Após verificação |
| 3 | 100.000 | Qualidade mantida |
| Unlimited | Ilimitado | Empresa verificada |

---

### 6. Interface de Chat

#### ✅ Recursos da UI
- Lista de conversas (todos os canais)
- Indicador de janela 24h
- Status de entrega (✓, ✓✓, azul)
- Preview de mídia
- Busca de conversas
- Filtros por canal/status
- Atribuição a atendentes

---

## 📸 Instagram Business API

### 1. Configuração e Conexão

#### ✅ OAuth Flow
1. Usuário autoriza app no Facebook
2. Seleciona página vinculada
3. Sistema busca conta Instagram Business vinculada
4. Extrai: username, followers, media count, etc
5. Salva access token (long-lived, 60 dias)

#### ✅ Dados Sincronizados
- Instagram Business Account ID
- Username
- Followers count
- Media count (posts)
- Profile picture
- Biografia
- Website link

---

### 2. Instagram Direct (Mensagens)

#### ✅ Enviar Mensagens
- **Tipo:** Apenas texto (limitação da API)
- **Para:** Usuários que já iniciaram conversa
- **Limitação:** Não é possível iniciar conversa (usuário deve começar)

#### ✅ Receber Mensagens
- Texto
- Story mentions (menções em stories)
- Story replies (respostas a stories)
- Media shares (compartilhamentos)

#### ✅ Listar Conversações
- Ver todas as conversas ativas
- Ver participantes
- Ver histórico de mensagens
- Timestamp de cada mensagem

---

### 3. Métricas e Insights

#### ✅ Dados do Perfil
- Seguidores (total e crescimento)
- Total de posts
- Engajamento médio
- Alcance

#### ✅ Dados de Mídia
- Lista de posts recentes
- Likes, comments, shares
- Impressions
- Reach

---

## 🔄 Chat Unificado (Todos os Canais)

### ✅ Visão 360° do Cliente

```
Contato: João Silva
├── WhatsApp: +55 11 99999-9999
│   └── 15 conversas
├── Instagram: @joaosilva
│   └── 3 conversas  
└── Chat Widget (Site)
    └── 2 conversas
```

### ✅ Identificação de Contato
- Unificar contatos pelo telefone/email
- Mostrar histórico de todos os canais
- Identificar canal de origem

### ✅ Recursos Avançados
- **Transcrição de áudio:** Áudio para texto
- **Tradução automática:** Mensagens em outros idiomas
- **Resumos de conversa:** IA resume o histórico
- **Sugestões de resposta:** IA sugere respostas
- **Análise de sentimento:** Positivo/negativo/neutro

---

## 🎛️ Painel Administrativo

### 1. Configuração de Canais

#### ✅ Gerenciamento de Instâncias
```
Canais Conectados:
├── WhatsApp
│   ├── NexIA Suporte (+55 11 99999-9999) ✅
│   └── NexIA Vendas (+55 11 98888-8888) ✅
└── Instagram
    └── @nexia.chat ✅
```

#### ✅ Ações Disponíveis
- Conectar nova instância
- Desconectar instância
- Testar conexão
- Ver logs de erro
- Configurar webhook

---

### 2. Analytics Dashboard

#### ✅ Métricas por Canal
| Métrica | WhatsApp | Instagram |
|---------|----------|-----------|
| Conversas ativas | 150 | 45 |
| Mensagens/dia | 1.200 | 180 |
| Tempo médio resposta | 2m | 5m |
| Taxa de resolução | 85% | 70% |
| Satisfação (NPS) | 4.5/5 | 4.2/5 |

#### ✅ Relatórios
- Por período (diário, semanal, mensal)
- Por atendente
- Por canal
- Por tag/assunto

---

### 3. Gestão de Templates (WhatsApp)

#### ✅ Lista de Templates
```
Nome              Categoria    Status      Idioma
─────────────────────────────────────────────────
boas_vindas       UTILITY      APPROVED    pt_BR
promo_20_off      MARKETING    APPROVED    pt_BR
pedido_enviado    UTILITY      APPROVED    pt_BR
lembrete_agenda   UTILITY      PENDING     pt_BR
```

#### ✅ Ações
- Sincronizar com Meta
- Ver preview
- Ver estatísticas de uso
- Ver histórico de alterações

---

## 🔐 Segurança e Compliance

### ✅ Proteção de Dados
- Tokens criptografados no banco
- HTTPS obrigatório
- Validação de assinatura de webhooks
- Rate limiting nas APIs
- Logs de auditoria

### ✅ Conformidade LGPD/GDPR
- Consentimento explícito
- Exportação de dados do usuário
- Deleção de dados (direito ao esquecimento)
- Retenção configurável

### ✅ Conformidade Meta
- Opt-in obrigatório (usuário deve iniciar)
- Templates aprovados para mensagens fora da janela
- Respeitar window de 24h
- Qualidade do número mantida

---

## 📊 Comparativo: Antes vs Depois

| Funcionalidade | Sem META | Com META |
|----------------|----------|----------|
| **Canais** | Apenas widget | WhatsApp + Instagram + Widget |
| **Confiança** | Baixa (número desconhecido) | Alta (número verificado) |
| **Templates** | Não | Sim (mensagens proativas) |
| **Mídia** | Texto apenas | Texto, imagem, vídeo, áudio |
| **Status** | Não | Enviado, entregue, lido |
| **API Oficial** | Não | ✅ Sim |
| **Risco de Ban** | Alto (não oficial) | Baixo (API oficial) |
| **Escalabilidade** | Limitada | Ilimitada (por tiers) |

---

## 🎯 Próximos Passos Sugeridos

### Sprint 1: Foundation
- [ ] Implementar schemas do banco
- [ ] Setup de autenticação META
- [ ] Conexão básica WhatsApp

### Sprint 2: WhatsApp Completo
- [ ] Envio/recebimento de mensagens
- [ ] Sistema de templates
- [ ] Webhooks processando

### Sprint 3: Instagram
- [ ] Conexão Instagram
- [ ] Direct Messages
- [ ] Métricas básicas

### Sprint 4: Unificação
- [ ] Chat unificado
- [ ] Identificação de contatos
- [ ] Analytics dashboard

---

**Documento de funcionalidades - Versão 1.0**  
**Baseado no projeto piloto Aurea**
