// ============================================
// API RESPONSE TYPES
// ============================================

import {
  FunnelData,
  RecoveryData,
  ChannelsData,
  LossReasonsData,
  RevenueData,
  HealthScoreData,
  KpisData,
} from './dashboard';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    version: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Specific API response types
export type FunnelApiResponse = ApiResponse<FunnelData>;
export type RecoveryApiResponse = ApiResponse<RecoveryData>;
export type ChannelsApiResponse = ApiResponse<ChannelsData>;
export type LossReasonsApiResponse = ApiResponse<LossReasonsData>;
export type RevenueApiResponse = ApiResponse<RevenueData>;
export type HealthScoreApiResponse = ApiResponse<HealthScoreData>;
export type KpisApiResponse = ApiResponse<KpisData>;
