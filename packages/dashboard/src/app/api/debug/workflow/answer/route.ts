import { NextResponse } from 'next/server';
import { workflowExecutor } from '@/lib/workflow-executor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, answers } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'answers object is required' },
        { status: 400 }
      );
    }

    const execution = await workflowExecutor.resume(id, answers);

    return NextResponse.json(execution);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
