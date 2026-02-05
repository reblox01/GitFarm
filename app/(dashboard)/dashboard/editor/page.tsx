import { ContributionGrid } from '@/components/contribution-grid';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function EditorPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { credits: true }
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Contribution Editor</h1>
                <p className="text-muted-foreground mt-2">
                    Design your GitHub contribution pattern
                </p>
            </div>

            <ContributionGrid initialCredits={user?.credits || 0} />
        </div>
    );
}
