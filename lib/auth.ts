import NextAuth, { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';

export const authConfig: NextAuthConfig = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: 'read:user user:email',
                },
            },
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
                // Type assertion for role property
                session.user.role = (user as any).role || 'USER';
            }
            return session;
        },
        async signIn({ user, account, profile }) {
            if (!user.email) {
                return false;
            }

            // Check if user exists, if not create with GitHub data
            const existingUser = await prisma.user.findUnique({
                where: { email: user.email },
            });

            if (!existingUser && account && profile) {
                // Create user with GitHub profile data
                await prisma.user.create({
                    data: {
                        email: user.email,
                        name: user.name || profile.name,
                        avatarUrl: user.image || (profile as any).avatar_url,
                        githubId: account.providerAccountId,
                        role: 'USER',
                    },
                });

                // Create default free subscription
                const defaultPlan = await prisma.plan.findFirst({
                    where: { isDefault: true },
                });

                if (defaultPlan) {
                    const newUser = await prisma.user.findUnique({
                        where: { email: user.email },
                    });

                    if (newUser) {
                        await prisma.userSubscription.create({
                            data: {
                                userId: newUser.id,
                                planId: defaultPlan.id,
                                status: 'ACTIVE',
                            },
                        });
                    }
                }
            }

            return true;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'database',
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
