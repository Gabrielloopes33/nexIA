# Prompts de Execução — Páginas Faltantes CONTATOS
# NexIA Chat · Next.js 15 · TypeScript · Tailwind · shadcn/ui
# Gerado por: @architect (Aria) · 2026-03-05

> Cada bloco abaixo é um prompt completo, independente, para ser colado em um agente IA.
> O agente executor deve usar **@dev** + skill **coding-guidelines** salvo indicação contrária.

---

## ═══════════════════════════════════════════
## BLOCO 1 — /contatos/novo
## ═══════════════════════════════════════════

```
AGENTE: @dev
SKILL: coding-guidelines

Você é um desenvolvedor especialista em Next.js 15, TypeScript e Tailwind CSS.
Trabalha no projeto NexIA Chat — um CRM Dashboard.

=== CONTEXTO DO PROJETO ===

Stack: Next.js 15 App Router · TypeScript · Tailwind CSS · Radix UI (shadcn/ui)
Cor primária: #9795e4 | hover: #7c7ab8 | light bg: #9795e4/10
Ícones: lucide-react
Formulários: React Hook Form + Zod (já instalados)
Componentes UI disponíveis em: @/components/ui/{button,input,label,select,textarea,badge,dialog,card,separator,switch}
Sidebar principal: @/components/sidebar → <Sidebar />
Sub-sidebar contatos: @/components/contacts/contacts-sub-sidebar → <ContactsSubSidebar />
Dados mock: @/lib/mock/contacts → MOCK_CONTACTS, Contact interface
Tags mock: @/lib/mock/tags → MOCK_TAGS, Tag interface

=== INTERFACE Contact (já existe em @/lib/mock/contacts.ts) ===

interface Contact {
  id: string
  nome: string
  sobrenome: string
  email: string
  telefone: string
  cidade: string
  estado: string
  cargo: string
  empresa: string
  instagram?: string
  linkedin?: string
  tags: string[]
  leadScore: number
  status: "ativo" | "inativo" | "pendente" | "convertido"
  origem: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  criadoEm: string
  atualizadoEm: string
  atualizadoPor: string
  avatar?: string
  avatarBg?: string
  ultimoContato?: string
  observacoes?: string
}

=== PADRÃO DE LAYOUT (seguir EXATAMENTE) ===

"use client"

export default function NomeDaPagina() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-shrink-0">
        <ContactsSubSidebar />
      </div>
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* conteúdo */}
      </main>
    </div>
  )
}

=== TAREFA ===

Crie o arquivo: app/contatos/novo/page.tsx

Esta é a página de criação de um novo contato.

REQUISITOS:
1. Layout padrão acima com Sidebar + ContactsSubSidebar
2. Header com:
   - Breadcrumb: "Contatos / Novo Contato" (usando Link do next/link)
   - Título: "Novo Contato"
   - Botão "Cancelar" (variant="outline") → redireciona para /contatos
3. Formulário usando React Hook Form + Zod com os seguintes campos divididos em seções:

   SEÇÃO "Informações Pessoais" (Card):
   - Nome* (Input, obrigatório, min 2 chars)
   - Sobrenome* (Input, obrigatório)
   - Email* (Input type="email", obrigatório, validação Zod email)
   - Telefone* (Input, obrigatório)

   SEÇÃO "Empresa" (Card):
   - Empresa (Input)
   - Cargo (Input)

   SEÇÃO "Localização" (Card):
   - Cidade (Input)
   - Estado (Select com os estados brasileiros: AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO)

   SEÇÃO "Redes Sociais" (Card):
   - Instagram (Input, placeholder="@usuario")
   - LinkedIn (Input, placeholder="linkedin.com/in/usuario")

   SEÇÃO "CRM" (Card):
   - Status (Select: ativo/inativo/pendente/convertido, default: "pendente")
   - Origem (Input, placeholder="Ex: Facebook Ads, Webinar, Indicação")
   - Tags (renderizar os MOCK_TAGS como checkboxes coloridos — cada tag como um badge clicável com sua cor)
   - Lead Score (input type="range" 0-100, mostrar valor atual, accent-[#9795e4])

   SEÇÃO "UTM" (Card, colapsável por padrão usando useState):
   - UTM Source (Input)
   - UTM Medium (Input)
   - UTM Campaign (Input)
   - Botão para expandir/colapsar a seção com ChevronDown/ChevronUp

   SEÇÃO "Observações" (Card):
   - Observações (Textarea, 4 linhas)

4. Botão "Salvar Contato" no final do form, cor bg-[#9795e4] hover:bg-[#7c7ab8]
5. Ao submeter:
   - Validar com Zod
   - Gerar id: "cont-" + Date.now()
   - Gerar avatar: iniciais (primeira letra do nome + primeira letra do sobrenome em maiúsculas)
   - Gerar avatarBg: usar uma das cores ["#E8E7F7","#FFF3E0","#E8F5E9","#E3F2FD","#FCE4EC"] aleatoriamente
   - criadoEm e atualizadoEm: new Date().toISOString()
   - atualizadoPor: "Admin"
   - Exibir toast de sucesso (usar sonner: import { toast } from "sonner")
   - Redirecionar para /contatos usando useRouter do next/navigation
6. Mostrar erros de validação abaixo de cada campo usando <p className="text-xs text-red-500">

LAYOUT DO FORMULÁRIO:
- Em desktop (md+): 2 colunas para campos lado a lado dentro de cada Card
- Em mobile: 1 coluna
- Cards com className="rounded-sm border border-border bg-white p-4 md:p-6"
- Espaçamento entre cards: gap-4 em flex flex-col

ESTRUTURA DO ARQUIVO:
- Schema Zod definido fora do componente
- useForm tipado com o schema Zod
- Funções puras para geração de avatar/cor fora do componente
- Sem comentários óbvios, código limpo e auto-documentado

Gere APENAS o arquivo app/contatos/novo/page.tsx completo e funcional.
```

---

## ═══════════════════════════════════════════
## BLOCO 2 — /contatos/listas
## ═══════════════════════════════════════════

