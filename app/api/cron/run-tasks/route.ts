import { NextRequest, NextResponse } from 'next/server';
import { runDueTasks } from '@/lib/tasks/task-runner';

export async function GET(request: NextRequest) {
    // Basic security check to prevent unauthorized triggers
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await runDueTasks();
        return NextResponse.json({ success: true, message: 'Tasks execution triggered' });
    } catch (error: any) {
        console.error('Task execution error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Support POST as well if needed
export async function POST(request: NextRequest) {
    return GET(request);
}
