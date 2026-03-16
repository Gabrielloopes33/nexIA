'use client'

import { useIntegrationLogs, useIntegrationLogsStats, STATUS_COLORS, INTEGRATION_TYPE_LABELS, ACTIVITY_TYPE_LABELS } from '@/hooks/use-integration-logs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'
import { formatDistanceToNow } from '@/lib/utils'

// Dashboard de logs de integrações
export function IntegrationLogsExample() {
  const [period, setPeriod] = useState<'1h' | '24h' | '7d'>('24h')
  
  const {
    logs,
    pagination,
    isLoading,
    clearLogs,
  } = useIntegrationLogs({
    limit: 50,
  })

  const { stats } = useIntegrationLogsStats(period)

  const handleClear = async () => {
    if (confirm('Limpar logs antigos (mais de 30 dias)?')) {
      await clearLogs(30)
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.totalCount}</p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                  <p className={`text-2xl font-bold ${
                    stats.successRate >= 95 ? 'text-green-600' :
                    stats.successRate >= 80 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {stats.successRate}%
                  </p>
                </div>
                {stats.successRate >= 95 ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Duração Média</p>
                  <p className="text-2xl font-bold">
                    {stats.avgDurationMs}ms
                  </p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Erros Recentes</p>
                  <p className={`text-2xl font-bold ${
                    stats.recentErrors.length === 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.recentErrors.length}
                  </p>
                </div>
                {stats.recentErrors.length === 0 ? (
                  <Wifi className="h-8 w-8 text-green-500" />
                ) : (
                  <WifiOff className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Logs de Integrações
            {pagination && (
              <Badge variant="secondary">{pagination.total}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="text-sm border rounded-md px-2 py-1"
            >
              <option value="1h">Última hora</option>
              <option value="24h">Últimas 24h</option>
              <option value="7d">Últimos 7 dias</option>
            </select>
            <Button variant="outline" size="icon" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : (
                logs?.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${
                      log.status === 'SUCCESS' ? 'border-l-green-500 bg-green-50/50' :
                      log.status === 'FAILED' ? 'border-l-red-500 bg-red-50/50' :
                      log.status === 'WARNING' ? 'border-l-yellow-500 bg-yellow-50/50' :
                      'border-l-blue-500 bg-blue-50/50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${STATUS_COLORS[log.status]}`}>
                      {log.status === 'SUCCESS' ? <CheckCircle className="h-4 w-4" /> :
                       log.status === 'FAILED' ? <XCircle className="h-4 w-4" /> :
                       log.status === 'WARNING' ? <AlertTriangle className="h-4 w-4" /> :
                       <Clock className="h-4 w-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{log.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {INTEGRATION_TYPE_LABELS[log.integrationType]}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {ACTIVITY_TYPE_LABELS[log.activityType]}
                        </Badge>
                      </div>
                      
                      {log.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.description}
                        </p>
                      )}
                      
                      {log.errorMessage && (
                        <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">
                          Erro: {log.errorMessage}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(log.createdAt))}</span>
                        {log.durationMs && (
                          <span>{log.durationMs}ms</span>
                        )}
                        {log.retryCount > 0 && (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Retry {log.retryCount}/{log.maxRetries}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
