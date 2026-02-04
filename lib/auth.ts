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
                    scope: 'read:user user:email',
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.role = (user as any).role || 'USER';
            }
            return token;
        },
        async session({ session, token }) {
            // Add user data from JWT token to session
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    events: {
        async createUser({ user }) {
            try {
                // Ensure user has an ID
                if (!user.id) {
                    console.error('User created without ID');
                    return;
                }

                // Create default free subscription for new users
                const defaultPlan = await prisma.plan.findFirst({
                    where: { isDefault: true },
                });

                if (defaultPlan) {
                    await prisma.userSubscription.create({
                        data: {
                            userId: user.id,
                            planId: defaultPlan.id,
                            status: 'ACTIVE',
                        },
                    });
                }
            } catch (error) {
                console.error('Error in createUser event:', error);
                // Don't throw - we don't want to block user creation if subscription fails
            }
        },
        async linkAccount({ user, account }) {
            try {
                // Update user with GitHub ID when account is linked
                if (account.provider === 'github' && account.providerAccountId) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            githubId: account.providerAccountId,
                        },
                    });
                }
            } catch (error) {
                console.error('Error in linkAccount event:', error);
                // Don't throw - account link will still succeed
            }
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
