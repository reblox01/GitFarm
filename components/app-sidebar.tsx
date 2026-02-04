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

export function AppSidebar({ user, role, ...props }: React.ComponentProps<typeof Sidebar> & { user: any, role?: string }) {
    const pathname = usePathname();
    const isAdmin = role === 'ADMIN';

    const navItems = isAdmin
        ? [...data.navMain, ...data.navAdmin.map(item => ({ ...item, section: 'Admin' }))]
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
                                    <span className="truncate text-xs">Pro</span>
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
                        {data.navMain.map((item) => (
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
                            {data.navAdmin.map((item) => (
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
