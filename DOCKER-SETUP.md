# 🐳 Configuração Docker - NexIA

Resumo completo da configuração Docker do projeto NexIA para deploy em VPS.

---

## ✅ Status Atual

| Requisito | Status | Arquivo |
|-----------|--------|---------|
| docker-compose.yml na raiz | ✅ OK | `docker-compose.yml` |
| Dockerfile para build | ✅ OK | `Dockerfile` |
| Dockerfile otimizado EasyPanel | ✅ OK | `Dockerfile.easypanel` |
| Docker Compose Produção | ✅ OK | `docker-compose.prod.yml` |
| Docker Compose Portainer | ✅ OK | `docker-compose.portainer.yml` |
| Workflow CI/CD GHCR | ✅ OK | `.github/workflows/docker-publish.yml` |
| Scripts de deploy | ✅ OK | `scripts/deploy.sh`, `scripts/easypanel-entrypoint.sh` |
| Documentação deploy | ✅ OK | `DEPLOY.md`, `EASYPANEL.md` |

---

## 📁 Arquivos Docker

### 1. docker-compose.yml (Desenvolvimento)
**Uso:** Desenvolvimento local com PostgreSQL e Redis
```bash
docker-compose up -d
```
**Serviços:**
- `app`: Aplicação Next.js (build local)
- `db`: PostgreSQL 15
- `redis`: Redis 7 (cache/sessões)

### 2. docker-compose.prod.yml (Produção - Build Local)
**Uso:** Produção construindo imagem localmente na VPS
```bash
# Build imagem
docker build -t nexia-app:latest .

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```
**Características:**
- Usa imagem `nexia-app:latest` (build local)
- Health check configurado
- Rede isolada

### 3. docker-compose.portainer.yml (Produção - Imagem GHCR) ⭐ NOVO
**Uso:** Portainer com imagem pré-construída do GitHub Container Registry
```bash
# No Portainer, usar este arquivo como stack
docker-compose -f docker-compose.portainer.yml up -d
```
**Características:**
- Usa imagem `ghcr.io/gabrielloopes33/nexia:latest`
- Sem necessidade de build na VPS
- Volume para uploads persistentes
- Health check configurado

### 4. Dockerfile (Padrão)
**Uso:** Build multi-stage para produção
**Stages:**
1. `deps`: Instala dependências com pnpm
2. `builder`: Build da aplicação Next.js
3. `runner`: Runtime otimizado ( Alpine, non-root user )

### 5. Dockerfile.easypanel
**Uso:** Otimizado para deploy no EasyPanel
**Diferenças:**
- Entrypoint personalizado para migrações automáticas
- Health check integrado
- Inclui Prisma CLI para migrações

---

## 🔄 CI/CD - GitHub Actions

### Workflow: docker-publish.yml

**Arquivo:** `.github/workflows/docker-publish.yml`

**Triggers:**
- ✅ Push na branch `main` → publica `ghcr.io/gabrielloopes33/nexia:main`
- ✅ Push de tags `v*` → publica versões semver
- ✅ Pull requests → apenas build (não publica)
- ✅ Manual (`workflow_dispatch`)

**Funcionalidades:**
- Build multi-plataforma: `linux/amd64`, `linux/arm64`
- Cache de camadas Docker (GitHub Actions Cache)
- Tags automáticas:
  - `latest` (para main)
  - `main` / `master`
  - `v1.0.0`, `v1.0`, `v1` (para releases)
  - SHA do commit

**Como usar a imagem:**
```yaml
# docker-compose.portainer.yml
services:
  app:
    image: ghcr.io/gabrielloopes33/nexia:latest
    # ou uma versão específica:
    # image: ghcr.io/gabrielloopes33/nexia:v1.0.0
```

---

## 🚀 Opções de Deploy

### Opção 1: EasyPanel (Recomendado)
```bash
# Usar Dockerfile.easypanel
# Build automático a cada push
```
📖 Veja: [EASYPANEL.md](./EASYPANEL.md)

### Opção 2: Portainer + GHCR (Recomendado)
```bash
# Usar docker-compose.portainer.yml
# Pull de imagem pré-construída
```
📖 Veja seção no [DEPLOY.md](./DEPLOY.md#-deploy-com-portainer-imagem-ghcr)

### Opção 3: Docker Manual
```bash
# Build local + docker-compose.prod.yml
docker build -t nexia-app:latest .
docker-compose -f docker-compose.prod.yml up -d
```

### Opção 4: Docker Compose Desenvolvimento
```bash
# Desenvolvimento com PostgreSQL local
docker-compose up -d
```

---

## 📋 Checklist para Deploy

### Usando EasyPanel
- [ ] VPS com EasyPanel instalado
- [ ] Banco PostgreSQL criado no EasyPanel
- [ ] Variáveis de ambiente configuradas
- [ ] Repositório GitHub conectado
- [ ] Dockerfile.easypanel selecionado
- [ ] Domínio configurado

### Usando Portainer + GHCR
- [ ] VPS com Docker e Portainer instalados
- [ ] GitHub Actions executado ao menos uma vez (para criar a imagem)
- [ ] Banco PostgreSQL configurado
- [ ] Arquivo `docker-compose.portainer.yml` carregado no Portainer
- [ ] Environment variables configuradas no Portainer
- [ ] Domínio apontando para VPS

---

## 🔧 Comandos Úteis

### Build local
```bash
# Build imagem
docker build -t nexia-app:latest .

# Ver imagens
docker images | grep nexia
```

### Push manual (se necessário)
```bash
# Login no GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag imagem
docker tag nexia-app:latest ghcr.io/gabrielloopes33/nexia:latest

# Push
docker push ghcr.io/gabrielloopes33/nexia:latest
```

### Verificar imagem publicada
```bash
# Pull imagem do GHCR
docker pull ghcr.io/gabrielloopes33/nexia:latest

# Inspecionar
docker inspect ghcr.io/gabrielloopes33/nexia:latest
```

---

## 🔗 URLs Importantes

| Recurso | URL |
|---------|-----|
| Repositório GitHub | `https://github.com/Gabrielloopes33/nexIA` |
| GitHub Container Registry | `ghcr.io/gabrielloopes33/nexia` |
| Imagens Publicadas | https://github.com/Gabrielloopes33/nexIA/pkgs/container/nexia |

---

## 📝 Notas

1. **A imagem GHCR é pública?** Sim, por padrão imagens em repositórios públicos são públicas.

2. **Como atualizar a imagem?** Faça push na branch `main` e o workflow atualizará automaticamente.

3. **Posso usar uma versão específica?** Sim, use tags como `ghcr.io/gabrielloopes33/nexia:v1.0.0`.

4. **O que acontece se o build falhar?** Verifique os logs no GitHub Actions na aba "Actions" do repositório.
