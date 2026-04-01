/**
 * Validação de payload do webhook de formulários
 * Usa Zod para validação de schema
 */

import { z } from "zod";

/**
 * Schema de validação para dados do lead
 */
export const LeadDataSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional(),
  telefone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .regex(/^\d+$/, "Telefone deve conter apenas números"),
});

/**
 * Schema de validação para o payload do webhook
 */
export const FormSubmissionPayloadSchema = z.object({
  // Autenticação
  secret: z.string().min(1, "Secret é obrigatório"),

  // Identificação da organização e instância
  organizationId: z.string().min(1, "organizationId é obrigatório"),
  instanceId: z.string().min(1, "instanceId é obrigatório"),

  // Template
  templateName: z.string().min(1, "templateName é obrigatório"),
  templateLanguage: z.string().default("pt_BR"),
  templateVariables: z.array(z.string()).default([]),

  // Lead
  leadData: LeadDataSchema,

  // PDF
  pdfUrl: z.string().url("pdfUrl deve ser uma URL válida"),
  pdfFilename: z.string().min(1, "pdfFilename é obrigatório"),

  // Produto e pipeline (opcional, para vinculação no CRM)
  productId: z.string().uuid().optional(),
  pipelineId: z.string().uuid().optional(),

  // Rastreamento externo
  dossieId: z.string().min(1, "dossieId é obrigatório"),
  alunoId: z.string().min(1, "alunoId é obrigatório"),

  // Metadados
  source: z.literal("typebot"),
  timestamp: z.string().datetime("Timestamp deve ser uma data ISO válida"),
});

/**
 * Tipo inferido do schema de payload
 */
export type ValidatedFormSubmissionPayload = z.infer<
  typeof FormSubmissionPayloadSchema
>;

/**
 * Valida o payload do webhook
 * @param payload - Dados recebidos no webhook
 * @returns Resultado da validação
 */
export function validateFormSubmissionPayload(
  payload: unknown
):
  | { success: true; data: ValidatedFormSubmissionPayload }
  | { success: false; errors: string[] } {
  const result = FormSubmissionPayloadSchema.safeParse(payload);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map(
    (err) => `${err.path.join(".")}: ${err.message}`
  );

  return { success: false, errors };
}

/**
 * Verifica se o secret está correto
 * @param receivedSecret - Secret recebido no payload
 * @returns true se válido
 */
export function validateWebhookSecret(receivedSecret: string): boolean {
  const expectedSecret = process.env.FORM_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error("[FormWebhook] FORM_WEBHOOK_SECRET não configurado");
    return false;
  }

  // Usar timing-safe comparison para evitar timing attacks
  try {
    const receivedBuffer = Buffer.from(receivedSecret);
    const expectedBuffer = Buffer.from(expectedSecret);

    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return receivedBuffer.equals(expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Resultado da validação completa
 */
export interface ValidationResult {
  isValid: boolean;
  errorCode?:
    | "INVALID_SECRET"
    | "INVALID_PAYLOAD"
    | "MISSING_SECRET"
    | "INTERNAL_ERROR";
  errorMessage?: string;
  payload?: ValidatedFormSubmissionPayload;
}

/**
 * Validação completa do webhook (secret + payload)
 * @param rawPayload - Dados brutos recebidos
 * @returns Resultado da validação
 */
export function validateWebhook(
  rawPayload: unknown
): ValidationResult {
  try {
    // Primeiro valida o schema para extrair o secret
    const parseResult = FormSubmissionPayloadSchema.safeParse(rawPayload);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      return {
        isValid: false,
        errorCode: "INVALID_PAYLOAD",
        errorMessage: errors.join("; "),
      };
    }

    const payload = parseResult.data;

    // Valida o secret
    if (!validateWebhookSecret(payload.secret)) {
      return {
        isValid: false,
        errorCode: "INVALID_SECRET",
        errorMessage: "Secret inválido",
      };
    }

    return {
      isValid: true,
      payload,
    };
  } catch (error) {
    console.error("[FormWebhook] Erro na validação:", error);
    return {
      isValid: false,
      errorCode: "INTERNAL_ERROR",
      errorMessage:
        error instanceof Error ? error.message : "Erro interno de validação",
    };
  }
}
