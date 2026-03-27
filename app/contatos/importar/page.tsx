"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import {
  Upload,
  FileText,
  Download,
  Check,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Mapeamento" },
  { id: 3, label: "Validação" },
  { id: 4, label: "Resultado" },
]

const SYSTEM_FIELDS = [
  { value: "nome", label: "Nome", required: true },
  { value: "sobrenome", label: "Sobrenome", required: false },
  { value: "email", label: "Email", required: true },
  { value: "telefone", label: "Telefone", required: false },
  { value: "cidade", label: "Cidade", required: false },
  { value: "estado", label: "Estado", required: false },
  { value: "empresa", label: "Empresa", required: false },
  { value: "cargo", label: "Cargo", required: false },
  { value: "origem", label: "Origem", required: false },
  { value: "status", label: "Status", required: false },
  { value: "ignore", label: "Ignorar coluna", required: false },
]

// Parser CSV simples que lida com campos entre aspas e vírgulas
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim())
  const rows = lines.slice(1).map(parseLine)

  return { headers, rows }
}

function validateRow(row: Record<string, string>): string[] {
  const errors: string[] = []
  if (!row.nome || row.nome.trim() === "") {
    errors.push("Nome é obrigatório")
  }
  if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push("Email inválido")
  }
  return errors
}

function downloadTemplate() {
  const CSV_HEADERS = ["nome", "sobrenome", "email", "telefone", "cidade", "estado", "empresa", "cargo", "origem", "status"]
  const csv = CSV_HEADERS.join(",") + "\n"
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = "template_contatos.csv"
  link.click()
}

