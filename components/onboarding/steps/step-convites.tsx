'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Plus, X, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StepConvitesProps {
  emails: string[]
  onChange: (emails: string[]) => void
  onNext: () => void
  onBack: () => void
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function StepConvites({
  emails,
  onChange,
  onNext,
  onBack,
}: StepConvitesProps) {
  const [currentEmail, setCurrentEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleAddEmail = useCallback(() => {
    const trimmedEmail = currentEmail.trim().toLowerCase()

    if (!trimmedEmail) {
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Por favor, insira um email válido')
      return
    }

    if (emails.includes(trimmedEmail)) {
      setError('Este email já foi adicionado')
      return
    }

    onChange([...emails, trimmedEmail])
    setCurrentEmail('')
    setError(null)
  }, [currentEmail, emails, onChange])

  const handleRemoveEmail = useCallback(
    (emailToRemove: string) => {
      onChange(emails.filter((email) => email !== emailToRemove))
    },
    [emails, onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddEmail()
      }
    },
    [handleAddEmail]
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
          <Users className="size-6 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Convide sua Equipe
        </h2>
        <p className="text-gray-600">
          Adicione membros para colaborar na sua organização
        </p>
      </div>

      <div className="space-y-6">
        {/* Input para adicionar email */}
        <div className="space-y-2">
          <Label htmlFor="invite-email">
            Email do convidado
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                id="invite-email"
                type="email"
                placeholder="colega@empresa.com"
                value={currentEmail}
                onChange={(e) => {
                  setCurrentEmail(e.target.value)
                  setError(null)
                }}
                onKeyDown={handleKeyDown}
                className="pl-10 h-11"
              />
            </div>
            <Button
              type="button"
              onClick={handleAddEmail}
              disabled={!currentEmail.trim()}
              className="h-11 px-4 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>

        {/* Lista de emails adicionados */}
        {emails.length > 0 && (
          <div className="space-y-2">
            <Label>Convidados ({emails.length})</Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {emails.map((email) => (
                <motion.div
                  key={email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">
                        {email[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">{email}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveEmail(email)}
                    className="p-1 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem quando não há emails */}
        {emails.length === 0 && (
          <div className="text-center py-8 px-4 bg-white/50 rounded-xl border border-dashed border-gray-300">
            <p className="text-sm text-gray-500">
              Nenhum convidado adicionado ainda.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Você pode adicionar membros depois nas configurações.
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-4">
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
            className="flex-1 h-11 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {emails.length > 0
              ? `Enviar ${emails.length} convite${emails.length > 1 ? 's' : ''}`
              : 'Finalizar'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
