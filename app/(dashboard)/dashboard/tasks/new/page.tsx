import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { NewTaskForm } from '@/components/tasks/new-task-form';

export default async function NewTaskPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            subscription: {
                include: {
                    plan: {
                        include: {
                            features: {
                                include: {
                                    feature: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const canUseTasks = user?.subscription?.plan.features.some(f => f.feature.key === 'daily_tasks');

    if (!canUseTasks) {
        redirect('/dashboard/tasks');
    }

    return <NewTaskForm />;
}
