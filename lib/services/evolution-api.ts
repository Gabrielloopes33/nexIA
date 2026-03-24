/**
 * Evolution API Service
 * 
 * Service para comunicação com a Evolution API (WhatsApp não oficial).
 * Gerencia instâncias, envio de mensagens e webhooks.
 * 
 * @module lib/services/evolution-api
 */

interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
}

interface CreateInstanceResponse {
  instance: {
    instanceName: string;
    state: string;
  };
}

interface ConnectionStateResponse {
  instance: string;
  state: 'open' | 'connecting' | 'close';
  status?: string;
}

interface QRCodeResponse {
  code?: string;
  base64?: string;
  pairingCode?: string;
  count?: number;
}

interface SendMessageResponse {
  key: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message: {
    extendedTextMessage?: { text: string };
    conversation?: string;
  };
  messageTimestamp: number;
  status?: string;
}

interface ProfileInfo {
  id: string;
  name: string;
  picture?: string;
  status?: string;
}

export class EvolutionAPIService {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: EvolutionConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
  }

  private async fetch(endpoint: string, options: RequestInit = {}): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
      ...options.headers as Record<string, string>,
    };

    // Debug log (remover em produção)
    console.log(`[Evolution API] ${options.method || 'GET'} ${url}`);
    console.log(`[Evolution API] Headers:`, { 'apikey': this.apiKey ? '***' + this.apiKey.slice(-4) : 'MISSING' });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Evolution API] Error ${response.status}:`, errorText);
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  }

  // ============================================
  // INSTANCE MANAGEMENT
  // ============================================

  /**
   * Cria uma nova instância WhatsApp na Evolution API
   */
  async createInstance(name: string): Promise<CreateInstanceResponse> {
    return this.fetch('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName: name,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    }) as Promise<CreateInstanceResponse>;
  }

  /**
   * Deleta uma instância existente
   */
  async deleteInstance(instanceName: string): Promise<void> {
    await this.fetch(`/instance/delete/${instanceName}`, {
      method: 'DELETE',
    });
  }

  /**
   * Obtém o estado da conexão de uma instância
   */
  async getConnectionState(instanceName: string): Promise<ConnectionStateResponse> {
    return this.fetch(`/instance/connectionState/${instanceName}`) as Promise<ConnectionStateResponse>;
  }

  /**
   * Conecta uma instância e retorna o QR code
   */
  async connectInstance(instanceName: string): Promise<QRCodeResponse> {
    return this.fetch(`/instance/connect/${instanceName}`, {
      method: 'GET',
    }) as Promise<QRCodeResponse>;
  }

  /**
   * Desconecta (faz logout) de uma instância
   */
  async disconnectInstance(instanceName: string): Promise<void> {
    await this.fetch(`/instance/logout/${instanceName}`, {
      method: 'DELETE',
    });
  }

  /**
   * Reinicia uma instância
   */
  async restartInstance(instanceName: string): Promise<void> {
    await this.fetch(`/instance/restart/${instanceName}`, {
      method: 'POST',
    });
  }

  /**
   * Configura o webhook para uma instância
   */
  async setWebhook(instanceName: string, webhookUrl: string): Promise<void> {
    await this.fetch(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        url: webhookUrl,
        events: ['messages.upsert', 'connection.update', 'qrcode.updated'],
      }),
    });
  }

  // ============================================
  // MESSAGING
  // ============================================

  /**
   * Envia uma mensagem de texto
   */
  async sendText(instanceName: string, phone: string, message: string): Promise<SendMessageResponse> {
    // Format phone number
    const formattedPhone = phone.replace(/\D/g, '');

    return this.fetch(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
        options: {
          delay: 1200,
          presence: 'composing',
        },
      }),
    }) as Promise<SendMessageResponse>;
  }

  /**
   * Envia uma mensagem de imagem
   */
  async sendImage(
    instanceName: string, 
    phone: string, 
    imageUrl: string, 
    caption?: string
  ): Promise<SendMessageResponse> {
    const formattedPhone = phone.replace(/\D/g, '');

    return this.fetch(`/message/sendMedia/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: formattedPhone,
        media: imageUrl,
        caption: caption || '',
        mediaType: 'image',
        options: {
          delay: 1200,
        },
      }),
    }) as Promise<SendMessageResponse>;
  }

  /**
   * Envia uma mensagem de documento
   */
  async sendDocument(
    instanceName: string,
    phone: string,
    documentUrl: string,
    fileName?: string,
    caption?: string
  ): Promise<SendMessageResponse> {
    const formattedPhone = phone.replace(/\D/g, '');

    return this.fetch(`/message/sendMedia/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: formattedPhone,
        media: documentUrl,
        caption: caption || '',
        fileName: fileName || 'document',
        mediaType: 'document',
        options: {
          delay: 1200,
        },
      }),
    }) as Promise<SendMessageResponse>;
  }

  // ============================================
  // PROFILE
  // ============================================

  /**
   * Busca informações do perfil de um número
   */
  async fetchProfile(instanceName: string, phone: string): Promise<ProfileInfo> {
    const formattedPhone = phone.replace(/\D/g, '');
    return this.fetch(`/chat/fetchProfile/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: formattedPhone,
      }),
    }) as Promise<ProfileInfo>;
  }

  /**
   * Verifica se um número existe no WhatsApp
   */
  async checkNumber(instanceName: string, phone: string): Promise<{ exists: boolean; jid?: string }> {
    const formattedPhone = phone.replace(/\D/g, '');
    const result = await this.fetch(`/chat/checkNumber/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: formattedPhone,
      }),
    }) as { exists: boolean; jid?: string } | null;

    return result || { exists: false };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const evolutionService = new EvolutionAPIService({
  baseUrl: process.env.EVOLUTION_API_URL || 'https://evolution.nexialab.com.br',
  apiKey: process.env.EVOLUTION_API_KEY || '',
});

// Export types
export type {
  EvolutionConfig,
  CreateInstanceResponse,
  ConnectionStateResponse,
  QRCodeResponse,
  SendMessageResponse,
  ProfileInfo,
};
