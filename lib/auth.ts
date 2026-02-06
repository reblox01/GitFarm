import NextAuth, { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const authConfig: NextAuthConfig = {
    trustHost: true,
    debug: process.env.NODE_ENV === 'development',
    adapter: PrismaAdapter(prisma),
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                });

                if (!user || !user.password) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            }
        }),
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: 'repo user:email read:user',
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log('SignIn Callback:', { user, account, provider: account?.provider });

            // Allow all sign-ins
            return true;
        },
        async jwt({ token, user, account }) {
            console.log('JWT Callback called');
            // Initial sign in
            if (user) {
                console.log('JWT Callback: User signed in', user.id);
                token.id = user.id;
                token.role = (user as any).role || 'USER';
            }

            // Store account info if available
            if (account) {
                token.accessToken = account.access_token;
            }

            return token;
        },
        async session({ session, token }) {
            console.log('Session Callback called');
            // Add user data from JWT token to session
            if (session.user) {
                console.log('Session Callback: Adding user data', token.id);
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    cookies: {
        sessionToken: {
            options: {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    events: {
        async linkAccount({ user, account, profile }) {
            console.log('Account linked:', { userId: user.id, provider: account.provider });
        },
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

