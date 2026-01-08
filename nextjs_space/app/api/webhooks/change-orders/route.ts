import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Webhook endpoint for n8n to create change orders
 * 
 * Expected payload:
 * {
 *   "webhookSecret": "your-secret-key",
 *   "projectId": "project-uuid",
 *   "title": "Change Order Title",
 *   "description": "Detailed description",
 *   "type": "Scope" | "Schedule" | "Budget" | "Design" | "Unforeseen" | "ClientRequested" | "RegulatoryCompliance" | "Other",
 *   "priority": "Low" | "Normal" | "High" | "Critical",
 *   "proposedCost": 10000,
 *   "scheduleImpact": 5,
 *   "reason": "Reason for change",
 *   "justification": "Justification text",
 *   "requestedByEmail": "user@example.com",
 *   "attachments": []
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate webhook secret
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured properly' },
        { status: 500 }
      );
    }

    if (body.webhookSecret !== webhookSecret) {
      console.error('Invalid webhook secret');
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!body.projectId || !body.title || !body.proposedCost) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['projectId', 'title', 'proposedCost'],
        },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Find user by email (or use default if not provided)
    let requestedById: string | null = project.projectManagerId; // Default to project manager
    if (body.requestedByEmail) {
      const user = await prisma.user.findUnique({
        where: { email: body.requestedByEmail },
      });
      if (user) {
        requestedById = user.id;
      }
    }

    // Ensure we have a valid user
    if (!requestedById) {
      return NextResponse.json(
        { error: 'No valid user found. Project manager not assigned or requested user not found.' },
        { status: 400 }
      );
    }

    // Generate change order number
    const year = new Date().getFullYear();
    const count = await prisma.changeOrder.count() + 1;
    const changeOrderNumber = `CO-${year}-${String(count).padStart(4, '0')}`;

    // Create change order
    const changeOrder = await prisma.changeOrder.create({
      data: {
        changeOrderNumber,
        title: body.title,
        description: body.description || '',
        type: body.type || 'Scope',
        priority: body.priority || 'Normal',
        proposedCost: parseFloat(body.proposedCost),
        scheduleImpact: body.scheduleImpact ? parseInt(body.scheduleImpact) : null,
        reason: body.reason || '',
        justification: body.justification || '',
        projectId: body.projectId,
        requestedById: requestedById,
        attachments: body.attachments || [],
        status: 'Draft', // Start as draft from webhook
      },
    });

    // Fetch related data for response
    const projectData = await prisma.project.findUnique({
      where: { id: changeOrder.projectId },
      select: { name: true, projectNumber: true },
    });

    const requestedByData = await prisma.user.findUnique({
      where: { id: changeOrder.requestedById as string },
      select: { firstName: true, lastName: true, email: true, role: true },
    });

    console.log(`Change order created via webhook: ${changeOrderNumber}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Change order created successfully',
        changeOrder: {
          id: changeOrder.id,
          changeOrderNumber: changeOrder.changeOrderNumber,
          title: changeOrder.title,
          status: changeOrder.status,
          proposedCost: changeOrder.proposedCost,
          project: projectData,
          requestedBy: requestedByData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET method to test webhook is accessible
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Change Orders Webhook Endpoint',
    status: 'active',
    method: 'POST',
    documentation: {
      url: '/api/webhooks/change-orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      requiredFields: ['webhookSecret', 'projectId', 'title', 'proposedCost'],
      optionalFields: [
        'description',
        'type',
        'priority',
        'scheduleImpact',
        'reason',
        'justification',
        'requestedByEmail',
        'attachments',
      ],
      types: {
        type: ['Scope', 'Schedule', 'Budget', 'Design', 'Unforeseen', 'ClientRequested', 'RegulatoryCompliance', 'Other'],
        priority: ['Low', 'Normal', 'High', 'Critical'],
      },
    },
  });
}
