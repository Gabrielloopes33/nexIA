# 🌐 Configuração de DNS - Dev + Produção

Guia para configurar os domínios corretamente com ambiente de desenvolvimento (Netlify) e produção (VPS).

---

## 📋 Estrutura de Domínios

```
┌─────────────────────────────────────────────────────────────┐
│                      nexiachat.com.br                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PRODUÇÃO (VPS + EasyPanel)                                 │
│  ├── @ (root)           → IP_DA_VPS                         │
│  ├── www                → IP_DA_VPS                         │
│  ├── api                → IP_DA_VPS (Supabase API)          │
│  ├── studio             → IP_DA_VPS (Supabase Studio)       │
│  └── app                → IP_DA_VPS (opcional)              │
│                                                             │
│  DESENVOLVIMENTO (Netlify)                                  │
│  └── dev                → sites.netlify.com                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuração no DNS (Cloudflare, Route53, etc.)

### Registros A (Produção → VPS)

| Tipo | Nome | Valor | TTL | Proxy |
|------|------|-------|-----|-------|
| A | `@` | `IP_DA_VPS` | Auto | Sim (recomendado) |
| A | `www` | `IP_DA_VPS` | Auto | Sim (recomendado) |
| A | `api` | `IP_DA_VPS` | Auto | Sim (recomendado) |
| A | `studio` | `IP_DA_VPS` | Auto | Sim (recomendado) |

### Registro CNAME (Dev → Netlify)

| Tipo | Nome | Valor | TTL | Proxy |
|------|------|-------|-----|-------|
| CNAME | `dev` | `sites.netlify.com` | Auto | Não |

> ⚠️ **IMPORTANTE**: O subdomínio `dev` NÃO deve ter proxy (cloud) ativado para funcionar com o Netlify.

---

## ⚙️ Configuração no Netlify (dev.nexiachat.com.br)

### 1. Adicionar Domínio Personalizado

1. Acesse: [Netlify Dashboard](https://app.netlify.com/)
2. Selecione seu site
3. Vá em **Domain settings** → **Add custom domain**
4. Digite: `dev.nexiachat.com.br`
5. Clique em **Verify**

### 2. Configurar Variáveis de Ambiente (Dev)

No Netlify, configure:

```env
# Supabase (aponta para o mesmo do produção, ou use um projeto separado)
NEXT_PUBLIC_SUPABASE_URL=https://wqbppfngjolnxbwqngfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Auth
AUTH_SECRET=sua_chave_dev_aqui

# Meta OAuth (configure app dev separado ou use o mesmo)
META_APP_ID=seu_app_id
META_APP_SECRET=seu_secret
VITE_META_REDIRECT_URL=https://dev.nexiachat.com.br/meta-api/callback

# Ambiente
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=development
```

### 3. Deploy Settings

| Configuração | Valor |
|--------------|-------|
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node version | `20` |

---

## ⚙️ Configuração na VPS (Produção)

### EasyPanel - Domínios

Configure no EasyPanel para cada serviço:

#### 1. Aplicação NexIA
```
Domain: nexiachat.com.br
Port: 3000
HTTPS: ✅
```

#### 2. Supabase API
```
Domain: api.nexiachat.com.br
Port: 8000
HTTPS: ✅
```

#### 3. Supabase Studio
```
Domain: studio.nexiachat.com.br
Port: 3001
HTTPS: ✅
```

### Variáveis de Ambiente (Produção)

```env
# Supabase Self-Hosted
NEXT_PUBLIC_SUPABASE_URL=https://api.nexiachat.com.br
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_anon_key
SUPABASE_SERVICE_ROLE_KEY=seu_service_key

# Auth
AUTH_SECRET=sua_chave_producao_aqui

# Meta OAuth
META_APP_ID=seu_app_id
META_APP_SECRET=seu_secret
VITE_META_REDIRECT_URL=https://api.nexiachat.com.br/auth/v1/callback

# Banco
DATABASE_URL=postgresql://postgres:senha@db:5432/postgres

# Ambiente
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

---

## 🔒 Configuração do Facebook/Meta OAuth

### App de Produção

