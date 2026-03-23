/**
 * Utilitários para gerenciamento de instâncias Evolution API
 */

import type { EvolutionInstanceResponse } from "@/lib/types/evolution";

/**
 * Configuração de status da instância Evolution
 */
export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

/**
 * Retorna a configuração de visualização para um status de instância
 * @param status Status da instância
 * @returns Configuração de cor e label
 */
export function getStatusConfig(status: string): StatusConfig {
  switch (status) {
    case "CONNECTED":
      return {
        label: "Conectado",
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
      };
    case "CONNECTING":
      return {
        label: "Conectando...",
        color: "text-amber-600",
        bgColor: "bg-amber-100",
      };
    case "DISCONNECTED":
      return {
        label: "Desconectado",
        color: "text-slate-600",
        bgColor: "bg-slate-100",
      };
    case "ERROR":
      return {
        label: "Erro",
        color: "text-red-600",
        bgColor: "bg-red-100",
      };
    default:
      return {
        label: status,
        color: "text-slate-600",
        bgColor: "bg-slate-100",
      };
  }
}

/**
 * Formata número de telefone no padrão brasileiro
 * @param phone Telefone sem formatação
 * @returns Telefone formatado (XX) XXXXX-XXXX
 */
export function formatPhoneNumber(phone: string | null): string {
  if (!phone) return "N/A";

  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 13 && cleaned.startsWith("55")) {
    // Número internacional brasileiro (55XX9XXXXXXXX)
    return cleaned.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4");
  } else if (cleaned.length === 12 && cleaned.startsWith("55")) {
    // Número internacional brasileiro sem nono dígito
    return cleaned.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, "+$1 ($2) $3-$4");
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return phone;
}

/**
 * Verifica se a instância está conectada
 * @param instance Instância do Evolution
 * @returns true se estiver conectada
 */
export function isInstanceConnected(instance: EvolutionInstanceResponse): boolean {
  return instance.status === "CONNECTED";
}

/**
 * Verifica se a instância está em processo de conexão
 * @param instance Instância do Evolution
 * @returns true se estiver conectando
 */
export function isInstanceConnecting(instance: EvolutionInstanceResponse): boolean {
  return instance.status === "CONNECTING";
}

/**
 * Gera um nome de instância único baseado no nome fornecido
 * @param name Nome da instância
 * @returns Nome da instância formatado para uso na API
 */
export function generateInstanceName(name?: string): string {
  if (name) {
    // Remove caracteres especiais e espaços, mantém apenas letras, números e underscore
    const sanitized = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-zA-Z0-9_\s]/g, "") // Remove caracteres especiais
      .replace(/\s+/g, "_") // Substitui espaços por underscore
      .toLowerCase();

    // Adiciona timestamp para garantir unicidade
    const timestamp = Date.now().toString(36);
    return `${sanitized}_${timestamp}`;
  }

  // Se não houver nome, gera um nome único no formato nexia_{timestamp}_{random}
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `nexia_${timestamp}_${random}`;
}
