import Link from "next/link"
import { GitBranch } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-zinc-900" />
                {/* Abstract Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="absolute top-0 z-0 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />

                <div className="relative z-20 flex items-center text-lg font-medium">
                    <div className="flex aspect-square size-8 mr-2 items-center justify-center rounded-lg bg-green-600 text-sidebar-primary-foreground">
                        <GitBranch className="size-4 text-white" />
                    </div>
                    GitFarm
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;The best way to predict the future is to create it. GitFarm helps you build consistency in your coding journey.&rdquo;
                        </p>
                        <footer className="text-sm">GitFarm Team</footer>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8 flex items-center justify-center h-full">
                {children}
            </div>
        </div>
    )
}
