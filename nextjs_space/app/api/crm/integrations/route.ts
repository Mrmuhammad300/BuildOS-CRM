import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - List all CRM integrations for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;

    const integrations = await prisma.cRMIntegration.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        lastSyncAt: true,
        lastError: true,
        syncCount: true,
        createdAt: true,
        updatedAt: true,
        // Don't send API keys/secrets to client
      },
    });

    return NextResponse.json({ integrations });
  } catch (error: any) {
    console.error('Get integrations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve integrations' },
      { status: 500 }
    );
  }
}

// POST - Create new CRM integration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;

    const body = await request.json();
    const {
      provider,
      name,
      apiKey,
      apiSecret,
      accessToken,
      refreshToken,
      webhookUrl,
      config,
    } = body;

    if (!provider || !name) {
      return NextResponse.json(
        { error: 'Provider and name are required' },
        { status: 400 }
      );
    }

    // Validate provider-specific requirements
    if (provider === 'Custom' && !webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL is required for custom integrations' },
        { status: 400 }
      );
    }

    if (['Salesforce', 'HubSpot', 'Zoho', 'Pipedrive'].includes(provider)) {
      if (!apiKey && !accessToken) {
        return NextResponse.json(
          { error: `API Key or Access Token is required for ${provider}` },
          { status: 400 }
        );
      }
    }

    const integration = await prisma.cRMIntegration.create({
      data: {
        userId: userId,
        provider,
        name,
        apiKey,
        apiSecret,
        accessToken,
        refreshToken,
        webhookUrl,
        config: config ? JSON.stringify(config) : null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        provider: integration.provider,
        name: integration.name,
        isActive: integration.isActive,
        createdAt: integration.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Create integration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create integration' },
      { status: 500 }
    );
  }
}
