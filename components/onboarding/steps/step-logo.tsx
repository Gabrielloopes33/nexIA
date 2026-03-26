'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { ImageIcon, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StepLogoProps {
  logoUrl: string | null
  onChange: (logoUrl: string | null) => void
  onNext: () => void
  onBack: () => void
}

export function StepLogo({
  logoUrl,
  onChange,
  onNext,
  onBack,
}: StepLogoProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = useCallback(
    async (file: File | null) => {
      if (!file) {
        onChange(null)
        return
      }

      // Validações
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB')
        return
      }

      setIsUploading(true)

      try {
        // Criar FormData para upload
        const formData = new FormData()
        formData.append('file', file)

        // Upload para API (assumindo que existe endpoint /api/upload)
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Erro ao fazer upload da imagem')
        }

        const data = await response.json()
        onChange(data.url)
      } catch (error) {
        console.error('Erro no upload:', error)
        // Fallback: criar URL local temporária
        const localUrl = URL.createObjectURL(file)
        onChange(localUrl)
      } finally {
        setIsUploading(false)
      }
    },
    [onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileChange(file)
      }
    },
    [handleFileChange]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleRemoveLogo = useCallback(() => {
    onChange(null)
  }, [onChange])

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
          <ImageIcon className="size-6 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Logo da Empresa
        </h2>
        <p className="text-gray-600">
          Adicione o logo da sua organização (opcional)
        </p>
      </div>

      <div className="space-y-6">
        {/* Área de Upload */}
        {logoUrl ? (
          <div className="relative">
            <div className="aspect-video w-full max-w-[200px] mx-auto bg-white rounded-xl border-2 border-dashed border-gray-300 p-4 flex items-center justify-center">
              <img
                src={logoUrl}
                alt="Logo da empresa"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <button
              onClick={handleRemoveLogo}
              className="absolute -top-2 -right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full text-red-600 transition-colors"
              title="Remover logo"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'aspect-video w-full bg-white rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 cursor-pointer',
              isDragging
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400'
            )}
          >
            <div className="p-3 rounded-full bg-gray-100">
              <Upload className="size-6 text-gray-500" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-medium text-gray-700">
                Clique para fazer upload ou arraste uma imagem
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG ou GIF até 5MB
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 h-11"
          >
            Voltar
          </Button>
          <Button
            type="button"
            onClick={onNext}
            disabled={isUploading}
            className="flex-1 h-11 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isUploading ? 'Enviando...' : 'Continuar'}
          </Button>
        </div>

        {/* Skip option */}
        {!logoUrl && (
          <button
            onClick={onNext}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Pular esta etapa
          </button>
        )}
      </div>
    </motion.div>
  )
}
