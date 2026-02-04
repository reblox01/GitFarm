import { signIn } from '@/lib/auth';

export async function GET() {
    // Initiate standard NextAuth sign-in flow
    // Redirect to our special popup success page after auth
    await signIn('github', {
        redirectTo: '/github-popup-success',
    });
}
