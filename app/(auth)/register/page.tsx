import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { RegisterForm } from '@/components/forms/register-form';

export default async function RegisterPage() {
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

                <RegisterForm />

                <p className="text-center text-sm text-slate-500 mt-6">
                    Already have an account?{' '}
                    <Link href="/login" className="text-green-600 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