```
AGENTE: @dev
SKILL: coding-guidelines

Você é um desenvolvedor especialista em Next.js 15, TypeScript e Tailwind CSS.
Trabalha no projeto NexIA Chat — um CRM Dashboard.

=== CONTEXTO DO PROJETO ===

Stack: Next.js 15 App Router · TypeScript · Tailwind CSS · Radix UI (shadcn/ui)
Cor primária: #9795e4 | hover: #7c7ab8 | light bg: #9795e4/10
Ícones: lucide-react
Componentes UI: @/components/ui/{button,input,label,badge,dialog,card,table,dropdown-menu,separator}
Sidebar: @/components/sidebar → <Sidebar />
Sub-sidebar contatos: @/components/contacts/contacts-sub-sidebar → <ContactsSubSidebar />

=== PADRÃO DE LAYOUT ===

"use client"
export default function Page() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-shrink-0"><ContactsSubSidebar /></div>
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* conteúdo */}
      </main>
    </div>
  )
}

=== TAREFA ===

Crie DOIS arquivos:

--- ARQUIVO 1: lib/mock/lists.ts ---

Defina e exporte:

export interface ContactList {
  id: string
  nome: string
  descricao?: string
  cor: string
  contatosCount: number
  contatosIds: string[]
  criadoEm: string
  atualizadoEm: string
  criadoPor: string
}

export const MOCK_LISTS: ContactList[] = [
  // 6 listas de exemplo realistas para um CRM:
  // Ex: "Clientes VIP", "Leads do Webinar Março", "Prospects Frios",
  //     "Parceiros Estratégicos", "Newsletter Julho", "Abandono de Carrinho"
  // Cada lista com: id "list-001" a "list-006", cor variada (#9795e4 e outras),
  // contatosCount entre 8 e 120, criadoEm nos últimos 6 meses
]

export const LIST_COLORS = [
  "#9795e4", "#7c7ab8", "#b3b3e5",
  "#E57373", "#81C784", "#64B5F6",
  "#FFB74D", "#BA68C8", "#4DB6AC"
]

--- ARQUIVO 2: app/contatos/listas/page.tsx ---

REQUISITOS:
1. Layout padrão com Sidebar + ContactsSubSidebar
2. Header:
   - Título "Listas" + contagem "X listas"
   - Botão "Criar Lista" (bg-[#9795e4] hover:bg-[#7c7ab8], ícone Plus)
3. Cards de estatísticas no topo (3 cards lado a lado):
   - Total de Listas (ícone List)
   - Total de Contatos em Listas (soma de todos contatosCount, ícone Users)
   - Maior Lista (nome da lista com mais contatos, ícone TrendingUp)
   Cards com: className="rounded-sm border border-border bg-white p-4"
4. Barra de busca (Input com ícone Search à esquerda, max-w-md)
5. Tabela com colunas:
   - Nome (badge colorido com cor da lista + nome)
   - Descrição (text-muted-foreground, truncada)
   - Contatos (número)
   - Criado em (formatar data: DD/MM/AAAA)
   - Ações (DropdownMenu com: Editar, Ver Contatos, Excluir)
   Tabela: className="rounded-sm border border-border bg-white"
6. Estado vazio (quando lista filtrada vazia):
   - Ícone List grande centralizado (text-muted-foreground, h-12 w-12)
   - Texto "Nenhuma lista encontrada"
   - Sub-texto "Crie uma lista para organizar seus contatos"
   - Botão "Criar Lista"
7. Dialog para criar/editar lista (mesmo Dialog do shadcn/ui):
   - Campos: Nome* (Input), Descrição (Textarea 2 linhas), Cor (picker igual ao de tags: botões circulares com as LIST_COLORS)
   - Botões: Cancelar | Criar Lista / Salvar
   - Ao salvar: gerar id "list-" + Date.now(), adicionar/atualizar no estado local
8. Confirmação de exclusão:
   - Usar segundo Dialog com texto "Tem certeza que deseja excluir a lista '{nome}'? Esta ação não pode ser desfeita."
   - Botão "Excluir" em vermelho (bg-red-600 hover:bg-red-700)

ESTADO LOCAL:
- useState<ContactList[]> inicializado com MOCK_LISTS
- useState para busca, dialog aberto, editing item, confirmação exclusão

Gere ambos os arquivos completos.
```

---

## ═══════════════════════════════════════════
## BLOCO 3 — /contatos/segmentos
## ═══════════════════════════════════════════

```
AGENTE: @dev
SKILL: coding-guidelines

Você é um desenvolvedor especialista em Next.js 15, TypeScript e Tailwind CSS.
Trabalha no projeto NexIA Chat — um CRM Dashboard.

=== CONTEXTO DO PROJETO ===

Stack: Next.js 15 App Router · TypeScript · Tailwind CSS · Radix UI (shadcn/ui)
Cor primária: #9795e4 | hover: #7c7ab8 | light bg: #9795e4/10
Ícones: lucide-react
Componentes UI: @/components/ui/{button,input,label,badge,dialog,card,select,separator,dropdown-menu}
Sidebar: @/components/sidebar → <Sidebar />
Sub-sidebar: @/components/contacts/contacts-sub-sidebar → <ContactsSubSidebar />
Dados mock: @/lib/mock/contacts → MOCK_CONTACTS, Contact

=== PADRÃO DE LAYOUT ===

"use client"
export default function Page() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-shrink-0"><ContactsSubSidebar /></div>
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* conteúdo */}
      </main>
    </div>
  )
}

=== TAREFA ===

Crie DOIS arquivos:

--- ARQUIVO 1: lib/mock/segments.ts ---

export type RuleField = "status" | "leadScore" | "origem" | "tags" | "cidade" | "estado" | "empresa"
export type RuleOperator = "equals" | "not_equals" | "contains" | "greater_than" | "less_than"

export interface SegmentRule {
  id: string
  field: RuleField
  operator: RuleOperator
  value: string | number
}

export interface Segment {
  id: string
  nome: string
  descricao?: string
  cor: string
  regras: SegmentRule[]
  operador: "AND" | "OR"
  contatosCount: number
  criadoEm: string
  atualizadoEm: string
}

export const RULE_FIELDS: { value: RuleField; label: string }[] = [
  { value: "status", label: "Status" },
  { value: "leadScore", label: "Lead Score" },
  { value: "origem", label: "Origem" },
  { value: "tags", label: "Tags" },
  { value: "cidade", label: "Cidade" },
  { value: "estado", label: "Estado" },
  { value: "empresa", label: "Empresa" },
]

export const RULE_OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: "equals", label: "é igual a" },
  { value: "not_equals", label: "não é igual a" },
  { value: "contains", label: "contém" },
  { value: "greater_than", label: "maior que" },
  { value: "less_than", label: "menor que" },
]

export const MOCK_SEGMENTS: Segment[] = [
  // 5 segmentos realistas para CRM:
  // "Leads Quentes" (leadScore > 70), "Clientes SP" (estado = SP),
  // "Inativos" (status = inativo), "Alta Conversão" (status = convertido),
  // "Leads do Instagram" (origem contém instagram)
  // Cada um com cor, descrição, regras coerentes e contatosCount estimado
]

export const SEGMENT_COLORS = [
  "#9795e4", "#7c7ab8", "#E57373", "#81C784",
  "#64B5F6", "#FFB74D", "#BA68C8", "#4DB6AC"
]

--- ARQUIVO 2: app/contatos/segmentos/page.tsx ---

REQUISITOS:
1. Layout padrão com Sidebar + ContactsSubSidebar
2. Header:
   - Título "Segmentos" + contagem
   - Botão "Criar Segmento" (bg-[#9795e4], ícone Plus)
3. Barra de busca por nome do segmento
4. Grid de cards de segmentos (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4):
   Cada card:
   - Barra lateral colorida à esquerda (4px, cor do segmento, border-l-4)
   - Topo: badge com nome colorido + dropdown de ações (MoreHorizontal)
   - Descrição em text-muted-foreground text-sm
   - Contador: ícone Users + "X contatos"
   - Preview das regras: listar cada regra como texto legível (ex: "Lead Score > 70")
     Máximo 2 regras exibidas; se mais, mostrar "+ N mais regras"
   - Rodapé: operador AND/OR como badge + data de atualização
   - Hover effect: hover:shadow-md transition-shadow
   Dropdown de ações: Editar, Ver Contatos (Link para /contatos com filtro), Excluir
5. Estado vazio igual ao padrão (ícone Layers, texto, botão CTA)
6. Dialog criar/editar segmento:
   SEÇÃO 1 — Info básica:
   - Nome* (Input)
   - Descrição (Textarea 2 linhas)
   - Cor (picker circular com SEGMENT_COLORS)
   - Operador lógico: botões toggle "Todas as regras (AND)" / "Qualquer regra (OR)"

   SEÇÃO 2 — Regras:
   - Lista de regras adicionadas (cada regra: campo + operador + valor + botão X para remover)
   - Botão "Adicionar Regra" (variant="outline", ícone Plus)
   - Ao adicionar regra: inline form com 3 selects (campo, operador, valor)
     - Se campo = "status": valor é select (ativo/inativo/pendente/convertido)
     - Se campo = "leadScore": valor é Input type="number"
     - Outros campos: valor é Input text

   SEÇÃO 3 — Preview:
   - Texto "X contatos correspondem a este segmento"
   - Calcular usando MOCK_CONTACTS e a função de avaliação das regras
   - Atualizar em tempo real conforme regras mudam (useMemo)

   Função de avaliação de regras (implementar no arquivo):
   function evaluateContact(contact: Contact, rules: SegmentRule[], operator: "AND" | "OR"): boolean {
     // Para cada regra, verificar se o contact satisfaz
     // AND: todas as regras devem ser satisfeitas
     // OR: pelo menos uma regra deve ser satisfeita
     // Suporte a operadores: equals, not_equals, contains, greater_than, less_than
   }

7. Confirmação de exclusão com Dialog separado

ESTADO LOCAL:
- useState para segments (inicializado com MOCK_SEGMENTS)
- useState para busca, dialog aberto, editando, nova regra em construção
- useMemo para contagem de preview

Gere ambos os arquivos completos.
```

