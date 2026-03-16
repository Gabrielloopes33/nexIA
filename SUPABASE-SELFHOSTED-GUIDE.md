# Guia Supabase Self-Hosted - EasyPanel

## Problema
O template do EasyPanel não expõe as portas PostgreSQL (5432/6543) externamente por padrão. Apenas a porta 8000 (Kong API) está disponível.

## Solução 1: Abrir Porta via SSH (Recomendado)

### Passo 1: Acesse a VPS via SSH
```bash
ssh root@49.13.228.89
```

### Passo 2: Abra a porta no firewall
```bash
# Usando UFW (Ubuntu/Debian)
ufw allow 5432/tcp
ufw reload

# Ou usando iptables
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
iptables-save

# Ou usando firewalld (CentOS/RHEL)
firewall-cmd --permanent --add-port=5432/tcp
firewall-cmd --reload
```

### Passo 3: Verifique se a porta está aberta
```bash
netstat -tlnp | grep 5432
# ou
ss -tlnp | grep 5432
```

### Passo 4: Teste localmente
```bash
# No seu computador local
telnet 49.13.228.89 5432
# ou
Test-NetConnection -ComputerName 49.13.228.89 -Port 5432
```

---

## Solução 2: Túnel SSH (Alternativa Rápida)

Se não quiser abrir a porta no firewall, use um túnel SSH:

### Passo 1: Crie o túnel (em um terminal separado)
```bash
ssh -L 5432:localhost:5432 root@49.13.228.89 -N
```

### Passo 2: Atualize o .env.local
```bash
DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5432/postgres
```

### Passo 3: Inicie o servidor
```bash
pnpm dev
```

⚠️ **Nota:** Mantenha o terminal do túnel SSH aberto enquanto desenvolve.

---

## Solução 3: Cloudflare Tunnel (Mais Seguro)

Use o "Túnel Cloudflare" no menu do EasyPanel para criar um acesso seguro.

---

## Solução 4: Modificar Template EasyPanel (Avançado)

Se tiver acesso ao código do template, adicione no `docker-compose.yml`:

```yaml
db:
  ports:
    - "5432:5432"
```

Ou para o pooler:
```yaml
supavisor:
  ports:
    - "6543:6543"
```

---

## Verificação

Após aplicar qualquer solução, teste a conexão:

```bash
# No terminal do projeto
npx prisma db pull
```

Se funcionar, o Prisma conseguirá conectar!

---

## Segurança

⚠️ **Importante:** Ao abrir a porta 5432, restrinja ao seu IP:

```bash
# Substitua SEU_IP pelo seu IP atual
ufw allow from SEU_IP to any port 5432
```

Para descobrir seu IP: https://www.meuip.com.br/
