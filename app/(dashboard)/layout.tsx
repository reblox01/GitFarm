import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { checkAndGrantMonthlyCredits } from '@/app/actions/billing';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    // 1. Ensure user has a subscription (Free Plan by default)
    let userSub = await prisma.userSubscription.findUnique({
        where: { userId: session.user.id },
        include: { plan: true }
    });

    if (!userSub) {
        const defaultPlan = await prisma.plan.findFirst({
            where: { isDefault: true }
        });

        if (defaultPlan) {
            userSub = await prisma.userSubscription.create({
                data: {
                    userId: session.user.id,
                    planId: defaultPlan.id,
                    status: 'ACTIVE',
                    provider: 'STRIPE',
                },
                include: { plan: true }
            });
        }
    }

    // 2. Check and refill monthly credits
    await checkAndGrantMonthlyCredits(session.user.id);

    // 3. Fetch final user state for the sidebar
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { credits: true }
    });

    return (
        <SidebarProvider>
            <AppSidebar
                user={session.user}
                role={(session.user as any).role}
                credits={user?.credits || 0}
                planName={userSub?.plan?.name || 'Free'}
            />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#">
                                        Building Your Application
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-w-0 overflow-x-hidden">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
