export interface EvolutionInstance {
  id: string;
  organizationId: string;
  name: string;
  instanceName: string;
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  profileName: string | null;
  apiKey: string | null;
  webhookEnabled: boolean;
  webhookUrl: string | null;
  messagesSent: number;
  messagesReceived: number;
  connectedAt: Date | null;
  disconnectedAt: Date | null;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEvolutionInstanceInput {
  name: string;
  organizationId: string;
}

export interface EvolutionInstanceResponse {
  id: string;
  name: string;
  instanceName: string;
  status: string;
  phoneNumber: string | null;
  profileName: string | null;
  profilePictureUrl: string | null;
  messagesSent: number;
  messagesReceived: number;
  connectedAt: Date | null;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvolutionQRCodeResponse {
  qrCode: string;
  pairingCode?: string;
  count: number;
}

export interface EvolutionConnectionState {
  instance: string;
  state: 'open' | 'connecting' | 'close';
}