---

## ═══════════════════════════════════════════
## BLOCO 4 — /contatos/importar
## ═══════════════════════════════════════════

```
AGENTE: @dev
SKILL: coding-guidelines

Você é um desenvolvedor especialista em Next.js 15, TypeScript e Tailwind CSS.
Trabalha no projeto NexIA Chat — um CRM Dashboard.

=== CONTEXTO DO PROJETO ===

Stack: Next.js 15 App Router · TypeScript · Tailwind CSS · Radix UI (shadcn/ui)
Cor primária: #9795e4 | hover: #7c7ab8 | light bg: #9795e4/10
Ícones: lucide-react
Componentes UI: @/components/ui/{button,input,label,badge,card,select,separator,progress,table}
Sidebar: @/components/sidebar → <Sidebar />
Sub-sidebar: @/components/contacts/contacts-sub-sidebar → <ContactsSubSidebar />

=== PADRÃO DE LAYOUT ===

"use client"
export default function Page() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-shrink-0"><ContactsSubSidebar /></div>
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* conteúdo */}
      </main>
    </div>
  )
}

=== TAREFA ===

Crie o arquivo: app/contatos/importar/page.tsx

Esta página é um WIZARD de 4 passos para importação de contatos via CSV.
Usar useState para controlar o passo atual (1-4).

--- STEPPER VISUAL ---
No topo da área de conteúdo, exibir stepper horizontal:
4 círculos numerados conectados por linhas:
- Passo atual: círculo bg-[#9795e4] text-white
- Passo concluído: círculo bg-[#9795e4]/20 text-[#9795e4] com ícone Check
- Passo futuro: círculo bg-muted text-muted-foreground
Labels abaixo de cada círculo: "Upload", "Mapeamento", "Validação", "Resultado"

--- PASSO 1: UPLOAD ---
Card centralizado no conteúdo:
- Título "Selecione o arquivo"
- Zona de drag-and-drop:
  className="border-2 border-dashed border-[#9795e4]/40 rounded-lg p-12 text-center cursor-pointer hover:border-[#9795e4] hover:bg-[#9795e4]/5 transition-colors"
  - Ícone Upload (h-10 w-10 text-[#9795e4]/60)
  - Texto "Arraste e solte seu arquivo CSV aqui"
  - Sub-texto "ou"
  - Botão "Selecionar arquivo" (variant="outline")
  - Input type="file" hidden, accept=".csv"
  - Suporte a drag events: onDragOver, onDragLeave, onDrop
- Quando arquivo selecionado: mostrar nome + tamanho + ícone FileText
- Botão "Baixar template CSV" (variant="ghost", ícone Download, canto superior direito do card)
  → Ao clicar, criar e baixar um CSV template com os headers: nome,sobrenome,email,telefone,cidade,estado,empresa,cargo,origem,status
- Botão "Próximo" desabilitado até arquivo selecionado

SIMULAÇÃO: ao selecionar arquivo, gerar dados mockados de preview (array de objetos com headers e 5 linhas de dados fictícios).

--- PASSO 2: MAPEAMENTO DE COLUNAS ---
Simular que o CSV tem colunas detectadas (usar os dados mock gerados no passo 1).
- Título "Mapeie as colunas do arquivo"
- Sub-texto "Associe cada coluna do seu arquivo ao campo correspondente no sistema"
- Tabela com colunas: "Coluna do arquivo" | "Campo no sistema" | "Exemplo de dado"
  Para cada coluna do CSV (nome, sobrenome, email...):
  - "Coluna do arquivo": nome da coluna em badge
  - "Campo no sistema": Select com opções de campos do Contact + "Ignorar coluna"
    Pré-selecionar automaticamente por correspondência de nome (nome→nome, email→email, etc.)
  - "Exemplo de dado": primeiro valor daquela coluna em text-muted-foreground
- Campos obrigatórios (nome, email): indicar com asterisco vermelho
- Aviso no rodapé se campos obrigatórios não mapeados: texto vermelho
- Botões: "Voltar" | "Próximo"

--- PASSO 3: VALIDAÇÃO ---
- Título "Revisão dos dados"
- Resumo em 3 cards coloridos:
  - "Total de registros": N (bg azul)
  - "Válidos": N (bg verde)
  - "Com erros": N (bg vermelho, 0 se não houver)
- Tabela com primeiros 5 registros a serem importados:
  Colunas: # | Nome | Email | Telefone | Status | Erros
  Linhas com erro: linha levemente vermelha (bg-red-50), coluna Erros mostra badge vermelho com texto do erro
  Linhas válidas: sem highlight especial
- Lista de erros abaixo (se houver): "Linha X: [descrição do erro]"
- Botões: "Voltar" | "Importar X contatos" (bg-[#9795e4], desabilitado se 0 válidos)

SIMULAR validação: verificar se email tem formato válido, se nome não está vazio.
Gerar 1 ou 2 erros simulados nos dados mock para demonstrar o estado com erros.

--- PASSO 4: RESULTADO ---
- Simular importação com progresso:
  Ao entrar no passo 4, iniciar um setTimeout que simula progresso de 0 a 100% em ~2 segundos
  Usar useState<number> para o progresso
  Componente <Progress value={progresso} className="h-2" /> (já existe no shadcn/ui)
- Enquanto progresso < 100: mostrar "Importando contatos..." com spinner
- Após 100%: mostrar resultado final:
  - Ícone CheckCircle2 grande (h-16 w-16 text-emerald-500)
  - Título "Importação concluída!"
  - "X contatos importados com sucesso"
  - Se houve erros: "Y registros ignorados por erros de validação"
  - Dois botões:
    - "Ver Contatos" → Link para /contatos
    - "Importar Outro Arquivo" → resetar wizard para passo 1 (setStep(1), limpar estados)

ESTADO GERAL:
- step: number (1-4)
- arquivo: File | null
- dadosMock: array com dados simulados
- mapeamento: Record<string, string>
- progresso: number (0-100)
- importacaoConcluida: boolean

Gere o arquivo app/contatos/importar/page.tsx completo.
```

