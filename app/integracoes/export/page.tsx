"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Download, FileSpreadsheet, FileJson, FileCode, Calendar, Filter } from "lucide-react"

export default function ExportPage() {
  const [formato, setFormato] = useState("csv")
  const [dataInicio, setDataInicio] = useState("2026-01-01")
  const [dataFim, setDataFim] = useState("2026-02-28")
  const [integracao, setIntegracao] = useState("todas")
  const [status, setStatus] = useState("todos")

  const estimativaRegistros = 1247

  const handleExport = () => {
    alert(`Exportando ${estimativaRegistros} registros em formato ${formato.toUpperCase()}`)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exportar Logs</h1>
        <p className="text-sm text-muted-foreground">
          Exporte o histórico de logs das integrações
        </p>
      </div>

      {/* Form */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#9795e4]" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          {/* Período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input 
                type="date" 
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input 
                type="date" 
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          {/* Integração e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Integração</Label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={integracao}
                onChange={(e) => setIntegracao(e.target.value)}
              >
                <option value="todas">Todas as integrações</option>
                <option value="whatsapp-oficial">WhatsApp Oficial</option>
                <option value="whatsapp-nao-oficial">WhatsApp Não Oficial</option>
                <option value="instagram">Instagram</option>
                <option value="hotmart">Hotmart</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="success">Sucesso</option>
                <option value="error">Erro</option>
                <option value="warning">Alerta</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formato */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold">Formato de Exportação</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <RadioGroup value={formato} onValueChange={setFormato} className="grid grid-cols-3 gap-4">
            <div>
              <RadioGroupItem value="csv" id="csv" className="peer sr-only" />
              <Label
                htmlFor="csv"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#9795e4] [&:has([data-state=checked])]:border-[#9795e4] cursor-pointer"
              >
                <FileSpreadsheet className="mb-3 h-6 w-6 text-[#9795e4]" />
                <span className="text-sm font-medium">CSV</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="json" id="json" className="peer sr-only" />
              <Label
                htmlFor="json"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#9795e4] [&:has([data-state=checked])]:border-[#9795e4] cursor-pointer"
              >
                <FileJson className="mb-3 h-6 w-6 text-[#9795e4]" />
                <span className="text-sm font-medium">JSON</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="xlsx" id="xlsx" className="peer sr-only" />
              <Label
                htmlFor="xlsx"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#9795e4] [&:has([data-state=checked])]:border-[#9795e4] cursor-pointer"
              >
                <FileCode className="mb-3 h-6 w-6 text-[#9795e4]" />
                <span className="text-sm font-medium">XLSX</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Estimativa */}
      <Card className="shadow-sm bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Estimativa de registros</p>
              <p className="text-2xl font-bold">~{estimativaRegistros.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Tamanho aproximado</p>
              <p className="text-lg font-semibold">
                {formato === 'csv' ? '~245 KB' : formato === 'json' ? '~520 KB' : '~180 KB'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Exportar */}
      <Button 
        className="w-full gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]"
        onClick={handleExport}
      >
        <Download className="h-4 w-4" />
        Exportar Agora
      </Button>
    </div>
  )
}
