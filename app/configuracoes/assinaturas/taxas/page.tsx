"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Save,
  Percent,
  FileText,
  DollarSign,
  Info,
  Calculator,
  TrendingUp,
  Receipt
} from "lucide-react"

interface Taxa {
  id: string
  nome: string
  descricao: string
  valor: string
  tipo: "percentual" | "fixo"
  aplicacao: string
}

const taxas: Taxa[] = [
  { id: "tax_001", nome: "Taxa Stripe - Crédito", descricao: "Taxa do processador para cartões de crédito", valor: "2,99%", tipo: "percentual", aplicacao: "Por transação" },
  { id: "tax_002", nome: "Taxa Stripe - Débito", descricao: "Taxa do processador para cartões de débito", valor: "1,99%", tipo: "percentual", aplicacao: "Por transação" },
  { id: "tax_003", nome: "Taxa Stripe - Boleto", descricao: "Taxa fixa para processamento de boleto", valor: "R$ 2,50", tipo: "fixo", aplicacao: "Por boleto" },
  { id: "tax_004", nome: "Taxa Stripe - Pix", descricao: "Taxa para transações via Pix", valor: "0,99%", tipo: "percentual", aplicacao: "Por transação" },
]

const impostos = [
  { id: "imp_001", nome: "ISS", descricao: "Imposto sobre Serviços", valor: "5%", obrigatorio: true },
  { id: "imp_002", nome: "PIS/COFINS", descricao: "Contribuições federais", valor: "3,65%", obrigatorio: true },
]

export default function TaxasPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Taxas e Impostos</h1>
          <p className="text-sm text-muted-foreground">
            Configure taxas de processamento e impostos aplicáveis
          </p>
        </div>
        <Button className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
          <Save className="h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      {/* Taxas do Processador */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#46347F]" />
            Taxas do Processador (Stripe)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {taxas.map((taxa) => (
              <div key={taxa.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-sm">{taxa.nome}</p>
                  <p className="text-xs text-muted-foreground">{taxa.descricao}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">{taxa.valor}</p>
                    <p className="text-xs text-muted-foreground">{taxa.aplicacao}</p>
                  </div>
                  <Input 
                    className="w-24 text-right" 
                    defaultValue={taxa.valor.replace('%', '').replace('R$ ', '')}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-700">
              Essas taxas são definidas pelo Stripe e podem variar de acordo com seu contrato. 
              Consulte seu dashboard Stripe para os valores exatos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Impostos */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#46347F]" />
            Impostos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {impostos.map((imposto) => (
              <div key={imposto.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#46347F]/10 flex items-center justify-center">
                    <Percent className="h-4 w-4 text-[#46347F]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{imposto.nome}</p>
                      {imposto.obrigatorio && (
                        <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{imposto.descricao}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{imposto.valor}</span>
                  <Input className="w-24 text-right" defaultValue={imposto.valor.replace('%', '')} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simulador */}
      <Card className="shadow-sm border-[#46347F]/20">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[#46347F]" />
            Simulador de Receita
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Valor da Assinatura</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-10" placeholder="0,00" defaultValue="199,00" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Método de Pagamento</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option>Cartão de Crédito</option>
                <option>Cartão de Débito</option>
                <option>Boleto</option>
                <option>Pix</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Quantidade</label>
              <Input type="number" placeholder="1" defaultValue="100" />
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#46347F]" />
              Estimativa
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Receita Bruta</p>
                <p className="text-lg font-semibold">R$ 19.900,00</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa Stripe</p>
                <p className="text-lg font-semibold text-red-600">-R$ 595,01</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Impostos</p>
                <p className="text-lg font-semibold text-red-600">-R$ 1.722,35</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita Líquida</p>
                <p className="text-lg font-semibold text-green-600">R$ 17.582,64</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