---

## ═══════════════════════════════════════════
## BLOCO 5 — /contatos/campos
## ═══════════════════════════════════════════

```
AGENTE: @dev
SKILL: coding-guidelines

Você é um desenvolvedor especialista em Next.js 15, TypeScript e Tailwind CSS.
Trabalha no projeto NexIA Chat — um CRM Dashboard.

=== CONTEXTO DO PROJETO ===

Stack: Next.js 15 App Router · TypeScript · Tailwind CSS · Radix UI (shadcn/ui)
Cor primária: #9795e4 | hover: #7c7ab8 | light bg: #9795e4/10
Ícones: lucide-react
Componentes UI: @/components/ui/{button,input,label,badge,dialog,card,table,select,switch,separator,dropdown-menu}
Sidebar: @/components/sidebar → <Sidebar />
Sub-sidebar: @/components/contacts/contacts-sub-sidebar → <ContactsSubSidebar />

=== PADRÃO DE LAYOUT ===

"use client"
export default function Page() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-shrink-0"><ContactsSubSidebar /></div>
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* conteúdo */}
      </main>
    </div>
  )
}

=== TAREFA ===

Crie DOIS arquivos:

--- ARQUIVO 1: lib/mock/custom-fields.ts ---

export type FieldType = "texto" | "numero" | "data" | "selecao" | "booleano" | "url"

export interface CustomField {
  id: string
  nome: string           // slug sem espaços: ex "preferencia_contato"
  label: string          // display: ex "Preferência de Contato"
  tipo: FieldType
  obrigatorio: boolean
  opcoes?: string[]      // somente para tipo "selecao"
  descricao?: string
  ordem: number
  criadoEm: string
}

// Campos PADRÃO do sistema (readonly, não podem ser editados/excluídos)
export const DEFAULT_FIELDS: { nome: string; label: string; tipo: FieldType; obrigatorio: boolean; descricao: string }[] = [
  { nome: "nome", label: "Nome", tipo: "texto", obrigatorio: true, descricao: "Primeiro nome do contato" },
  { nome: "sobrenome", label: "Sobrenome", tipo: "texto", obrigatorio: true, descricao: "Sobrenome do contato" },
  { nome: "email", label: "E-mail", tipo: "texto", obrigatorio: true, descricao: "Endereço de e-mail principal" },
  { nome: "telefone", label: "Telefone", tipo: "texto", obrigatorio: true, descricao: "Número de telefone com DDD" },
  { nome: "empresa", label: "Empresa", tipo: "texto", obrigatorio: false, descricao: "Nome da empresa" },
  { nome: "cargo", label: "Cargo", tipo: "texto", obrigatorio: false, descricao: "Cargo ou posição" },
  { nome: "cidade", label: "Cidade", tipo: "texto", obrigatorio: false, descricao: "Cidade de localização" },
  { nome: "estado", label: "Estado", tipo: "texto", obrigatorio: false, descricao: "Estado (UF)" },
  { nome: "status", label: "Status", tipo: "selecao", obrigatorio: false, descricao: "Status do contato no CRM" },
  { nome: "leadScore", label: "Lead Score", tipo: "numero", obrigatorio: false, descricao: "Pontuação de qualificação (0-100)" },
  { nome: "origem", label: "Origem", tipo: "texto", obrigatorio: false, descricao: "Canal de origem do contato" },
  { nome: "observacoes", label: "Observações", tipo: "texto", obrigatorio: false, descricao: "Notas e observações gerais" },
]

export const MOCK_CUSTOM_FIELDS: CustomField[] = [
  // 4 campos personalizados de exemplo:
  // "Tamanho da Empresa" (selecao: ["1-10","11-50","51-200","200+"])
  // "Data de Aniversário" (data)
  // "Website" (url)
  // "Permite Contato" (booleano)
]

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  texto: "Texto",
  numero: "Número",
  data: "Data",
  selecao: "Seleção",
  booleano: "Sim/Não",
  url: "URL",
}

export const FIELD_TYPE_ICONS: Record<FieldType, string> = {
  texto: "Type",
  numero: "Hash",
  data: "Calendar",
  selecao: "ChevronDown",
  booleano: "ToggleLeft",
  url: "Link",
}

--- ARQUIVO 2: app/contatos/campos/page.tsx ---

REQUISITOS:
1. Layout padrão com Sidebar + ContactsSubSidebar
2. Header:
   - Título "Campos Personalizados"
   - Sub-texto "Adicione campos extras para armazenar informações específicas do seu negócio"
   - Botão "Criar Campo" (bg-[#9795e4], ícone Plus)
3. SEÇÃO "Campos Padrão":
   - Título da seção com Badge "Sistema" ao lado
   - Tabela (fundo levemente acinzentado bg-muted/30):
     Colunas: Campo | Label | Tipo | Obrigatório | Descrição
     - Tipo: badge colorido (texto=roxo, numero=azul, data=verde, selecao=laranja, booleano=verde-escuro, url=ciano)
     - Obrigatório: ícone CheckCircle2 verde se true, "-" se false
     - Sem coluna de Ações (readonly)
   - Badge "Padrão" no canto com texto "Estes campos não podem ser modificados"
4. SEÇÃO "Campos Personalizados":
   - Título da seção
   - Se vazio: estado vazio com ícone Settings, texto, botão CTA
   - Se tem campos: Tabela com colunas: Label | Nome (slug, em code font) | Tipo | Obrigatório | Opções (se selecao) | Ações
     Ações: DropdownMenu com Editar e Excluir
5. Dialog criar/editar campo:
   - Label* (Input)
   - Nome interno: gerado automaticamente a partir do label (toLowerCase, espaços→_, remover acentos)
     Mostrar em read-only abaixo do label: "Nome interno: nome_gerado"
   - Tipo* (Select com FIELD_TYPE_LABELS)
   - Se tipo = "selecao": campo dinâmico para adicionar opções:
     - Input + botão Adicionar
     - Lista das opções adicionadas com X para remover cada uma
   - Obrigatório (Switch)
   - Descrição (Input)
   - Pré-visualização do campo no formulário:
     Box com "Como aparecerá no formulário:" + renderização visual do campo (Input, Select, etc.)
6. Confirmação de exclusão com Dialog

ESTADO LOCAL:
- useState<CustomField[]> com MOCK_CUSTOM_FIELDS
- useState para dialog, editando, novos campos de opção

LÓGICA:
- Função slugify(label: string): string para gerar nome interno automaticamente
  Remover acentos, lowercase, substituir espaços e caracteres especiais por "_"
- Preview em tempo real do campo: renderizar componente correto baseado no tipo selecionado

Gere ambos os arquivos completos.
```

