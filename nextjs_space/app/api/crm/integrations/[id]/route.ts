import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Get specific integration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integration = await prisma.cRMIntegration.findUnique({
      where: {
        id: params.id,
        userId: userId,
      },
      select: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        lastSyncAt: true,
        lastError: true,
        syncCount: true,
        webhookUrl: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ integration });
  } catch (error: any) {
    console.error('Get integration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve integration' },
      { status: 500 }
    );
  }
}

// PATCH - Update integration
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;

    const body = await request.json();
    const {
      name,
      apiKey,
      apiSecret,
      accessToken,
      refreshToken,
      webhookUrl,
      config,
      isActive,
    } = body;

    // Verify ownership
    const existing = await prisma.cRMIntegration.findUnique({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (apiSecret !== undefined) updateData.apiSecret = apiSecret;
    if (accessToken !== undefined) updateData.accessToken = accessToken;
    if (refreshToken !== undefined) updateData.refreshToken = refreshToken;
    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;
    if (config !== undefined) updateData.config = JSON.stringify(config);
    if (isActive !== undefined) updateData.isActive = isActive;

    const integration = await prisma.cRMIntegration.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        provider: integration.provider,
        name: integration.name,
        isActive: integration.isActive,
        updatedAt: integration.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Update integration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update integration' },
      { status: 500 }
    );
  }
}

// DELETE - Delete integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;

    // Verify ownership
    const existing = await prisma.cRMIntegration.findUnique({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    await prisma.cRMIntegration.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Integration deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete integration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete integration' },
      { status: 500 }
    );
  }
}
