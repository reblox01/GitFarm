import { prisma } from '@/lib/db';
import { PlansList } from '@/components/plans-list';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getActivePlans } from '@/app/actions/get-plans';

export default async function PlansPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const [plans, user] = await Promise.all([
        getActivePlans(),
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                subscription: {
                    include: { plan: true }
                }
            }
        })
    ]);

    return (
        <div className="container mx-auto py-10 max-w-6xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Choose Your Plan</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Select the perfect plan to boost your GitHub contributions.
                    Get more credits and unlock premium features.
                </p>
            </div>

            <PlansList plans={plans as any[]} subscription={user?.subscription} />

            <div className="mt-16 text-center">
                <p className="text-muted-foreground text-sm">
                    All payments are securely processed by Stripe.
                    Cancel your monthly subscription anytime from your settings.
                </p>
            </div>
        </div>
    );
}
