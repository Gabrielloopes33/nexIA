"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreateInstanceModalProps {
  onCreate: (name: string) => Promise<unknown>;
  children?: React.ReactNode;
}

export function CreateInstanceModal({
  onCreate,
  children,
}: CreateInstanceModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await onCreate(name.trim());
      setName("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar instância");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-[#46347F] hover:bg-[#46347F]/90">
            <Plus className="h-4 w-4 mr-2" />
            Nova Instância
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Instância WhatsApp</DialogTitle>
          <DialogDescription>
            Crie uma nova instância para conectar um número de WhatsApp via
            Evolution API.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Instância</Label>
            <Input
              id="name"
              placeholder="Ex: WhatsApp Vendas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Use um nome descritivo para identificar esta instância.
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#46347F] hover:bg-[#46347F]/90"
            >
              {isLoading ? "Criando..." : "Criar Instância"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
