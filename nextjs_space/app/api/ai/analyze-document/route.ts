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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const analysisType = (formData.get('analysisType') as string) || 'General';
    const documentId = formData.get('documentId') as string | null;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: file and projectId' },
        { status: 400 }
      );
    }

    // Verify project access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const startTime = Date.now();

    // Process file based on type
    let documentText = '';
    let messages: any[] = [];

    if (file.type === 'application/pdf') {
      // For PDF files, use LLM API with base64 encoding
      const base64Buffer = await file.arrayBuffer();
      const base64String = Buffer.from(base64Buffer).toString('base64');

      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              file: {
                filename: file.name,
                file_data: `data:application/pdf;base64,${base64String}`,
              },
            },
            {
              type: 'text',
              text: `Analyze this construction document with focus on ${analysisType}. Extract key information and provide:
1. Summary of the document
2. ${analysisType === 'Safety' ? 'Safety concerns and compliance issues' : ''}
3. ${analysisType === 'Cost' ? 'Cost estimates and budget implications' : ''}
4. ${analysisType === 'Timeline' ? 'Timeline and schedule impacts' : ''}
5. ${analysisType === 'Compliance' ? 'Code compliance and regulatory requirements' : ''}
6. ${analysisType === 'Quality' ? 'Quality standards and specifications' : ''}
7. Key action items and recommendations

Provide a comprehensive analysis.`,
            },
          ],
        },
      ];
    } else if (file.type.startsWith('image/')) {
      // For images
      const base64Buffer = await file.arrayBuffer();
      const base64String = Buffer.from(base64Buffer).toString('base64');

      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this construction-related image with focus on ${analysisType}. Provide detailed observations and insights.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${file.type};base64,${base64String}`,
              },
            },
          ],
        },
      ];
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      // For text files
      documentText = await file.text();
      messages = [
        {
          role: 'user',
          content: `Analyze this construction document with focus on ${analysisType}:\n\n${documentText}\n\nProvide comprehensive analysis covering key points, ${analysisType.toLowerCase()} considerations, and actionable recommendations.`,
        },
      ];
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, TXT, or image files.' },
        { status: 400 }
      );
    }

    // Call LLM API with streaming
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
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error('LLM API request failed');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullAnalysis = '';
    let partialRead = '';

    // Buffer the complete response
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
            const content = parsed.choices?.[0]?.delta?.content || '';
            fullAnalysis += content;
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    const processingTime = Date.now() - startTime;

    // Save analysis to database
    const analysis = await prisma.documentAnalysis.create({
      data: {
        projectId,
        userId,
        documentId: documentId || undefined,
        analysisType: analysisType as any,
        documentText: documentText || file.name,
        analysisResult: fullAnalysis,
        aiModel: 'gpt-4.1-mini',
        processingTime,
      },
    });

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        result: fullAnalysis,
        processingTime,
        createdAt: analysis.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Document analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze document' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve past analyses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const documentId = searchParams.get('documentId');

    const where: any = {
      userId,
    };

    if (projectId) where.projectId = projectId;
    if (documentId) where.documentId = documentId;

    const analyses = await prisma.documentAnalysis.findMany({
      where,
      include: {
        document: {
          select: {
            filename: true,
            category: true,
          },
        },
        project: {
          select: {
            name: true,
            projectNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json({ analyses });
  } catch (error: any) {
    console.error('Get analyses error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve analyses' },
      { status: 500 }
    );
  }
}
