# WhatsApp Embedded Signup Flow

Esta documentação descreve a implementação do fluxo **Embedded Signup** do WhatsApp Business API da Meta.

## Visão Geral

O Embedded Signup é um fluxo OAuth que permite aos usuários conectar suas contas WhatsApp Business sem sair da aplicação. O usuário autoriza o aplicativo através do Facebook Login, e o sistema obtém automaticamente os tokens de acesso e informações da conta WABA.

## Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Facebook SDK   │────▶│  Facebook Login │
│  (React/Next)   │     │   (fb.js)        │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                               │
         │                                               │
         ▼                                               ▼
┌─────────────────┐                          ┌─────────────────┐
│  useEmbedded-   │                          │  Authorization  │
│    Signup Hook  │◀─────────────────────────│     Code        │
└─────────────────┘                          └─────────────────┘
         │
         │ POST /api/whatsapp/embedded-signup/callback
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Backend API   │────▶│  Graph API (Meta)│────▶│  Access Token   │
│   (Next.js API) │     │                  │     │  + WABA Info    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Database      │
│  (Mock/Prisma)  │
└─────────────────┘
```

## Arquivos Criados/Modificados

### 1. Hook: `hooks/use-embedded-signup.ts`

Hook React que gerencia todo o fluxo de Embedded Signup:

```typescript
const {
  status,           // Estado atual do fluxo
  error,            // Erro, se houver
  isLoading,        // Se está processando
  result,           // Resultado da conexão
  launchSignup,     // Inicia o fluxo
  handleCallback,   // Processa callback
  reset,            // Reseta o estado
} = useEmbeddedSignup()
```

**Estados do fluxo:**
- `idle` - Estado inicial
- `loading_sdk` - Carregando configuração
- `initializing` - Inicializando SDK
- `waiting_auth` - Aguardando autorização do usuário
- `exchanging_token` - Trocando código por token
- `fetching_waba` - Buscando informações da conta
- `success` - Conexão bem-sucedida
- `error` - Erro no processo

### 2. Componente de Fluxo: `components/whatsapp/connect/embedded-signup-flow.tsx`

Componente visual completo com:
- Tela inicial com permissões necessárias
- Indicador de progresso visual
- Estados de carregamento
- Tela de sucesso com detalhes da conta
- Tratamento de erros

### 3. Botão Atualizado: `components/whatsapp/connect/embedded-signup-button.tsx`

Botão que inicia o fluxo de conexão. Suporta:
- Fluxo legacy (mock) para desenvolvimento
- Novo fluxo Embedded Signup real
- Estados de loading
- Callbacks de sucesso e erro

### 4. API de Configuração: `app/api/whatsapp/embedded-signup/config/route.ts`

Endpoint `GET /api/whatsapp/embedded-signup/config`

Retorna:
```json
{
  "configId": "string",
  "appId": "string",
  "apiVersion": "v18.0"
}
```

### 5. API de Callback: `app/api/whatsapp/embedded-signup/callback/route.ts`

Endpoint `POST /api/whatsapp/embedded-signup/callback`

Request:
```json
{
  "code": "authorization_code_from_facebook"
}
```

Response:
```json
{
  "success": true,
  "account": {
    "id": "string",
    "name": "string",
    "wabaId": "string",
    "status": "connected",
    "phoneNumbers": [...]
  },
  "accessToken": "string"
}
```

## Configuração

### 1. Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Facebook App Configuration
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_EMBEDDED_SIGNUP_CONFIG_ID=your_config_id
FACEBOOK_API_VERSION=v18.0
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/whatsapp/embedded-signup/callback
```

### 2. Configuração no Facebook Developers

1. Acesse https://developers.facebook.com/apps
2. Crie um novo app ou use um existente
3. Adicione o produto "WhatsApp"
4. Em **Configuração da API**, ative o **Embedded Signup**
5. Copie o **Configuration ID** para `FACEBOOK_EMBEDDED_SIGNUP_CONFIG_ID`
6. Copie o **App ID** para `FACEBOOK_APP_ID`
7. Copie o **App Secret** para `FACEBOOK_APP_SECRET`
8. Configure os **OAuth Redirect URIs**:
   - `http://localhost:3000/api/whatsapp/embedded-signup/callback` (dev)
   - `https://seu-dominio.com/api/whatsapp/embedded-signup/callback` (prod)

### 3. Permissões Necessárias

O app precisa das seguintes permissões:
- `whatsapp_business_management`
- `whatsapp_business_messaging`
- `business_management`

## Fluxo de Uso

### 1. Iniciar Conexão

```tsx
import { EmbeddedSignupButton } from "@/components/whatsapp/connect/embedded-signup-button"

function MyPage() {
  return (
    <EmbeddedSignupButton
      onSuccess={() => toast.success("Conectado!")}
      onError={(err) => toast.error(err)}
    />
  )
}
```

### 2. Usar o Hook Diretamente

```tsx
import { useEmbeddedSignup } from "@/hooks/use-embedded-signup"

function CustomFlow() {
  const { status, error, launchSignup, result } = useEmbeddedSignup()

  return (
    <button onClick={launchSignup} disabled={status !== "idle"}>
      {status === "idle" ? "Conectar" : "Conectando..."}
    </button>
  )
}
```

### 3. Usar o Componente de Fluxo

```tsx
import { EmbeddedSignupFlow } from "@/components/whatsapp/connect/embedded-signup-flow"

function MyPage() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Conectar WhatsApp</button>
      
      <EmbeddedSignupFlow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(data) => console.log(data)}
        onError={(err) => console.error(err)}
      />
    </>
  )
}
```

## Desenvolvimento

### Modo Mock

Quando as variáveis de ambiente não estão configuradas, o sistema automaticamente usa dados mock em desenvolvimento:

```
[EmbeddedSignup Config] Using mock configuration for development
[EmbeddedSignup Callback] Using mock implementation for development
```

### Logs de Debug

Todos os componentes e hooks possuem logs detalhados para debugging:

```
[EmbeddedSignup] Fetching configuration...
[EmbeddedSignup] Loading Facebook SDK...
[EmbeddedSignup] Facebook SDK initialized
[EmbeddedSignup] Launching Facebook Login...
[EmbeddedSignup] Token exchanged successfully
```

## Testes

### Testar Endpoint de Configuração

```bash
curl http://localhost:3000/api/whatsapp/embedded-signup/config
```

### Testar Endpoint de Callback

```bash
curl -X POST http://localhost:3000/api/whatsapp/embedded-signup/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "test_code"}'
```

## Troubleshooting

### Erro: "Missing environment variables"

**Solução:** Configure as variáveis de ambiente no `.env.local`

### Erro: "Failed to load Facebook SDK"

**Possíveis causas:**
- Ad blockers bloqueando o script
- Problemas de conectividade
- Configuração incorreta do App ID

### Erro: "Token exchange failed"

**Possíveis causas:**
- Código expirado (válido por poucos minutos)
- App Secret incorreto
- Redirect URI não configurado corretamente

### Erro: "No businesses found"

**Solução:** O usuário precisa ter acesso a um Business Manager no Facebook

## Referências

- [Meta Embedded Signup Documentation](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [Facebook Login for Web](https://developers.facebook.com/docs/facebook-login/web)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api)
