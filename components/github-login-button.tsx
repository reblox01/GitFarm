'use client';

import { Github } from 'lucide-react';
import { Button } from './ui/button';
import { handleGithubSignIn } from '@/app/(auth)/actions';

export function GitHubLoginButton() {
    return (
        <form action={handleGithubSignIn}>
            <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                size="lg"
            >
                <Github className="mr-2 h-5 w-5" />
                Continue with GitHub
            </Button>
        </form>
    );
}
