# CICLO 4 — Embedded Signup Real

**Branch:** `feat/ciclo-04-embedded-signup-real`
**Entregável:** Fluxo completo de conexão WhatsApp via Embedded Signup salvando no banco real

---

## Resumo

Este ciclo implementa o fluxo completo de conexão WhatsApp Business via Embedded Signup da Meta, substituindo mocks/todos pela lógica real de salvamento no banco.

## Arquitetura do Fluxo

```
1. Usuário clica em "Conectar WhatsApp"
   ↓
2. EmbeddedSignupButton abre popup Facebook (FB.login)
   ↓
3. Usuário autoriza no Meta
   ↓
4. Popup redireciona para callback com code
   ↓
5. Backend troca code por tokens + WABA info
   ↓
6. Salva WhatsAppInstance no banco
   ↓
7. Redireciona de volta ao app com sucesso
```

## Componentes

### EmbeddedSignupButton
- Localização: `components/integrations/EmbeddedSignupButton.tsx`
- Props:
  ```typescript
  interface EmbeddedSignupButtonProps {
    organizationId: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
  ```
- Usa shadcn/ui Button com variant "default"
- Loading state durante o processo
- Abre popup via FB.login com config_id

## API Routes

### POST /api/whatsapp/embedded-signup/config
Retorna configuração necessária para o botão:
```json
{
  "appId": "string",
  "configId": "string",
  "apiVersion": "v18.0"
}
```

### GET/POST /api/whatsapp/embedded-signup/callback
Callback OAuth do Meta:
- Recebe `code` como query param
- Troca code por access_token via /oauth/access_token
- Busca WABA info via /debug_token
- Busca números de telefone associados
- Cria/Atualiza WhatsAppInstance
- Redireciona para `/integracoes/whatsapp?success=true`

## Lógica de Salvamento (saveWhatsAppInstance)

```typescript
async function saveWhatsAppInstance(data: {
  organizationId: string;
  wabaId: string;
  phoneNumberId: string;
  phoneNumber: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}) {
  // 1. Calcula tokenExpiresAt
  // 2. Upsert WhatsAppInstance
  // 3. Atualiza status para CONNECTED
  // 4. Retorna instância criada
}
```

## Variáveis de Ambiente

```bash
# Meta App Configuration
META_APP_ID=seu_app_id
META_APP_SECRET=seu_app_secret
META_CONFIG_ID=seu_config_id
FACEBOOK_API_VERSION=v18.0

# Webhook
WEBHOOK_VERIFY_TOKEN=token_aleatorio_seguro
```

## Critérios de Aceite

- [x] Clicar em "Conectar WhatsApp" abre popup Meta
- [x] Após autorizar, instância aparece salva no banco
- [x] Status exibido corretamente na UI
- [x] Token de acesso guardado (sem expor na resposta da API)
- [x] Visual do botão segue design system do CRM

## Testes QA

1. Fluxo feliz:
   - Clicar botão → popup abre → autorizar → callback → instância salva → redirect
   
2. Fluxo erro:
   - Cancelar no popup → mensagem de erro apropriada
   - Erro no callback → log salvo, mensagem amigável

3. Segurança:
   - Token não exposto no cliente
   - Code só pode ser usado uma vez

## Decisões Arquiteturais

1. **Popup vs Redirect**: Usar popup (FB.login) para melhor UX
2. **Token Storage**: Salvar access_token criptografado ou usar refresh strategy
3. **Upsert**: Se WABA já existe, atualizar tokens ao invés de criar duplicado
4. **Phone Number**: Usar display_phone_number do Meta, formatar para DB

## Notas

- O fluxo Tech Provider não requer redirect_uri
- O config_id deve ser criado no Meta Developer Portal
- O app deve estar em modo "Business Verification" para produção
