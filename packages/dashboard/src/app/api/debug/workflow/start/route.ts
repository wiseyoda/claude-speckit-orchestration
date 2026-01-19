import { NextResponse } from 'next/server';
import { workflowExecutor } from '@/lib/workflow-executor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectPath, skill } = body;

    if (!projectPath) {
      return NextResponse.json(
        { error: 'projectPath is required' },
        { status: 400 }
      );
    }

    // Expand ~ to home directory
    const expandedPath = projectPath.replace(
      /^~/,
      process.env.HOME || ''
    );

    const execution = await workflowExecutor.start(
      expandedPath,
      skill || '/flow.design'
    );

    return NextResponse.json(execution);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
