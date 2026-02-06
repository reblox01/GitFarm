import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import { TaskForm } from '@/components/tasks/task-form';

export default async function EditTaskPage({ params }: { params: { id: string } }) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const task = await prisma.task.findUnique({
        where: { id: params.id },
    });

    if (!task || task.userId !== session.user.id) {
        notFound();
    }

    // Prepare initial data for the form
    const initialData = {
        id: task.id,
        name: task.name,
        repositories: (task.repositories as any[]) || [],
        distribution: task.distribution as 'RANDOM' | 'EQUAL',
        schedule: task.schedule,
        creditLimit: task.creditLimit,
    };

    return <TaskForm initialData={initialData} isEditing={true} />;
}
