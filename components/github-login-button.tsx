'use client';

import { Github } from 'lucide-react';
import { Button } from './ui/button';

export function GitHubLoginButton() {
    const handleLogin = async () => {
        window.location.href = '/api/auth/signin/github?callbackUrl=/dashboard';
    };

    return (
        <Button
            onClick={handleLogin}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            size="lg"
        >
            <Github className="mr-2 h-5 w-5" />
            Continue with GitHub
        </Button>
    );
}
