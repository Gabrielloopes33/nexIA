"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Image as ImageIcon, Film, Layers } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

interface InstagramMedia {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  like_count: number;
  comments_count: number;
  timestamp: string;
}

interface InstagramMediaSectionProps {
  media: InstagramMedia[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore: () => void;
}

export function InstagramMediaSection({
  media,
  isLoading,
  hasMore,
  onLoadMore,
}: InstagramMediaSectionProps) {
  const getMediaIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
      case "REELS":
        return <Film className="h-4 w-4" />;
      case "CAROUSEL_ALBUM":
        return <Layers className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const getMediaBadge = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Badge variant="secondary">Vídeo</Badge>;
      case "REELS":
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Reels</Badge>;
      case "CAROUSEL_ALBUM":
        return <Badge variant="outline">Álbum</Badge>;
      default:
        return <Badge variant="outline">Foto</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Publicações Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando publicações...
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma publicação encontrada
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {media.map((item) => (
              <a
                key={item.id}
                href={item.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
              >
                {/* Media Preview */}
                {item.media_url || item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url || item.media_url}
                    alt={item.caption || "Instagram post"}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getMediaIcon(item.media_type)}
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="text-white flex gap-4">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4 fill-current" />
                      {item.like_count}
                    </span>
                    <span className="flex items-center gap-1">
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
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white text-xs">
                    {formatDistanceToNow(new Date(item.timestamp))}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={onLoadMore}
              disabled={isLoading}
            >
              Carregar mais
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
