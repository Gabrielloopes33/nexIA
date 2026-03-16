/**
 * Upload de mídia para Meta WhatsApp Cloud API
 * Implementa upload resumável para arquivos grandes
 */

import { WhatsAppInstance } from "@prisma/client";

interface UploadSession {
  id: string;
  fileOffset: number;
}

interface UploadResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

/**
 * Inicia uma sessão de upload resumável
 * @param instance - Instância WhatsApp
 * @param fileLength - Tamanho do arquivo em bytes
 * @param fileType - MIME type do arquivo
 * @param fileName - Nome do arquivo
 */
async function initiateUploadSession(
  instance: WhatsAppInstance,
  fileLength: number,
  fileType: string,
  fileName: string
): Promise<UploadSession | null> {
  try {
    const url = `https://graph.facebook.com/v18.0/${instance.phoneNumberId}/uploads?file_length=${fileLength}&file_type=${fileType}&file_name=${encodeURIComponent(fileName)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${instance.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[MediaUpload] Erro ao iniciar sessão:", error);
      return null;
    }

    const data = await response.json();

    if (!data.id) {
      console.error("[MediaUpload] Sessão não retornou ID:", data);
      return null;
    }

    return {
      id: data.id,
      fileOffset: 0,
    };
  } catch (error) {
    console.error("[MediaUpload] Erro ao iniciar sessão:", error);
    return null;
  }
}

/**
 * Faz upload de um chunk do arquivo
 * @param session - Sessão de upload
 * @param instance - Instância WhatsApp
 * @param chunk - Buffer do chunk
 * @param offset - Offset no arquivo
 */
async function uploadChunk(
  session: UploadSession,
  instance: WhatsAppInstance,
  chunk: Buffer,
  offset: number
): Promise<boolean> {
  try {
    const url = `https://graph.facebook.com/v18.0/${session.id}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${instance.accessToken}`,
        "Content-Type": "application/octet-stream",
        "file_offset": offset.toString(),
      },
      body: chunk,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[MediaUpload] Erro ao enviar chunk:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[MediaUpload] Erro ao enviar chunk:", error);
    return false;
  }
}

/**
 * Finaliza o upload e obtém o media_id
 * @param session - Sessão de upload
 * @param instance - Instância WhatsApp
 */
async function finalizeUpload(
  session: UploadSession,
  instance: WhatsAppInstance
): Promise<string | null> {
  try {
    const url = `https://graph.facebook.com/v18.0/${session.id}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${instance.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[MediaUpload] Erro ao finalizar upload:", error);
      return null;
    }

    const data = await response.json();

    if (!data.h || !data.h.id) {
      console.error("[MediaUpload] Finalização não retornou media_id:", data);
      return null;
    }

    return data.h.id;
  } catch (error) {
    console.error("[MediaUpload] Erro ao finalizar upload:", error);
    return null;
  }
}

/**
 * Faz upload completo de um arquivo PDF para a Meta API
 * @param instance - Instância WhatsApp
 * @param fileBuffer - Buffer do arquivo
 * @param fileName - Nome do arquivo
 */
export async function uploadPdfToMeta(
  instance: WhatsAppInstance,
  fileBuffer: Buffer,
  fileName: string
): Promise<UploadResult> {
  console.log(`[MediaUpload] Iniciando upload de ${fileName} (${fileBuffer.length} bytes)`);

  // Tamanho do chunk: 5MB (limite da Meta)
  const CHUNK_SIZE = 5 * 1024 * 1024;
  const fileLength = fileBuffer.length;
  const fileType = "application/pdf";

  // 1. Inicia sessão de upload
  const session = await initiateUploadSession(
    instance,
    fileLength,
    fileType,
    fileName
  );

  if (!session) {
    return {
      success: false,
      error: "Falha ao iniciar sessão de upload",
    };
  }

  console.log(`[MediaUpload] Sessão iniciada: ${session.id}`);

  // 2. Envia chunks
  let offset = 0;
  while (offset < fileLength) {
    const chunk = fileBuffer.slice(offset, offset + CHUNK_SIZE);
    const success = await uploadChunk(session, instance, chunk, offset);

    if (!success) {
      return {
        success: false,
        error: `Falha ao enviar chunk em offset ${offset}`,
      };
    }

    offset += chunk.length;
    console.log(`[MediaUpload] Progresso: ${((offset / fileLength) * 100).toFixed(1)}%`);
  }

  // 3. Finaliza upload
  const mediaId = await finalizeUpload(session, instance);

  if (!mediaId) {
    return {
      success: false,
      error: "Falha ao finalizar upload",
    };
  }

  console.log(`[MediaUpload] Upload concluído. Media ID: ${mediaId}`);

  return {
    success: true,
    mediaId,
  };
}

/**
 * Faz upload simples (para arquivos pequenos < 5MB)
 * @param instance - Instância WhatsApp
 * @param fileBuffer - Buffer do arquivo
 * @param fileName - Nome do arquivo
 */
export async function uploadPdfSimple(
  instance: WhatsAppInstance,
  fileBuffer: Buffer,
  fileName: string
): Promise<UploadResult> {
  try {
    const url = `https://graph.facebook.com/v18.0/${instance.phoneNumberId}/media`;

    // Cria FormData manualmente
    const boundary = `----FormBoundary${Date.now()}`;
    const CRLF = "\r\n";

    const bodyParts = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="messaging_product"`,
      "",
      "whatsapp",
      `--${boundary}`,
      `Content-Disposition: form-data; name="type"`,
      "",
      "application/pdf",
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
      `Content-Type: application/pdf`,
      "",
    ];

    const bodyStart = Buffer.from(bodyParts.join(CRLF) + CRLF, "utf-8");
    const bodyEnd = Buffer.from(CRLF + `--${boundary}--` + CRLF, "utf-8");
    const body = Buffer.concat([bodyStart, fileBuffer, bodyEnd]);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${instance.accessToken}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[MediaUpload] Erro no upload simples:", error);
      return {
        success: false,
        error: `Meta API error: ${error}`,
      };
    }

    const data = await response.json();

    if (!data.id) {
      return {
        success: false,
        error: "Upload não retornou media_id",
      };
    }

    return {
      success: true,
      mediaId: data.id,
    };
  } catch (error) {
    console.error("[MediaUpload] Erro no upload simples:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Escolhe o método de upload baseado no tamanho do arquivo
 * @param instance - Instância WhatsApp
 * @param fileBuffer - Buffer do arquivo
 * @param fileName - Nome do arquivo
 */
export async function uploadPdf(
  instance: WhatsAppInstance,
  fileBuffer: Buffer,
  fileName: string
): Promise<UploadResult> {
  const MAX_SIMPLE_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

  if (fileBuffer.length <= MAX_SIMPLE_UPLOAD_SIZE) {
    console.log("[MediaUpload] Usando upload simples");
    return uploadPdfSimple(instance, fileBuffer, fileName);
  }

  console.log("[MediaUpload] Usando upload resumável");
  return uploadPdfToMeta(instance, fileBuffer, fileName);
}
