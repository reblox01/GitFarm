import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { GitHubLoginButton } from '@/components/github-login-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function LoginPage() {
    const session = await auth();

    if (session) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="w-full max-w-md p-6">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                        GitFarm
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Manage your GitHub contributions
                    </p>
                </div>

                <Card className="border-2">
                    <CardHeader>
                        <CardTitle>Welcome Back</CardTitle>
                        <CardDescription>
                            Sign in with your GitHub account to continue
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GitHubLoginButton />
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-slate-500 mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
