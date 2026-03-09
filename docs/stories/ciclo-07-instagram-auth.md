# CICLO 7 — Instagram Auth + Connect

## Branch
`feat/ciclo-07-instagram-auth`

## Entregável
Fluxo de conexão Instagram funcionando e salvando no banco

---

## Resumo
Implementar fluxo completo de autenticação OAuth do Instagram Business, incluindo:
- Short-lived token exchange
- Long-lived token generation
- Páginas do Facebook → Instagram Business Account
- Salvar `InstagramInstance` no banco com token válido

---

## Checklist Técnico

### Backend
- [ ] Criar `/api/instagram/auth` - Inicia fluxo OAuth
- [ ] Criar `/api/instagram/auth/callback` - Recebe callback do Meta
- [ ] Implementar exchange short-lived → long-lived token
- [ ] Buscar páginas do usuário via `/me/accounts`
- [ ] Buscar Instagram Business Account de cada página
- [ ] Salvar `InstagramInstance` no banco (Prisma)
- [ ] Remover dependência `CENTRAL_AGENT_ID` hardcodado

### Frontend
- [ ] Criar página `/integracoes/instagram/connect`
- [ ] Seguir visual da página WhatsApp connect
- [ ] Botão "Conectar Instagram" com estado de loading
- [ ] Feedback de sucesso/erro

### DevOps
- [ ] Configurar permissões `instagram_basic`, `instagram_manage_messages` no app Meta
- [ ] Configurar URL de callback no Meta Developer Portal

### QA
- [ ] Fluxo OAuth completo sem erros
- [ ] Token long-lived válido salvo no banco
- [ ] Instância aparece na listagem

---

## Fluxo OAuth Instagram

```
1. Usuário clica "Conectar Instagram"
   ↓
2. Redireciona para Facebook OAuth
   https://www.facebook.com/v18.0/dialog/oauth?
     client_id={APP_ID}
     &redirect_uri={REDIRECT_URI}
     &scope=instagram_basic,instagram_manage_messages,pages_read_engagement
   ↓
3. Usuário autoriza
   ↓
4. Callback recebe `code`
   ↓
5. Exchange code → short-lived token
   POST https://graph.facebook.com/v18.0/oauth/access_token
   ↓
6. Exchange short-lived → long-lived token
   GET https://graph.facebook.com/v18.0/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id={APP_ID}
     &client_secret={APP_SECRET}
     &fb_exchange_token={SHORT_TOKEN}
   ↓
7. Buscar páginas: GET /me/accounts?access_token={LONG_TOKEN}
   ↓
8. Para cada página, buscar Instagram Business Account
   GET /{page-id}?fields=instagram_business_account
   ↓
9. Salvar InstagramInstance no banco
```

---

## Schema InstagramInstance

```prisma
model InstagramInstance {
  id              String   @id @default(uuid())
  organizationId  String   @map("organization_id")
  instagramId     String   @unique @map("instagram_id")
  username        String
  name            String?
  profilePictureUrl String? @map("profile_picture_url")
  accessToken     String   @map("access_token") // Encrypted
  pageAccessToken String?  @map("page_access_token")
  pageId          String   @map("page_id")
  status          InstagramInstanceStatus @default(NOT_CONNECTED)
  connectedAt     DateTime? @map("connected_at")
  lastSyncAt      DateTime? @map("last_sync_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id])
  conversations   Conversation[]
}

enum InstagramInstanceStatus {
  NOT_CONNECTED
  CONNECTED
  ERROR
}
```

---

## API Endpoints

### GET /api/instagram/auth
Inicia fluxo OAuth, retorna URL de autorização.

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://www.facebook.com/v18.0/dialog/oauth?..."
  }
}
```

### GET /api/instagram/auth/callback
Recebe callback do Meta após autorização.

**Query Parameters:**
- `code` - Authorization code
- `error` - (opcional) Erro de autorização

**Response (sucesso):**
```json
{
  "success": true,
  "data": {
    "instance": {
      "id": "...",
      "instagramId": "...",
      "username": "...",
      "name": "...",
      "profilePictureUrl": "...",
      "status": "CONNECTED"
    }
  }
}
```

**Response (erro):**
```json
{
  "success": false,
  "error": "..."
}
```

### GET /api/instagram/instances
Lista instâncias Instagram da organização.

**Response:**
```json
{
  "success": true,
  "data": [{
    "id": "...",
    "instagramId": "...",
    "username": "...",
    "name": "...",
    "profilePictureUrl": "...",
    "status": "CONNECTED",
    "connectedAt": "..."
  }]
}
```

---

## Componentes UI

### InstagramConnectButton
```typescript
interface Props {
  onSuccess: (instance: InstagramInstance) => void;
  onError: (error: Error) => void;
}
```

### InstagramConnectPage
- Header com título e breadcrumb
- Card explicativo do fluxo
- Botão de conectar
- Lista de instâncias conectadas

---

## Referências

- Arquivo Aurea: `apps/aurea/supabase/functions/meta-instagram-auth/index.ts`
- Meta Graph API: https://developers.facebook.com/docs/instagram-api/getting-started
- Long-lived tokens: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived

---

## Notas

- Token long-lived válido por ~60 dias
- Deve ser renovado antes do vencimento
- Instagram Business Account só existe para páginas do Facebook conectadas
- Necessário permissão `pages_read_engagement` para listar páginas