---

## ═══════════════════════════════════════════
## BLOCO 6 — /contatos/pontuacao
## ═══════════════════════════════════════════

```
AGENTE: @dev
SKILL: coding-guidelines

Você é um desenvolvedor especialista em Next.js 15, TypeScript e Tailwind CSS.
Trabalha no projeto NexIA Chat — um CRM Dashboard.

=== CONTEXTO DO PROJETO ===

Stack: Next.js 15 App Router · TypeScript · Tailwind CSS · Radix UI (shadcn/ui)
Cor primária: #9795e4 | hover: #7c7ab8 | light bg: #9795e4/10
Ícones: lucide-react
Componentes UI: @/components/ui/{button,input,label,badge,dialog,card,table,select,switch,separator,dropdown-menu}
Sidebar: @/components/sidebar → <Sidebar />
Sub-sidebar: @/components/contacts/contacts-sub-sidebar → <ContactsSubSidebar />
Dados mock: @/lib/mock/contacts → MOCK_CONTACTS (para calcular distribuição de scores)

=== PADRÃO DE LAYOUT ===

"use client"
export default function Page() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-shrink-0"><ContactsSubSidebar /></div>
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* conteúdo */}
      </main>
    </div>
  )
}

=== TAREFA ===

Crie DOIS arquivos:

--- ARQUIVO 1: lib/mock/scoring-rules.ts ---

export type ScoringCategory = "perfil" | "engajamento" | "conversao"

export interface ScoringRule {
  id: string
  categoria: ScoringCategory
  evento: string
  pontos: number   // positivo ou negativo
  ativo: boolean
  descricao?: string
}

export interface ScoringThresholds {
  hot: number    // >= hot = Lead Quente
  warm: number   // >= warm e < hot = Lead Morno
  // < warm = Lead Frio
}

export const DEFAULT_THRESHOLDS: ScoringThresholds = {
  hot: 70,
  warm: 40,
}

export const MOCK_SCORING_RULES: ScoringRule[] = [
  // CATEGORIA PERFIL (pontos positivos):
  // "Cargo preenchido" (+5), "Empresa preenchida" (+5),
  // "LinkedIn informado" (+10), "Telefone informado" (+8),
  // "Empresa com +50 funcionários" (+15)

  // CATEGORIA ENGAJAMENTO:
  // "Abriu e-mail" (+3), "Clicou em link" (+5),
  // "Visitou página de preços" (+10), "Assistiu webinar" (+15),
  // "Inatividade por 30 dias" (-10)

  // CATEGORIA CONVERSÃO:
  // "Solicitou demonstração" (+25), "Enviou formulário de contato" (+20),
  // "Convertido" (+50), "Cancelou assinatura" (-30)

  // Criar ~10 regras no total, com mistura de ativos e inativos
]

export const CATEGORY_LABELS: Record<ScoringCategory, string> = {
  perfil: "Perfil",
  engajamento: "Engajamento",
  conversao: "Conversão",
}

export const CATEGORY_COLORS: Record<ScoringCategory, string> = {
  perfil: "#64B5F6",
  engajamento: "#9795e4",
  conversao: "#81C784",
}

--- ARQUIVO 2: app/contatos/pontuacao/page.tsx ---

REQUISITOS:
1. Layout padrão com Sidebar + ContactsSubSidebar
2. Header:
   - Título "Pontuação de Leads"
   - Sub-texto "Configure as regras que definem automaticamente o score dos seus contatos"
   - Botão "Criar Regra" (bg-[#9795e4], ícone Plus)
3. Cards KPI (4 cards em row):
   Calcular usando MOCK_CONTACTS.leadScore:
   - "Leads Quentes": contagem com score >= thresholds.hot (bg vermelho/laranja suave)
   - "Leads Mornos": contagem com score >= thresholds.warm e < thresholds.hot (bg amarelo suave)
   - "Leads Frios": contagem com score < thresholds.warm (bg azul suave)
   - "Score Médio": média de todos os leadScores (bg roxo suave)
4. Barra de qualificação visual:
   Card com título "Faixas de Qualificação":
   - Barra horizontal dividida em 3 segmentos coloridos proporcional à contagem
   - Legenda: 🔴 Quente (>=70) | 🟡 Morno (40-69) | 🔵 Frio (<40)
5. CONFIGURAÇÃO DOS THRESHOLDS:
   Card "Configuração de Faixas":
   - Dois sliders (input type="range"):
     - "Lead Quente a partir de:" (range 50-100, step=5, valor atual = thresholds.hot)
     - "Lead Morno a partir de:" (range 10-49, step=5, valor atual = thresholds.warm)
   - Os cards KPI atualizam em tempo real ao mover sliders (usar useMemo)
   - Botão "Salvar Configuração" (toast de sucesso)
6. TABELA DE REGRAS:
   - Tabs com 3 categorias: "Todas" | "Perfil" | "Engajamento" | "Conversão"
   - Tabela: Evento | Categoria (badge colorido) | Pontos (verde se positivo, vermelho se negativo) | Ativo (Switch) | Ações
   - Switch de Ativo: atualiza estado local ao clicar
   - DropdownMenu ações: Editar, Excluir
7. Dialog criar/editar regra:
   - Categoria (Select: perfil/engajamento/conversão)
   - Evento* (Input, ex: "Abriu e-mail")
   - Pontos (Input type="number", pode ser negativo, usar +/- como indicador visual)
   - Ativo (Switch, default: true)
   - Descrição (Input)
8. Botão "Recalcular Scores" no header:
   - Ao clicar: toast com "Scores recalculados para X contatos"
9. Confirmação de exclusão

ESTADO LOCAL:
- useState<ScoringRule[]> com MOCK_SCORING_RULES
- useState<ScoringThresholds> com DEFAULT_THRESHOLDS
- useMemo para cálculos KPI
- useState para activeTab, dialog, editando

Gere ambos os arquivos completos.
```

