/**
 * WhatsApp Analytics API Route
 * GET: Get metrics and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAnalytics,
  getPhoneNumberQuality,
  WhatsAppApiError,
  extractErrorDetails,
} from '@/lib/whatsapp/cloud-api';

interface AnalyticsQueryParams {
  accessToken: string;
  wabaId: string;
  startDate: string;
  endDate: string;
  granularity?: 'DAILY' | 'MONTHLY';
  phoneNumberId?: string;
}

function validateQueryParams(searchParams: URLSearchParams): AnalyticsQueryParams | null {
  const accessToken = searchParams.get('accessToken');
  const wabaId = searchParams.get('wabaId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!accessToken || !wabaId || !startDate || !endDate) {
    return null;
  }

  const granularity = searchParams.get('granularity') as 'DAILY' | 'MONTHLY' | null;
  const phoneNumberId = searchParams.get('phoneNumberId') || undefined;

  return {
    accessToken,
    wabaId,
    startDate,
    endDate,
    granularity: granularity || 'DAILY',
    phoneNumberId,
  };
}

/**
 * GET /api/whatsapp/analytics
 * Get WhatsApp analytics and metrics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = validateQueryParams(searchParams);

    if (!params) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required query parameters: accessToken, wabaId, startDate, endDate. Optional: granularity (DAILY|MONTHLY), phoneNumberId',
          dateFormat: 'YYYY-MM-DD',
        },
        { status: 400 }
      );
    }

    const {
      accessToken,
      wabaId,
      startDate,
      endDate,
      granularity,
      phoneNumberId,
    } = params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        },
        { status: 400 }
      );
    }

    // Fetch analytics data
    const analyticsData = await getAnalytics(
      wabaId,
      accessToken,
      startDate,
      endDate,
      granularity
    );

    // Calculate aggregated metrics
    const aggregated = analyticsData.data.reduce(
      (acc, day) => {
        acc.totalConversations += day.conversation;
        return acc;
      },
      { totalConversations: 0 }
    );

    // Get phone number quality if specified
    let phoneQuality = null;
    if (phoneNumberId) {
      try {
        const quality = await getPhoneNumberQuality(phoneNumberId, accessToken);
        phoneQuality = {
          score: quality.quality_score.score,
          date: quality.quality_score.date,
          reasons: quality.quality_score.reasons,
        };
      } catch (qualityError) {
        console.warn('Failed to fetch phone number quality:', qualityError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
          granularity,
        },
        summary: {
          totalConversations: aggregated.totalConversations,
          dailyAverage: Math.round(
            aggregated.totalConversations / analyticsData.data.length
          ),
        },
        dailyBreakdown: analyticsData.data.map((day) => ({
          date: new Date(day.start * 1000).toISOString().split('T')[0],
          conversations: day.conversation,
          phoneNumber: day.phone_number,
          country: day.country,
          type: day.type,
          category: day.category,
        })),
        phoneQuality,
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Analytics Error:', { code, message, type });

    if (error instanceof WhatsAppApiError) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          errorCode: code,
          errorType: type,
        },
        { status: code >= 400 && code < 500 ? code : 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}
