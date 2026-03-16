'use client'

import { useTranscriptions, useTranscription } from '@/hooks/use-transcriptions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Mic, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Smile,
  Meh,
  Frown,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'

const STATUS_ICONS = {
  PENDING: Clock,
  PROCESSING: Mic,
  COMPLETED: CheckCircle,
  FAILED: XCircle,
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
}

const SENTIMENT_ICONS = {
  positive: Smile,
  neutral: Meh,
  negative: Frown,
}

// Lista de transcrições com analytics
export function TranscriptionsListExample() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  const {
    transcriptions,
    isLoading,
    getAnalytics,
  } = useTranscriptions({
    limit: 10,
  })

  const { data: analytics } = getAnalytics

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <div className="space-y-4">
      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{analytics.totalCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-green-600">
                {analytics.conversionStats.conversionRate}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Duração Média</p>
              <p className="text-2xl font-bold">
                {analytics.durationStats.avgMinutes}min
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Sentimento</p>
              <div className="flex gap-2 mt-1">
                {Object.entries(analytics.bySentiment).map(([sentiment, count]) => (
                  <Badge key={sentiment} variant="outline">
                    {sentiment}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Transcrições de Calls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transcriptions.map((transcription) => {
            const StatusIcon = STATUS_ICONS[transcription.status]
            const SentimentIcon = transcription.sentiment 
              ? SENTIMENT_ICONS[transcription.sentiment as keyof typeof SENTIMENT_ICONS]
              : null
            
            return (
              <div
                key={transcription.id}
                onClick={() => setSelectedId(transcription.id)}
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className={`p-2 rounded-md ${STATUS_COLORS[transcription.status]}`}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {transcription.contact?.name || 'Contato desconhecido'}
                    </span>
                    {transcription.converted && (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Convertido
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {transcription.title || transcription.transcript?.slice(0, 60) + '...'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {transcription.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {Math.floor(transcription.duration / 60)}:{(transcription.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                  {SentimentIcon && (
                    <SentimentIcon className={`h-5 w-5 ${
                      transcription.sentiment === 'positive' ? 'text-green-500' :
                      transcription.sentiment === 'negative' ? 'text-red-500' :
                      'text-yellow-500'
                    }`} />
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {selectedId && <TranscriptionDetail id={selectedId} />}
    </div>
  )
}

// Detalhe da transcrição
function TranscriptionDetail({ id }: { id: string }) {
  const { transcription, isLoading, updateTranscription } = useTranscription(id)

  if (isLoading || !transcription) {
    return <Skeleton className="h-64 w-full" />
  }

  const handleAnalyze = async () => {
    // Simula análise de IA
    await updateTranscription({
      sentiment: 'positive',
      sentimentScore: 0.8,
      keyTopics: ['preço', 'implementação', 'suporte'],
      actionItems: ['Enviar proposta', 'Agendar demo'],
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes da Transcrição</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transcription.transcript && (
          <div>
            <h4 className="font-medium mb-2">Transcrição</h4>
            <div className="bg-muted p-4 rounded-lg text-sm max-h-64 overflow-y-auto">
              {transcription.transcript}
            </div>
          </div>
        )}

        {transcription.summary && (
          <div>
            <h4 className="font-medium mb-2">Resumo (IA)</h4>
            <p className="text-sm text-muted-foreground">{transcription.summary}</p>
          </div>
        )}

        {transcription.keyTopics?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Tópicos Principais</h4>
            <div className="flex flex-wrap gap-2">
              {transcription.keyTopics.map((topic) => (
                <Badge key={topic} variant="secondary">{topic}</Badge>
              ))}
            </div>
          </div>
        )}

        {transcription.actionItems?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Ações Sugeridas</h4>
            <ul className="space-y-1">
              {transcription.actionItems.map((item, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={handleAnalyze}>
            Re-analisar com IA
          </Button>
          {transcription.audioUrl && (
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Ouvir Áudio
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