---

## ═══════════════════════════════════════════
## BLOCO 7 — /contatos/exportar
## ═══════════════════════════════════════════

```
AGENTE: @dev
SKILL: coding-guidelines

Você é um desenvolvedor especialista em Next.js 15, TypeScript e Tailwind CSS.
Trabalha no projeto NexIA Chat — um CRM Dashboard.

=== CONTEXTO DO PROJETO ===

Stack: Next.js 15 App Router · TypeScript · Tailwind CSS · Radix UI (shadcn/ui)
Cor primária: #9795e4 | hover: #7c7ab8 | light bg: #9795e4/10
Ícones: lucide-react
Componentes UI: @/components/ui/{button,input,label,badge,card,select,separator,checkbox,table}
Sidebar: @/components/sidebar → <Sidebar />
Sub-sidebar: @/components/contacts/contacts-sub-sidebar → <ContactsSubSidebar />
Dados mock:
  @/lib/mock/contacts → MOCK_CONTACTS, Contact
  @/lib/mock/tags → MOCK_TAGS

=== PADRÃO DE LAYOUT ===

"use client"
export default function Page() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-shrink-0"><ContactsSubSidebar /></div>
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* conteúdo */}
      </main>
    </div>
  )
}

=== TAREFA ===

Crie o arquivo: app/contatos/exportar/page.tsx

Layout em 2 colunas em desktop (lg:grid-cols-[1fr_340px]):
- Coluna esquerda: configurações de exportação
- Coluna direita: resumo e ação

--- COLUNA ESQUERDA ---

CARD 1 — "Filtrar Contatos":
- Multiselect de Status: checkboxes para ativo/inativo/pendente/convertido
- Multiselect de Tags: chips das MOCK_TAGS clicáveis (igual ao padrão de filtros do projeto)
- Lead Score mínimo: Input type="number" (0-100)
- Lead Score máximo: Input type="number" (0-100)
- Contador dinâmico: "X de Y contatos selecionados" (calcular com useMemo filtrar MOCK_CONTACTS)

CARD 2 — "Selecionar Campos":
- Grid de checkboxes (2 colunas) para cada campo exportável:
  nome, sobrenome, email (pré-selecionado), telefone (pré-selecionado),
  empresa, cargo, cidade, estado, status, leadScore, origem,
  instagram, linkedin, utmSource, utmMedium, utmCampaign,
  criadoEm, ultimoContato, observacoes
- Botões: "Selecionar todos" e "Limpar seleção"
- Contador: "X campos selecionados"

CARD 3 — "Formato":
- Botões radio visuais (estilo card clicável):
  CSV (FileText ícone) | Excel XLSX (FileSpreadsheet ícone)
  Selecionado: border-[#9795e4] bg-[#9795e4]/5
- Se CSV: Select para separador (Vírgula "," | Ponto e vírgula ";")
- Incluir cabeçalho: Switch (default: true)

--- COLUNA DIREITA ---

CARD "Resumo da Exportação" (sticky top-4):
- Contatos: número filtrado
- Campos: número selecionado
- Formato: CSV/XLSX
- Separador (se CSV)
- Linha divisória
- Botão "Exportar" (w-full, bg-[#9795e4], ícone Download)
  → Ao clicar: simular exportação (toast "X contatos exportados com sucesso")
  → Adicionar entrada no histórico
  → Se 0 contatos: botão desabilitado
- Texto "Exportação gratuita · Sem limites"

SEÇÃO HISTÓRICO (abaixo dos cards, largura total):
- Título "Histórico de Exportações"
- Tabela com colunas: Data | Contatos | Campos | Formato | Ação
  - Ação: botão "Baixar novamente" (variant="ghost")
- Inicializar com 3 exportações mock no histórico
- Novas exportações adicionam linha no topo

ESTADO LOCAL:
- useState para status selecionados, tags selecionadas, min/max score
- useState para campos selecionados (Set ou array)
- useState para formato ("csv" | "xlsx"), separador, incluirCabecalho
- useState<ExportHistory[]> para histórico
- useMemo para contagem de contatos filtrados

interface ExportHistory {
  id: string
  data: string
  contatos: number
  campos: number
  formato: "csv" | "xlsx"
  filtros: string  // descrição textual dos filtros
}

Gere o arquivo app/contatos/exportar/page.tsx completo.
```

---

## ═══════════════════════════════════════════
## BLOCO 8 — /contatos/lixeira
## ═══════════════════════════════════════════

