import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// POST - Sync data with CRM
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { integrationId, projectId, action } = body;

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Get integration details
    const integration = await prisma.cRMIntegration.findUnique({
      where: {
        id: integrationId,
        userId: userId,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    if (!integration.isActive) {
      return NextResponse.json(
        { error: 'Integration is not active' },
        { status: 400 }
      );
    }

    // Get project data if projectId is provided
    let projectData = null;
    if (projectId) {
      projectData = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          projectManager: true,
          superintendent: true,
          changeOrders: true,
          rfis: true,
        },
      });

      if (!projectData) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
    }

    // Perform sync based on provider
    let syncResult: any = { success: false, message: 'Sync not implemented' };

    try {
      switch (integration.provider) {
        case 'Salesforce':
          syncResult = await syncWithSalesforce(
            integration,
            projectData,
            action
          );
          break;

        case 'HubSpot':
          syncResult = await syncWithHubSpot(integration, projectData, action);
          break;

        case 'Zoho':
          syncResult = await syncWithZoho(integration, projectData, action);
          break;

        case 'Pipedrive':
          syncResult = await syncWithPipedrive(
            integration,
            projectData,
            action
          );
          break;

        case 'Custom':
          syncResult = await syncWithCustomWebhook(
            integration,
            projectData,
            action
          );
          break;

        default:
          throw new Error(`Unsupported CRM provider: ${integration.provider}`);
      }

      // Update integration sync status
      await prisma.cRMIntegration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          syncCount: { increment: 1 },
          lastError: syncResult.success ? null : syncResult.message,
        },
      });

      return NextResponse.json({
        success: syncResult.success,
        message: syncResult.message,
        data: syncResult.data,
      });
    } catch (error: any) {
      // Update integration with error
      await prisma.cRMIntegration.update({
        where: { id: integrationId },
        data: {
          lastError: error.message,
        },
      });

      throw error;
    }
  } catch (error: any) {
    console.error('CRM sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync with CRM' },
      { status: 500 }
    );
  }
}

// Helper functions for each CRM provider
async function syncWithSalesforce(
  integration: any,
  projectData: any,
  action: string
) {
  // Salesforce API integration
  // This is a placeholder - implement actual Salesforce API calls
  const apiUrl = 'https://login.salesforce.com/services/data/v58.0';

  try {
    const response = await fetch(`${apiUrl}/sobjects/Opportunity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${integration.accessToken}`,
      },
      body: JSON.stringify({
        Name: projectData?.name || 'Test Project',
        StageName: 'Prospecting',
        CloseDate: new Date().toISOString().split('T')[0],
        Amount: projectData?.budget || 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`Salesforce API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Successfully synced with Salesforce',
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Salesforce sync failed: ${error.message}`,
    };
  }
}

async function syncWithHubSpot(
  integration: any,
  projectData: any,
  action: string
) {
  // HubSpot API integration
  const apiUrl = 'https://api.hubapi.com';

  try {
    const response = await fetch(`${apiUrl}/crm/v3/objects/deals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${integration.apiKey}`,
      },
      body: JSON.stringify({
        properties: {
          dealname: projectData?.name || 'Test Project',
          amount: projectData?.budget || 0,
          dealstage: 'appointmentscheduled',
          pipeline: 'default',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Successfully synced with HubSpot',
      data,
    };
  } catch (error: any) {
    return { success: false, message: `HubSpot sync failed: ${error.message}` };
  }
}

async function syncWithZoho(
  integration: any,
  projectData: any,
  action: string
) {
  // Zoho CRM API integration
  const apiUrl = 'https://www.zohoapis.com/crm/v2';

  try {
    const response = await fetch(`${apiUrl}/Deals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Zoho-oauthtoken ${integration.accessToken}`,
      },
      body: JSON.stringify({
        data: [
          {
            Deal_Name: projectData?.name || 'Test Project',
            Amount: projectData?.budget || 0,
            Stage: 'Qualification',
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Zoho API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, message: 'Successfully synced with Zoho', data };
  } catch (error: any) {
    return { success: false, message: `Zoho sync failed: ${error.message}` };
  }
}

async function syncWithPipedrive(
  integration: any,
  projectData: any,
  action: string
) {
  // Pipedrive API integration
  const apiUrl = 'https://api.pipedrive.com/v1';

  try {
    const response = await fetch(
      `${apiUrl}/deals?api_token=${integration.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: projectData?.name || 'Test Project',
          value: projectData?.budget || 0,
          currency: 'USD',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Pipedrive API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Successfully synced with Pipedrive',
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Pipedrive sync failed: ${error.message}`,
    };
  }
}

async function syncWithCustomWebhook(
  integration: any,
  projectData: any,
  action: string
) {
  // Custom webhook integration
  if (!integration.webhookUrl) {
    return { success: false, message: 'Webhook URL not configured' };
  }

  try {
    const response = await fetch(integration.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: action || 'sync',
        projectData,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.statusText}`);
    }

    const data = await response.json().catch(() => ({ success: true }));
    return {
      success: true,
      message: 'Successfully sent data to custom webhook',
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Custom webhook failed: ${error.message}`,
    };
  }
}
