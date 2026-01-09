import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;

    const body = await request.json();
    const { projectId, projectData, documentTexts } = body;

    if (!projectId || !projectData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify project access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        rfis: { take: 5, orderBy: { createdAt: 'desc' } },
        changeOrders: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const startTime = Date.now();

    // Build comprehensive prompt
    const prompt = `Generate a comprehensive construction project plan for the following project:

Project Details:
- Name: ${projectData.name || project.name}
- Type: ${projectData.type || 'Construction'}
- Description: ${projectData.description || project.description}
- Budget: $${projectData.budget || project.budget}
- Timeline: ${projectData.timeline || 'To be determined'}
- Location: ${project.address}, ${project.city}, ${project.state}
- Start Date: ${project.startDate}
- Estimated Completion: ${project.estimatedCompletion}

${documentTexts && documentTexts.length > 0 ? `Additional Context from Documents:\n${documentTexts.join('\n\n')}` : ''}

${project.rfis.length > 0 ? `Recent RFIs: ${project.rfis.map((r: any) => r.subject).join(', ')}` : ''}

${project.changeOrders.length > 0 ? `Recent Change Orders: ${project.changeOrders.map((c: any) => c.title).join(', ')}` : ''}

Please provide a detailed project plan in JSON format with the following structure:
{
  "overview": "Executive summary of the project",
  "phases": [
    {
      "name": "Phase name",
      "description": "Phase description",
      "duration": "Duration in weeks",
      "tasks": [
        {
          "name": "Task name",
          "description": "Task description",
          "duration": "Duration",
          "dependencies": ["Task IDs"],
          "resources": ["Required resources"]
        }
      ]
    }
  ],
  "milestones": [
    {
      "name": "Milestone name",
      "description": "Milestone description",
      "targetDate": "Target date",
      "deliverables": ["List of deliverables"]
    }
  ],
  "riskAnalysis": {
    "risks": [
      {
        "risk": "Risk description",
        "probability": "Low/Medium/High",
        "impact": "Low/Medium/High",
        "mitigation": "Mitigation strategy"
      }
    ]
  },
  "budgetBreakdown": {
    "categories": [
      {
        "category": "Category name",
        "amount": 0,
        "percentage": 0,
        "description": "Description"
      }
    ],
    "contingency": 0
  },
  "resources": {
    "labor": ["Labor requirements"],
    "equipment": ["Equipment needs"],
    "materials": ["Material specifications"]
  },
  "qualityStandards": ["Quality benchmarks and standards"],
  "safetyConsiderations": ["Safety protocols and requirements"]
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

    const messages = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    // Call LLM API with JSON response
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: messages,
        stream: true,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error('LLM API request failed');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let partialRead = '';

    // Buffer the complete JSON response
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      partialRead += decoder.decode(value, { stream: true });
      let lines = partialRead.split('\n');
      partialRead = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            buffer += parsed.choices?.[0]?.delta?.content || '';
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    const generationTime = Date.now() - startTime;

    // Parse the JSON response
    let planData;
    try {
      planData = JSON.parse(buffer);
    } catch (error) {
      throw new Error('Failed to parse AI response as JSON');
    }

    // Check if plan already exists
    const existingPlan = await prisma.aIProjectPlan.findUnique({
      where: { projectId },
    });

    let aiPlan;
    if (existingPlan) {
      // Update existing plan with new version
      aiPlan = await prisma.aIProjectPlan.update({
        where: { projectId },
        data: {
          planData: JSON.stringify(planData),
          phases: JSON.stringify(planData.phases || []),
          milestones: JSON.stringify(planData.milestones || []),
          riskAnalysis: JSON.stringify(planData.riskAnalysis || {}),
          budgetBreakdown: JSON.stringify(planData.budgetBreakdown || {}),
          aiModel: 'gpt-4.1-mini',
          promptUsed: prompt,
          generationTime,
          version: existingPlan.version + 1,
        },
      });
    } else {
      // Create new plan
      aiPlan = await prisma.aIProjectPlan.create({
        data: {
          projectId,
          userId,
          planData: JSON.stringify(planData),
          phases: JSON.stringify(planData.phases || []),
          milestones: JSON.stringify(planData.milestones || []),
          riskAnalysis: JSON.stringify(planData.riskAnalysis || {}),
          budgetBreakdown: JSON.stringify(planData.budgetBreakdown || {}),
          aiModel: 'gpt-4.1-mini',
          promptUsed: prompt,
          generationTime,
        },
      });
    }

    return NextResponse.json({
      success: true,
      plan: {
        id: aiPlan.id,
        data: planData,
        version: aiPlan.version,
        generationTime,
        createdAt: aiPlan.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Project plan generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate project plan' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve project plan
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const plan = await prisma.aIProjectPlan.findUnique({
      where: { projectId },
      include: {
        project: {
          select: {
            name: true,
            projectNumber: true,
            status: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({
      plan: {
        id: plan.id,
        data: JSON.parse(plan.planData),
        phases: JSON.parse(plan.phases),
        milestones: JSON.parse(plan.milestones),
        riskAnalysis: plan.riskAnalysis ? JSON.parse(plan.riskAnalysis) : null,
        budgetBreakdown: plan.budgetBreakdown ? JSON.parse(plan.budgetBreakdown) : null,
        version: plan.version,
        project: plan.project,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Get project plan error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve project plan' },
      { status: 500 }
    );
  }
}