```
AGENTE: @dev
SKILL: coding-guidelines

Você é um desenvolvedor especialista em Next.js 15, TypeScript e Tailwind CSS.
Trabalha no projeto NexIA Chat — um CRM Dashboard.

=== CONTEXTO DO PROJETO ===

Stack: Next.js 15 App Router · TypeScript · Tailwind CSS · Radix UI (shadcn/ui)
Cor primária: #9795e4 | hover: #7c7ab8 | light bg: #9795e4/10
Ícones: lucide-react
Componentes UI: @/components/ui/{button,input,badge,card,table,dialog,dropdown-menu,avatar,separator}
Sidebar: @/components/sidebar → <Sidebar />
Sub-sidebar: @/components/contacts/contacts-sub-sidebar → <ContactsSubSidebar />
Dados mock: @/lib/mock/contacts → Contact interface (para basear os contatos excluídos)

=== PADRÃO DE LAYOUT ===

"use client"
export default function Page() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-shrink-0"><ContactsSubSidebar /></div>
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* conteúdo */}
      </main>
    </div>
  )
}

=== TAREFA ===

Crie DOIS arquivos:

--- ARQUIVO 1: lib/mock/trash.ts ---

import { Contact } from "./contacts"

export interface TrashedContact extends Contact {
  excluidoEm: string    // ISO timestamp
  excluidoPor: string   // nome do usuário
  expiracaoEm: string   // 30 dias após excluidoEm
}

export function calcularDiasRestantes(expiracaoEm: string): number {
  const expiracao = new Date(expiracaoEm)
  const hoje = new Date()
  const diff = expiracao.getTime() - hoje.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export const MOCK_TRASHED_CONTACTS: TrashedContact[] = [
  // 5 contatos excluídos baseados na interface Contact:
  // Variar excluidoEm: alguns recentes (2-5 dias atrás), alguns antigos (20-28 dias atrás)
  // expiracaoEm = excluidoEm + 30 dias
  // excluidoPor: "João Admin", "Maria Vendas", "Sistema"
  // Usar dados realistas (nomes, emails, empresas brasileiras)
]

--- ARQUIVO 2: app/contatos/lixeira/page.tsx ---

REQUISITOS:
1. Layout padrão com Sidebar + ContactsSubSidebar
2. Header:
   - Título "Lixeira"
   - Sub-texto com contagem: "X contatos serão excluídos permanentemente"
   - Botão "Esvaziar Lixeira" (variant="outline", className com border-red-200 text-red-600 hover:bg-red-50)
     → Abre Dialog de confirmação antes de executar
3. Banner informativo (amarelo/âmbar):
   className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-3"
   - Ícone AlertTriangle (text-amber-600)
   - Texto: "Contatos são excluídos permanentemente após 30 dias. Restaure-os antes que o prazo expire."
4. Barra de busca (Input com ícone Search)
5. Ações em massa (aparecem somente quando há seleção):
   div com bg-[#9795e4]/10 p-2 rounded-md:
   - "X contatos selecionados"
   - Botão "Restaurar selecionados" (text-[#9795e4])
   - Botão "Excluir permanentemente" (text-red-600)
6. Tabela:
   Colunas: checkbox | Contato | Email | Excluído em | Excluído por | Expira em | Ações
   - Contato: Avatar (circulo com iniciais e avatarBg) + "nome sobrenome" + empresa abaixo
   - Email: text-sm text-muted-foreground
   - Excluído em: DD/MM/AAAA
   - Excluído por: text-sm
   - Expira em: badge colorido baseado em dias restantes:
     - > 14 dias: badge verde "X dias restantes"
     - 7-14 dias: badge amarelo "X dias restantes"
     - < 7 dias: badge vermelho "X dias restantes"
   - Ações: DropdownMenu com:
     - "Restaurar" (ícone RotateCcw, text-[#9795e4])
     - Separador
     - "Excluir Permanentemente" (ícone Trash2, text-red-600)
7. Estado vazio:
   - Ícone Trash2 grande (h-12 w-12 text-muted-foreground)
   - Título "Lixeira vazia"
   - Sub-texto "Nenhum contato foi excluído recentemente"
   - Link "Ver todos os contatos" → /contatos
8. Dialog de confirmação "Esvaziar Lixeira":
   - Título "Esvaziar Lixeira"
   - Texto "Esta ação excluirá permanentemente todos os X contatos da lixeira. Esta ação NÃO pode ser desfeita."
   - Botão "Cancelar" | Botão "Esvaziar Lixeira" (bg-red-600 hover:bg-red-700)
9. Checkbox no header da tabela para selecionar/deselecionar todos
10. Ao restaurar: remover da lista + toast "Contato restaurado com sucesso"
11. Ao excluir permanentemente (linha individual): Dialog de confirmação + toast

ESTADO LOCAL:
- useState<TrashedContact[]> com MOCK_TRASHED_CONTACTS
- useState para selecionados, busca, dialog esvaziar, confirmação individual

Gere ambos os arquivos completos.
```

---

## ═══════════════════════════════════════════
## BLOCO 9 — /contatos/relatorios/tendencias
## ═══════════════════════════════════════════

```
AGENTE: @dev
SKILL: coding-guidelines

Você é um desenvolvedor especialista em Next.js 15, TypeScript e Tailwind CSS.
Trabalha no projeto NexIA Chat — um CRM Dashboard.

=== CONTEXTO DO PROJETO ===

Stack: Next.js 15 App Router · TypeScript · Tailwind CSS · Radix UI (shadcn/ui)
Cor primária: #9795e4 | hover: #7c7ab8 | light bg: #9795e4/10
Ícones: lucide-react
Gráficos: recharts (já instalado — usar ResponsiveContainer, LineChart, BarChart, PieChart, etc.)
Componentes UI: @/components/ui/{button,card,badge,select,separator,tabs}
Sidebar: @/components/sidebar → <Sidebar />
Sub-sidebar: @/components/contacts/contacts-sub-sidebar → <ContactsSubSidebar />
Dados: @/lib/mock/contacts → MOCK_CONTACTS

=== PADRÃO DE LAYOUT ===

"use client"
export default function Page() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-shrink-0"><ContactsSubSidebar /></div>
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* conteúdo */}
      </main>
    </div>
  )
}

=== TAREFA — PARTE 1: Ativar Relatórios no sidebar ===

Edite o arquivo: components/contacts/contacts-sub-sidebar.tsx

Encontre o bloco comentado:
  {/* Relatórios - seção removida conforme solicitação */}
  {/* <NavSection
    title="Relatórios"
    items={reportNavItems}
    ...
  /> */}

Descomente este bloco removendo os comentários, deixando:
  <NavSection
    title="Relatórios"
    items={reportNavItems}
    pathname={pathname}
    isCollapsed={isCollapsed}
  />

=== TAREFA — PARTE 2: Criar a página ===

Crie o arquivo: app/contatos/relatorios/tendencias/page.tsx

DADOS CALCULADOS (derivar de MOCK_CONTACTS usando useMemo):

1. newContactsByMonth: agrupar MOCK_CONTACTS por mês de criadoEm, últimos 12 meses
   Formato para Recharts: [{ mes: "Jan", contatos: 12 }, ...]

2. originDistribution: contar MOCK_CONTACTS por campo "origem", top 6
   Formato: [{ origem: "Facebook Ads", total: 15 }, ...]

3. statusDistribution: contar por status
   Formato: [{ status: "ativo", total: 30, fill: "#81C784" }, ...]
   Cores: ativo=#81C784, inativo=#E57373, pendente=#FFB74D, convertido=#9795e4

4. topTags: contar quantos contatos têm cada tag, top 5
   (cruzar MOCK_CONTACTS.tags com MOCK_TAGS para pegar o nome da tag)
   Formato: [{ tag: "Lead Quente", cor: "#E57373", total: 18 }, ...]

REQUISITOS DA PÁGINA:
1. Layout padrão com Sidebar + ContactsSubSidebar
2. Header:
   - Título "Tendências de Contatos"
   - Filtro de período: Select com opções "Últimos 7 dias" | "Últimos 30 dias" | "Últimos 90 dias" | "Últimos 12 meses"
3. Cards KPI (4 cards):
   - Total de Contatos (ícone Users)
   - Novos este mês vs mês anterior com seta ↑↓ e percentual de variação
   - Contatos Ativos: contagem status="ativo"
   - Score Médio: média de leadScores (arredondado)
4. Gráfico de linha — "Novos Contatos por Mês":
   Card de altura h-[280px], ResponsiveContainer
   LineChart com newContactsByMonth
   Linha cor #9795e4, pontos visíveis, tooltip personalizado
   Eixo X: meses, Eixo Y: números
5. Gráfico de barras — "Top Origens":
   Card de altura h-[280px], ResponsiveContainer
   BarChart horizontal com originDistribution
   Barras cor #9795e4, tooltip, labels no eixo Y
6. Gráfico de pizza — "Distribuição por Status":
   Card de altura h-[280px], PieChart com PieChart + Pie + Cell
   Usar as cores de statusDistribution
   Legenda lateral (vertical)
7. Tabela de Top Tags:
   Card com título "Tags Mais Usadas"
   Colunas: Tag (badge colorido) | Contatos | % do total
   Barra de progresso inline na coluna % (div com largura proporcional, bg-[#9795e4]/20)

TOOLTIP CUSTOMIZADO (para todos os gráficos):
Componente CustomTooltip com className="rounded-md border bg-white p-2 shadow-sm text-xs"

Gere o arquivo components/contacts/contacts-sub-sidebar.tsx (editado) e app/contatos/relatorios/tendencias/page.tsx completos.
```

