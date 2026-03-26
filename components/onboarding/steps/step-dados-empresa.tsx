'use client'

import { useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface StepDadosEmpresaData {
  name: string
  segment: string
}

interface StepDadosEmpresaProps {
  data: StepDadosEmpresaData
  onChange: (data: StepDadosEmpresaData) => void
  onNext: () => void
}

const segmentos = [
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'saude', label: 'Saúde' },
  { value: 'educacao', label: 'Educação' },
  { value: 'imobiliario', label: 'Imobiliário' },
  { value: 'outros', label: 'Outros' },
]

export function StepDadosEmpresa({
  data,
  onChange,
  onNext,
}: StepDadosEmpresaProps) {
  const isValid = useMemo(() => {
    return data.name.trim().length >= 2 && data.segment !== ''
  }, [data.name, data.segment])

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...data, name: e.target.value })
    },
    [data, onChange]
  )

  const handleSegmentChange = useCallback(
    (value: string) => {
      onChange({ ...data, segment: value })
    },
    [data, onChange]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (isValid) {
        onNext()
      }
    },
    [isValid, onNext]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center size-12 rounded-full bg-purple-100 mb-4">
          <Building2 className="size-6 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Dados da Empresa
        </h2>
        <p className="text-gray-600">
          Conte-nos um pouco sobre sua organização
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="company-name">
            Nome da Empresa <span className="text-red-500">*</span>
          </Label>
          <Input
            id="company-name"
            type="text"
            placeholder="Ex: Acme Inc"
            value={data.name}
            onChange={handleNameChange}
            className="h-11"
            autoFocus
          />
          {data.name.length > 0 && data.name.trim().length < 2 && (
            <p className="text-xs text-red-500">
              O nome deve ter pelo menos 2 caracteres
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="segment">
            Segmento <span className="text-red-500">*</span>
          </Label>
          <Select value={data.segment} onValueChange={handleSegmentChange}>
            <SelectTrigger id="segment" className="h-11 w-full">
              <SelectValue placeholder="Selecione um segmento" />
            </SelectTrigger>
            <SelectContent>
              {segmentos.map((segmento) => (
                <SelectItem key={segmento.value} value={segmento.value}>
                  {segmento.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white"
          disabled={!isValid}
        >
          Continuar
        </Button>
      </form>
    </motion.div>
  )
}
