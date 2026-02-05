"use client"

import * as React from "react"
import {
    BookOpen,
    Bot,
    Command,
    Frame,
    LifeBuoy,
    Map,
    PieChart,
    Send,
    Settings2,
    SquareTerminal,
    Calendar,
    Sparkles,
    LayoutDashboard,
    Users,
    CreditCard,
    Flag,
    Settings,
    Coins,
    ArrowUpCircle,
} from "lucide-react"
import { usePathname } from 'next/navigation'

import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarGroup,
    SidebarGroupLabel,
} from "@/components/ui/sidebar"

// Sample data structure - in a real app this might come from props or context
const data = {
    user: {
        name: "User",
        email: "user@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
            isActive: true,
        },
        {
            title: "Editor",
            url: "/dashboard/editor",
            icon: Sparkles,
        },
        {
            title: "Tasks",
            url: "/dashboard/tasks",
            icon: Calendar,
        },
        {
            title: "Settings",
            url: "/dashboard/settings",
            icon: Settings2,
        },
    ],
    navAdmin: [
        {
            title: "Overview",
            url: "/admin",
            icon: LayoutDashboard,
        },
        {
            title: "Users",
            url: "/admin/users",
            icon: Users,
        },
        {
            title: "Plans",
            url: "/admin/plans",
            icon: Flag,
        },
        {
            title: "Settings",
            url: "/admin/settings",
            icon: Settings,
        }
    ],
    projects: [
        {
            name: "GitFarm",
            url: "#",
            icon: Frame,
        },
    ],
}

export function AppSidebar({ user, role, credits, planName, ...props }: React.ComponentProps<typeof Sidebar> & { user: any, role?: string, credits?: number, planName?: string }) {
    const pathname = usePathname();
    const isAdmin = role === 'ADMIN';

    const navItems = isAdmin
        ? [...data.navMain, ...data.navAdmin.map((item: any) => ({ ...item, section: 'Admin' }))]
        : data.navMain;

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-green-600 text-sidebar-primary-foreground">
                                    <Command className="size-4 text-white" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">GitFarm</span>
                                    <span className="truncate text-xs">{planName || 'Free'}</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarMenu>
                        {data.navMain.map((item: any) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                                    <a href={item.url}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {isAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Admin</SidebarGroupLabel>
                        <SidebarMenu>
                            {data.navAdmin.map((item: any) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter>
                <div className="px-3 py-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" className="bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-500 border border-green-500/20 group" asChild>
                                <a href="/dashboard/plans">
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-green-500 text-white shadow-sm group-hover:scale-110 transition-transform">
                                        <Coins className="size-4" />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-bold">{credits?.toLocaleString() || 0} Credits</span>
                                        <span className="truncate text-[10px] flex items-center gap-1 opacity-80">
                                            <ArrowUpCircle className="size-2 text-green-600 dark:text-green-400" /> Upgrade Plan
                                        </span>
                                    </div>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </div>
                <NavUser user={{
                    name: user?.name || data.user.name,
                    email: user?.email || data.user.email,
                    avatar: user?.image || data.user.avatar,
                }} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