---

## ═══════════════════════════════════════════
## BLOCO 10 — /contatos/relatorios/desempenho
## ═══════════════════════════════════════════

```
AGENTE: @dev
SKILL: coding-guidelines

Você é um desenvolvedor especialista em Next.js 15, TypeScript e Tailwind CSS.
Trabalha no projeto NexIA Chat — um CRM Dashboard.

=== CONTEXTO DO PROJETO ===

Stack: Next.js 15 App Router · TypeScript · Tailwind CSS · Radix UI (shadcn/ui)
Cor primária: #9795e4 | hover: #7c7ab8 | light bg: #9795e4/10
Ícones: lucide-react
Gráficos: recharts (já instalado)
Componentes UI: @/components/ui/{button,card,badge,select,separator,table,progress}
Sidebar: @/components/sidebar → <Sidebar />
Sub-sidebar: @/components/contacts/contacts-sub-sidebar → <ContactsSubSidebar />
Dados: @/lib/mock/contacts → MOCK_CONTACTS | @/lib/mock/tags → MOCK_TAGS

=== PADRÃO DE LAYOUT ===

"use client"
export default function Page() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-shrink-0"><ContactsSubSidebar /></div>
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* conteúdo */}
      </main>
    </div>
  )
}

=== TAREFA ===

Crie o arquivo: app/contatos/relatorios/desempenho/page.tsx

DADOS CALCULADOS (derivar de MOCK_CONTACTS usando useMemo):

1. taxaConversao: (contatos com status="convertido" / total) * 100
2. taxaInatividade: (contatos com status="inativo" / total) * 100
3. leadsQuentes: contagem com leadScore >= 70
4. funnelData: [
   { etapa: "Total", valor: total },
   { etapa: "Ativos", valor: count("ativo") },
   { etapa: "Convertidos", valor: count("convertido") }
   ]
5. desempenhoPorTag: para cada tag em MOCK_TAGS:
   - contatos com essa tag
   - score médio desses contatos
   - taxa de conversão desses contatos
   Ordenar por taxa de conversão descendente

REQUISITOS DA PÁGINA:
1. Layout padrão com Sidebar + ContactsSubSidebar
2. Header:
   - Título "Desempenho de Contatos"
   - Botão "Exportar Relatório" (variant="outline", ícone Download)
     → toast "Relatório exportado com sucesso"
   - Select de período (mesmas opções de tendências)
3. Cards KPI (4 cards em row):
   - Taxa de Conversão: taxaConversao% (ícone TrendingUp, cor verde)
   - Taxa de Inatividade: taxaInatividade% (ícone TrendingDown, cor vermelha)
   - Leads Quentes (score ≥70): número + ícone Flame (cor laranja)
   - Score Médio Geral: média arredondada (ícone Target, cor roxa)
4. Gráfico de Funil — "Funil de Contatos":
   Card de altura h-[260px]
   Usar BarChart do Recharts na vertical (layout="vertical") com funnelData
   Barras horizontais com larguras diferentes simulando funil:
     Total: largura 100%, Ativos: ~70%, Convertidos: ~30%
   Usar barras de cor gradiente #9795e4 com opacidades diferentes
   Ou: Implementar funil customizado com divs (largura proporcional ao valor, centralizados)
   Mostrar percentual de conversão entre cada etapa
5. Tabela de Desempenho por Tag:
   Card com título "Desempenho por Tag"
   Colunas:
   - Tag: badge colorido (cor da tag)
   - Contatos: número
   - Score Médio: número + barra de progresso inline (0-100)
   - Taxa de Conversão: percentual + badge colorido (>30% verde, 10-30% amarelo, <10% vermelho)
   Ordenar por Taxa de Conversão descendente
   Linha de rodapé com totais/médias
6. Gráfico de Barras — "Score por Origem":
   Card de altura h-[260px]
   Calcular score médio agrupado por origem (top 5 origens)
   BarChart vertical, barras cor #9795e4, tooltip

TOOLTIP CUSTOMIZADO igual ao de tendências:
className="rounded-md border bg-white p-2 shadow-sm text-xs"

Gere o arquivo app/contatos/relatorios/desempenho/page.tsx completo.
```

---

## GUIA RÁPIDO DE EXECUÇÃO

| Bloco | Arquivo(s) criado(s) | Agente | Skill |
|-------|---------------------|--------|-------|
| 1 | `app/contatos/novo/page.tsx` | @dev | coding-guidelines |
| 2 | `lib/mock/lists.ts` + `app/contatos/listas/page.tsx` | @dev | coding-guidelines |
| 3 | `lib/mock/segments.ts` + `app/contatos/segmentos/page.tsx` | @dev | coding-guidelines |
| 4 | `app/contatos/importar/page.tsx` | @dev | coding-guidelines |
| 5 | `lib/mock/custom-fields.ts` + `app/contatos/campos/page.tsx` | @dev | coding-guidelines |
| 6 | `lib/mock/scoring-rules.ts` + `app/contatos/pontuacao/page.tsx` | @dev | coding-guidelines |
| 7 | `app/contatos/exportar/page.tsx` | @dev | coding-guidelines |
| 8 | `lib/mock/trash.ts` + `app/contatos/lixeira/page.tsx` | @dev | coding-guidelines |
| 9 | `contacts-sub-sidebar.tsx` (editar) + `app/contatos/relatorios/tendencias/page.tsx` | @dev | coding-guidelines |
| 10 | `app/contatos/relatorios/desempenho/page.tsx` | @dev | coding-guidelines |

### Ordem recomendada de execução

Sprint 1 → Blocos 1, 2, 3, 4 (alta prioridade)
Sprint 2 → Blocos 5, 6, 7, 8 (média prioridade)
Sprint 3 → Blocos 9 e 10 juntos (relatórios — ativar sidebar primeiro)

*Gerado por @architect (Aria) · Synkra AIOS · 2026-03-05*
