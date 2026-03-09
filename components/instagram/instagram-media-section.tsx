"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Image as ImageIcon, 
  Film, 
  Layers, 
  Heart, 
  MessageCircle,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface InstagramMedia {
  id: string
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS"
  media_url?: string
  thumbnail_url?: string
  permalink: string
  caption?: string
  like_count: number
  comments_count: number
  timestamp: string
}

// Mock media data
const mockMedia: InstagramMedia[] = [
  {
    id: "1",
    media_type: "IMAGE",
    permalink: "https://instagram.com/p/1",
    caption: "Novo lançamento! 🎉",
    like_count: 2450,
    comments_count: 128,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "2",
    media_type: "REELS",
    permalink: "https://instagram.com/p/2",
    caption: "Dicas de como usar nosso produto",
    like_count: 3890,
    comments_count: 256,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "3",
    media_type: "CAROUSEL_ALBUM",
    permalink: "https://instagram.com/p/3",
    caption: "Detalhes do novo coleção",
    like_count: 1820,
    comments_count: 89,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: "4",
    media_type: "VIDEO",
    permalink: "https://instagram.com/p/4",
    caption: "Tutorial completo",
    like_count: 1560,
    comments_count: 67,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
  {
    id: "5",
    media_type: "IMAGE",
    permalink: "https://instagram.com/p/5",
    caption: "Behind the scenes 🎬",
    like_count: 2100,
    comments_count: 145,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
  },
  {
    id: "6",
    media_type: "REELS",
    permalink: "https://instagram.com/p/6",
    caption: "Tendências do momento",
    like_count: 5670,
    comments_count: 432,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(),
  },
]

type MediaFilter = "ALL" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS"

interface InstagramMediaSectionProps {
  media: InstagramMedia[]
  isLoading?: boolean
  onRefresh: () => Promise<void>
}

export function InstagramMediaSection({
  media,
  isLoading,
  onRefresh,
}: InstagramMediaSectionProps) {
  const [filter, setFilter] = useState<MediaFilter>("ALL")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const displayMedia = media.length > 0 ? media : mockMedia

  const filteredMedia = displayMedia.filter((item) =>
    filter === "ALL" ? true : item.media_type === filter
  )

  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage)
  const paginatedMedia = filteredMedia.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Film className="h-5 w-5" />
      case "REELS":
        return <Film className="h-5 w-5" />
      case "CAROUSEL_ALBUM":
        return <Layers className="h-5 w-5" />
      default:
        return <ImageIcon className="h-5 w-5" />
    }
  }

  const getMediaBadge = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Badge variant="secondary" className="gap-1"><Film className="h-3 w-3" /> Vídeo</Badge>
      case "REELS":
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 gap-1"><Film className="h-3 w-3" /> Reels</Badge>
      case "CAROUSEL_ALBUM":
        return <Badge variant="outline" className="gap-1"><Layers className="h-3 w-3" /> Álbum</Badge>
      default:
        return <Badge variant="outline" className="gap-1"><ImageIcon className="h-3 w-3" /> Foto</Badge>
    }
  }

  const filterOptions: { value: MediaFilter; label: string }[] = [
    { value: "ALL", label: "Todas" },
    { value: "IMAGE", label: "Fotos" },
    { value: "VIDEO", label: "Vídeos" },
    { value: "CAROUSEL_ALBUM", label: "Álbuns" },
    { value: "REELS", label: "Reels" },
  ]

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]">
                <ImageIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Feed de Mídias</h3>
                <p className="text-sm text-muted-foreground">
                  {filteredMedia.length} publicações encontradas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter(option.value)
              setCurrentPage(1)
            }}
            className={filter === option.value ? 
              "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white" : ""
            }
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Media Grid */}
      <Card className="border-border">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array(6).fill(null).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : paginatedMedia.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma publicação encontrada</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Não encontramos publicações com o filtro selecionado. Tente ajustar os filtros ou atualizar a página.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {paginatedMedia.map((item) => (
                  <a
                    key={item.id}
                    href={item.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
                  >
                    {/* Media Preview */}
                    {item.thumbnail_url || item.media_url ? (
                      <img
                        src={item.thumbnail_url || item.media_url}
                        alt={item.caption || "Instagram post"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#F77737]/10">
                        {getMediaIcon(item.media_type)}
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ExternalLink className="h-8 w-8 text-white opacity-80" />
                      </div>
                    </div>

                    {/* Stats Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="text-white flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm">
                          <Heart className="h-4 w-4 fill-current" />
                          {item.like_count.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm">
                          <MessageCircle className="h-4 w-4" />
                          {item.comments_count}
                        </span>
                      </div>
                    </div>

                    {/* Type Badge */}
                    <div className="absolute top-2 right-2">
                      {getMediaBadge(item.media_type)}
                    </div>

                    {/* Timestamp */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-black/50 text-white border-0">
                        {formatDistanceToNow(new Date(item.timestamp))}
                      </Badge>
                    </div>

                    {/* Caption (on hover) */}
                    {item.caption && (
                      <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-sm line-clamp-2">
                          {item.caption}
                        </p>
                      </div>
                    )}
                  </a>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