export default function ImportarContatosPage() {
  const [step, setStep] = useState(1)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<Record<string, string>[]>([])
  const [mapeamento, setMapeamento] = useState<Record<string, string>>({})
  const [progresso, setProgresso] = useState(0)
  const [importando, setImportando] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [importResult, setImportResult] = useState<{
    imported: number
    errors: number
    duplicates: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.name.endsWith(".csv")) {
      setArquivo(file)
      
      // Ler e parsear o arquivo CSV
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const { headers, rows } = parseCSV(text)
        
        if (headers.length === 0) {
          toast.error("Arquivo CSV vazio ou inválido")
          return
        }

        setCsvHeaders(headers)
        
        // Converter linhas em objetos
        const parsedData = rows.map(row => {
          const obj: Record<string, string> = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        }).filter(row => Object.values(row).some(v => v.trim() !== ''))

        setCsvData(parsedData)
        
        // Auto-mapeamento baseado em nomes similares
        const autoMap: Record<string, string> = {}
        headers.forEach((header) => {
          const normalizedHeader = header.toLowerCase().trim()
          // Tenta encontrar campo correspondente
          const match = SYSTEM_FIELDS.find(field => 
            field.value === normalizedHeader ||
            field.label.toLowerCase() === normalizedHeader
          )
          if (match) {
            autoMap[header] = match.value
          } else {
            autoMap[header] = "ignore"
          }
        })
        setMapeamento(autoMap)
        
        toast.success(`Arquivo carregado: ${parsedData.length} registros encontrados`)
      }
      reader.onerror = () => {
        toast.error("Erro ao ler o arquivo")
      }
      reader.readAsText(file)
    } else {
      toast.error("Por favor, selecione um arquivo CSV válido")
    }
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0])
      }
    },
    [handleFileSelect]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  // Aplicar mapeamento aos dados CSV
  const mappedData = useMemo(() => {
    return csvData.map(row => {
      const mapped: Record<string, string> = {}
      Object.entries(mapeamento).forEach(([csvHeader, systemField]) => {
        if (systemField && systemField !== 'ignore') {
          mapped[systemField] = row[csvHeader] || ''
        }
      })
      return mapped
    })
  }, [csvData, mapeamento])

  // Verifica se existe alguma coluna mapeada para 'nome' e outra para 'email'
  const camposObrigatoriosMapeados = 
    Object.values(mapeamento).includes('nome') && 
    Object.values(mapeamento).includes('email')

  const { validos, erros } = useMemo(() => {
    const valid: Record<string, string>[] = []
    const errorList: { row: number; errors: string[] }[] = []
    mappedData.forEach((row, index) => {
      const rowErrors = validateRow(row)
      if (rowErrors.length === 0) {
        valid.push(row)
      } else {
        errorList.push({ row: index + 2, errors: rowErrors })
      }
    })
    return { validos: valid, erros: errorList }
  }, [mappedData])

  // Função para realizar a importação
  const performImport = async () => {
    if (validos.length === 0) return

    setImportando(true)
    setProgresso(0)

    try {
      // Simular progresso incremental
      const progressInterval = setInterval(() => {
        setProgresso(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Chamar API de importação
      // O organizationId é obtido automaticamente do token JWT do usuário logado
      const response = await fetch('/api/contatos/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts: validos,
        }),
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na importação')
      }

      const result = await response.json()
      setProgresso(100)
      
      setImportResult({
        imported: result.data?.imported || 0,
        errors: result.data?.errors?.length || 0,
        duplicates: result.data?.duplicates?.length || 0,
      })

      if (result.data?.errors?.length > 0) {
        toast.warning(`${result.data.errors.length} contatos não puderam ser importados`)
      }
      
      if (result.data?.duplicates?.length > 0) {
        toast.info(`${result.data.duplicates.length} contatos já existiam`)
      }

    } catch (error: any) {
      setProgresso(0)
      toast.error(`Erro na importação: ${error.message}`)
      console.error('Erro na importação:', error)
    } finally {
      setImportando(false)
    }
  }

  useEffect(() => {
    if (step === 4 && !importando && importResult === null) {
      performImport()
    }
  }, [step, importando, importResult])

  const resetWizard = () => {
    setStep(1)
    setArquivo(null)
    setCsvHeaders([])
    setCsvData([])
    setMapeamento({})
    setProgresso(0)
    setImportando(false)
    setImportResult(null)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Importar Contatos</h1>
          <p className="text-muted-foreground mt-1">
            Importe contatos em massa através de um arquivo CSV
          </p>
        </div>

        <Separator className="mb-8" />

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {STEPS.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      step === s.id && "border-[#46347F] bg-[#46347F] text-white",
                      step > s.id && "border-[#46347F] bg-[#46347F]/20 text-[#46347F]",
                      step < s.id && "border-muted bg-muted text-muted-foreground"
                    )}
                  >
                    {step > s.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{s.id}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      step === s.id ? "text-[#46347F]" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-4 h-0.5 w-16 sm:w-24",
                      step > s.id ? "bg-[#46347F]" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo do Passo */}
        <div className="mx-auto max-w-4xl">
          {step === 1 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Selecione o arquivo</h3>
                  <p className="text-sm text-muted-foreground">
                    Faça upload de um arquivo CSV com seus contatos
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar template CSV
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                    dragActive
                      ? "border-[#46347F] bg-[#46347F]/10"
                      : "border-[#46347F]/40 hover:border-[#46347F] hover:bg-[#46347F]/5"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleInputChange}
                  />
                  <Upload className="mx-auto h-10 w-10 text-[#46347F]/60" />
                  <p className="mt-4 text-sm font-medium">
                    Arraste e solte seu arquivo CSV aqui
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">ou</p>
                  <Button variant="outline" className="mt-2">
                    Selecionar arquivo
                  </Button>
                </div>

                {arquivo && (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-gray-50 p-4">
                    <FileText className="h-8 w-8 text-[#46347F]" />
                    <div>
                      <p className="font-medium">{arquivo.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(arquivo.size / 1024).toFixed(2)} KB • {csvData.length} registros
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!arquivo || csvData.length === 0}
                    className="bg-[#46347F] hover:bg-[#46347F] text-white"
                  >
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Mapeie as colunas do arquivo</h3>
                <p className="text-sm text-muted-foreground">
                  Associe cada coluna do seu arquivo ao campo correspondente no sistema ({csvHeaders.length} colunas encontradas)
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-sm border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Coluna do arquivo</TableHead>
                        <TableHead>Campo no sistema</TableHead>
                        <TableHead>Exemplo de dado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvHeaders.map((header) => (
                        <TableRow key={header}>
                          <TableCell>
                            <span className="inline-flex items-center rounded-sm bg-gray-100 px-2 py-1 text-xs font-medium">
                              {header}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={mapeamento[header] || "ignore"}
                              onValueChange={(value) =>
                                setMapeamento({ ...mapeamento, [header]: value })
                              }
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SYSTEM_FIELDS.map((field) => (
                                  <SelectItem key={field.value} value={field.value}>
                                    {field.label}
                                    {field.required && (
                                      <span className="ml-1 text-red-500">*</span>
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                            {csvData[0]?.[header] || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {!camposObrigatoriosMapeados && (
                  <p className="text-sm text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Os campos obrigatórios (Nome e Email) devem ser mapeados
                  </p>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!camposObrigatoriosMapeados}
                    className="bg-[#46347F] hover:bg-[#46347F] text-white"
                  >
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Revisão dos dados</h3>
                <p className="text-sm text-muted-foreground">
                  Verifique se os dados estão corretos antes de importar
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cards de resumo */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-600">Total de registros</p>
                    <p className="text-2xl font-bold text-blue-700">{mappedData.length}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-600">Válidos</p>
                    <p className="text-2xl font-bold text-emerald-700">{validos.length}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4">
                    <p className="text-sm text-red-600">Com erros</p>
                    <p className="text-2xl font-bold text-red-700">{erros.length}</p>
                  </div>
                </div>

                {/* Tabela de preview */}
                <div className="rounded-sm border border-border max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Erros</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappedData.slice(0, 10).map((row, index) => {
                        const rowErrors = validateRow(row)
                        return (
                          <TableRow
                            key={index}
                            className={rowErrors.length > 0 ? "bg-red-50" : ""}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              {row.nome || "-"} {row.sobrenome}
                            </TableCell>
                            <TableCell>{row.email || "-"}</TableCell>
                            <TableCell>{row.telefone || "-"}</TableCell>
                            <TableCell>{row.status || "-"}</TableCell>
                            <TableCell>
                              {rowErrors.length > 0 && (
                                <span className="inline-flex items-center rounded-sm bg-red-100 px-2 py-1 text-xs font-medium text-red-600">
                                  {rowErrors.length} erro(s)
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {mappedData.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            ... e mais {mappedData.length - 10} registros
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Lista de erros */}
                {erros.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <h4 className="mb-2 font-medium text-red-700">Erros encontrados:</h4>
                    <ul className="space-y-1 text-sm text-red-600 max-h-[150px] overflow-auto">
                      {erros.slice(0, 5).map((e, i) => (
                        <li key={i}>
                          Linha {e.row}: {e.errors.join(", ")}
                        </li>
                      ))}
                      {erros.length > 5 && (
                        <li>... e mais {erros.length - 5} erros</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={validos.length === 0}
                    className="bg-[#46347F] hover:bg-[#46347F] text-white"
                  >
                    Importar {validos.length} contato(s)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardContent className="py-12">
                {progresso < 100 ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#46347F] mb-4" />
                    <h3 className="text-lg font-semibold">Importando contatos...</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Por favor, aguarde enquanto processamos seu arquivo
                    </p>
                    <div className="w-full max-w-md mt-6">
                      <Progress value={progresso} className="h-2" />
                      <p className="text-center text-sm text-muted-foreground mt-2">
                        {progresso}%
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
                    <h3 className="text-2xl font-bold">Importação concluída!</h3>
                    <div className="mt-4 space-y-2">
                      <p className="text-emerald-600 font-medium">
                        {importResult?.imported || 0} contato(s) importado(s) com sucesso
                      </p>
                      {importResult && importResult.duplicates > 0 && (
                        <p className="text-amber-600 text-sm">
                          {importResult.duplicates} contato(s) ignorado(s) por já existirem
                        </p>
                      )}
                      {importResult && importResult.errors > 0 && (
                        <p className="text-red-600 text-sm">
                          {importResult.errors} contato(s) com erro na importação
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3 mt-8">
                      <Button asChild variant="outline">
                        <Link href="/contatos">Ver Contatos</Link>
                      </Button>
                      <Button
                        onClick={resetWizard}
                        className="bg-[#46347F] hover:bg-[#46347F] text-white"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Importar Outro Arquivo
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
