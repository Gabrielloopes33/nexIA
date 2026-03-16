/**
 * Download de PDF de URL externa
 * Usado para baixar PDFs do sistema plano-de-acao-lancamento
 */

export interface PdfDownloadResult {
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  size?: number;
  error?: string;
}

/**
 * Configurações de download
 */
const DEFAULT_TIMEOUT = 30000; // 30 segundos
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Download PDF de uma URL externa
 * @param url - URL do PDF
 * @param options - Opções de download
 */
export async function downloadPdf(
  url: string,
  options?: {
    timeout?: number;
    maxSize?: number;
  }
): Promise<PdfDownloadResult> {
  const timeout = options?.timeout || DEFAULT_TIMEOUT;
  const maxSize = options?.maxSize || MAX_PDF_SIZE;

  console.log(`[PdfDownloader] Iniciando download: ${url}`);

  try {
    // Cria AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/pdf,application/octet-stream,*/*",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Verifica Content-Type
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    
    // Verifica Content-Length
    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > maxSize) {
        return {
          success: false,
          error: `Arquivo muito grande: ${(size / 1024 / 1024).toFixed(2)}MB (máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB)`,
        };
      }
    }

    // Converte para buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verifica tamanho após download
    if (buffer.length > maxSize) {
      return {
        success: false,
        error: `Arquivo muito grande: ${(buffer.length / 1024 / 1024).toFixed(2)}MB (máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB)`,
      };
    }

    // Verifica se é um PDF válido (magic bytes)
    const isPdf = buffer.slice(0, 4).toString("hex") === "25504446"; // %PDF
    if (!isPdf && !contentType.includes("pdf")) {
      console.warn(`[PdfDownloader] Arquivo pode não ser um PDF válido: ${contentType}`);
    }

    console.log(`[PdfDownloader] Download concluído: ${buffer.length} bytes`);

    return {
      success: true,
      buffer,
      contentType,
      size: buffer.length,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: `Timeout após ${timeout}ms`,
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: "Erro desconhecido no download",
    };
  }
}

/**
 * Valida se um buffer é um PDF válido
 * @param buffer - Buffer do arquivo
 */
export function isValidPdf(buffer: Buffer): boolean {
  // Verifica magic bytes do PDF: %PDF
  return buffer.slice(0, 4).toString() === "%PDF";
}

/**
 * Extrai metadados básicos do PDF (se possível)
 * @param buffer - Buffer do PDF
 */
export function extractPdfMetadata(buffer: Buffer): {
  isValid: boolean;
  version?: string;
  pageCount?: number;
} {
  if (!isValidPdf(buffer)) {
    return { isValid: false };
  }

  // Extrai versão do PDF
  const header = buffer.slice(0, 8).toString();
  const versionMatch = header.match(/%PDF-(\d\.\d)/);
  const version = versionMatch ? versionMatch[1] : undefined;

  // Tenta contar páginas (procura por /Type /Page no arquivo)
  // Nota: Isso é uma aproximação simples
  const content = buffer.toString("latin1");
  const pageMatches = content.match(/\/Type\s*\/Page\b/g);
  const pageCount = pageMatches ? pageMatches.length : undefined;

  return {
    isValid: true,
    version,
    pageCount,
  };
}
