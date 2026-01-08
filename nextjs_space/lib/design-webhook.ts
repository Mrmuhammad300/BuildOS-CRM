/**
 * Integration with external AI Design & Rendering Platform
 * Webhook URL: https://gmllorlxfsxmsejhsjpa.supabase.co/functions/v1/n8n-orders-webhook
 */

export interface DesignTaskPayload {
  // Request identification
  requestId: string;
  requestNumber: string;
  taskId: string;
  
  // Task details
  taskType: string; // 'Architectural', 'Structural', 'MEPDesign', 'InteriorDesign', 'Landscaping', 'Rendering', 'ThreeD_Modeling', 'Documentation'
  title: string;
  description: string;
  priority: string;
  
  // Project information
  projectName: string;
  projectType: string;
  
  // Design requirements
  requirements: string;
  siteDetails?: string;
  budget?: number;
  timeline: string;
  
  // Client information
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  
  // AI Analysis (if available)
  designConcept?: string;
  styleRecommendations?: string;
  spatialLayout?: string;
  materialSuggestions?: string;
  sustainabilityFeatures?: string;
  visualizationPrompt?: string;
  
  // Callback configuration
  callbackUrl: string;
  callbackSecret: string;
}

export interface DesignTaskResponse {
  success: boolean;
  externalTaskId?: string;
  status?: string;
  message?: string;
  estimatedCompletionTime?: string;
  error?: string;
}

export interface WebhookCallbackPayload {
  // Task identification
  externalTaskId: string;
  requestId: string;
  taskId: string;
  
  // Status update
  status: string; // 'queued', 'processing', 'completed', 'failed'
  progress?: number; // 0-100
  
  // Results (when completed)
  resultUrl?: string;
  resultFiles?: string[];
  resultData?: any;
  
  // Error information (when failed)
  errorMessage?: string;
  errorDetails?: any;
  
  // Timestamps
  startedAt?: string;
  completedAt?: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

const DESIGN_WEBHOOK_URL = 'https://gmllorlxfsxmsejhsjpa.supabase.co/functions/v1/n8n-orders-webhook';
const WEBHOOK_TIMEOUT = 30000; // 30 seconds

/**
 * Send a design task to the external AI platform
 */
export async function sendDesignTaskToExternalPlatform(
  payload: DesignTaskPayload
): Promise<DesignTaskResponse> {
  try {
    console.log('[Design Webhook] Sending task to external platform:', {
      taskId: payload.taskId,
      taskType: payload.taskType,
      webhookUrl: DESIGN_WEBHOOK_URL
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);

    const response = await fetch(DESIGN_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Construction-CRM/1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseData = await response.json().catch(() => ({
      success: false,
      error: 'Invalid JSON response from external platform'
    }));

    if (!response.ok) {
      console.error('[Design Webhook] External platform returned error:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });

      return {
        success: false,
        error: responseData.error || responseData.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    console.log('[Design Webhook] Task sent successfully:', {
      taskId: payload.taskId,
      externalTaskId: responseData.externalTaskId || responseData.taskId,
      status: responseData.status
    });

    return {
      success: true,
      externalTaskId: responseData.externalTaskId || responseData.taskId || responseData.id,
      status: responseData.status || 'queued',
      message: responseData.message,
      estimatedCompletionTime: responseData.estimatedCompletionTime,
    };
  } catch (error: any) {
    console.error('[Design Webhook] Failed to send task to external platform:', error);

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout: External platform did not respond in time',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to connect to external platform',
    };
  }
}

/**
 * Verify webhook callback signature/secret
 */
export function verifyWebhookCallback(
  payload: any,
  providedSecret: string
): boolean {
  const expectedSecret = process.env.DESIGN_WEBHOOK_SECRET;
  
  if (!expectedSecret) {
    console.warn('[Design Webhook] DESIGN_WEBHOOK_SECRET not configured');
    return false;
  }

  return providedSecret === expectedSecret;
}

/**
 * Generate callback URL for webhook responses
 */
export function generateCallbackUrl(requestId: string, taskId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://development.abacusai.app';
  return `${baseUrl}/api/webhooks/design-callback`;
}

/**
 * Get callback secret for webhook authentication
 */
export function getCallbackSecret(): string {
  return process.env.DESIGN_WEBHOOK_SECRET || 'default-secret-please-change';
}

/**
 * Process webhook callback payload and update task status
 */
export function parseWebhookCallback(body: any): WebhookCallbackPayload | null {
  try {
    // Validate required fields
    if (!body.externalTaskId && !body.taskId) {
      console.error('[Design Webhook] Missing externalTaskId/taskId in callback');
      return null;
    }

    if (!body.status) {
      console.error('[Design Webhook] Missing status in callback');
      return null;
    }

    return {
      externalTaskId: body.externalTaskId || body.taskId,
      requestId: body.requestId,
      taskId: body.taskId,
      status: body.status,
      progress: body.progress,
      resultUrl: body.resultUrl,
      resultFiles: body.resultFiles || [],
      resultData: body.resultData || body.data,
      errorMessage: body.errorMessage || body.error,
      errorDetails: body.errorDetails,
      startedAt: body.startedAt,
      completedAt: body.completedAt,
      metadata: body.metadata || {},
    };
  } catch (error) {
    console.error('[Design Webhook] Failed to parse callback payload:', error);
    return null;
  }
}

/**
 * Map external status to internal TaskStatus enum
 */
export function mapExternalStatus(externalStatus: string): string {
  const statusMap: Record<string, string> = {
    'queued': 'Queued',
    'pending': 'Pending',
    'processing': 'Processing',
    'in_progress': 'Processing',
    'completed': 'Completed',
    'success': 'Completed',
    'failed': 'Failed',
    'error': 'Failed',
    'cancelled': 'Cancelled',
    'canceled': 'Cancelled',
  };

  return statusMap[externalStatus.toLowerCase()] || 'Pending';
}