1. Acesse: [Facebook Developers](https://developers.facebook.com/apps)
2. Selecione seu app de produção
3. Vá em **Settings** → **Basic**
4. Configure:

```
App Domains:
- nexiachat.com.br
- api.nexiachat.com.br

Valid OAuth Redirect URIs:
- https://api.nexiachat.com.br/auth/v1/callback
- https://nexiachat.com.br/meta-api/callback
```

### App de Desenvolvimento (Opcional)

Crie um app separado para dev ou adicione:

```
App Domains:
- dev.nexiachat.com.br

Valid OAuth Redirect URIs:
- https://dev.nexiachat.com.br/meta-api/callback
```

---

## 🧪 Testando a Configuração

### Testes de DNS

```bash
# Verificar registros
dig +short nexiachat.com.br
dig +short dev.nexiachat.com.br

# Verificar propagação
dig @8.8.8.8 nexiachat.com.br
dig @1.1.1.1 dev.nexiachat.com.br

# Testar endpoints
curl -I https://nexiachat.com.br
curl -I https://dev.nexiachat.com.br
curl -I https://api.nexiachat.com.br
```

### Testes de SSL

```bash
# Verificar certificado SSL
echo | openssl s_client -servername nexiachat.com.br -connect nexiachat.com.br:443 2>/dev/null | openssl x509 -noout -dates -subject
```

---

## 🔄 Fluxo de Trabalho Recomendado

### 1. Desenvolvimento (Dev)

```
Local → Push → GitHub → Netlify (dev.nexiachat.com.br)
```

- Testes rápidos
- Validação com cliente
- CI/CD automático

### 2. Produção (VPS)

```
PR Merge → GitHub → EasyPanel (nexiachat.com.br)
```

- Código aprovado
- Ambiente estável
- Auto-deploy habilitado

---

## 📊 Comparação dos Ambientes

| Aspecto | Dev (Netlify) | Produção (VPS) |
|---------|---------------|----------------|
| **URL** | dev.nexiachat.com.br | nexiachat.com.br |
| **Infra** | Serverless (Netlify) | Docker + EasyPanel |
| **Banco** | Supabase Cloud | Supabase Self-Hosted |
| **Deploy** | Automático (push) | Automático (push) |
| **SSL** | Automático (Netlify) | Let's Encrypt (EasyPanel) |
| **Custo** | Grátis (limitado) | VPS pago |
| **Logs** | Netlify Dashboard | EasyPanel + Docker |

---

## ✅ Checklist DNS

- [ ] Registro A `@` apontando para VPS
- [ ] Registro A `www` apontando para VPS
- [ ] Registro A `api` apontando para VPS
- [ ] Registro A `studio` apontando para VPS
- [ ] Registro CNAME `dev` apontando para Netlify
- [ ] SSL configurado no Netlify (dev)
- [ ] SSL configurado no EasyPanel (produção)
- [ ] Facebook OAuth configurado para ambos domínios
- [ ] Testes de conectividade passando
- [ ] Health checks configurados

---

## 🆘 Troubleshooting

### "DNS_PROBE_FINISHED_NXDOMAIN"

**Causa**: DNS ainda propagando

**Solução**: Aguarde 24-48h ou force flush:
```bash
# Windows
ipconfig /flushdns

# Mac
sudo killall -HUP mDNSResponder
```

### SSL Certificate Error

**Causa**: Certificado não gerado

**Solução**:
- Netlify: SSL automático, aguarde
- EasyPanel: Verifique se domínio está correto e tente regerar certificado

### "This site can't be reached"

**Causa**: Firewall ou porta bloqueada

**Solução**:
```bash
# Verificar se serviço está rodando na VPS
ssh usuario@vps
docker ps

# Verificar firewall
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 8000
sudo ufw allow 3001
```

---

## 📚 Recursos

- [Cloudflare DNS Docs](https://developers.cloudflare.com/dns/)
- [Netlify Custom Domains](https://docs.netlify.com/domains-https/custom-domains/)
- [EasyPanel Documentation](https://easypanel.io/docs)
- [Facebook OAuth Setup](https://developers.facebook.com/docs/facebook-login/web)

---

## 🎉 Pronto!

Com essa configuração você terá:
- ✅ Ambiente de dev para testes rápidos
- ✅ Ambiente de produção robusto na VPS
- ✅ SSL em ambos ambientes
- ✅ DNS configurado corretamente
