'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Check, Sparkles, GitBranch, Calendar, Shield, Zap, Users, TrendingUp } from 'lucide-react';

export function LandingPage() {
    const features = [
        {
            icon: GitBranch,
            title: 'Visual Contribution Editor',
            description: 'Paint your GitHub contribution graph with an intuitive 52×7 grid interface',
        },
        {
            icon: Calendar,
            title: 'Automated Tasks',
            description: 'Schedule recurring commits to maintain your streak effortlessly',
        },
        {
            icon: Sparkles,
            title: 'Smart Patterns',
            description: 'Create custom patterns, use presets, or generate random designs',
        },
        {
            icon: Shield,
            title: 'Secure & Private',
            description: 'GitHub OAuth, OWASP compliant, rate limiting, and enterprise-grade security',
        },
        {
            icon: Zap,
            title: 'Lightning Fast',
            description: 'Built with Next.js 15, Bun, and optimized for performance',
        },
        {
            icon: TrendingUp,
            title: 'Real-time Progress',
            description: 'Watch your commits generate in real-time with live status updates',
        },
    ];

    const plans = [
        {
            name: 'Free',
            price: '$0',
            description: 'Perfect for trying out GitFarm',
            features: [
                '200 commits/month',
                'Basic patterns',
                'Community support',
            ],
        },
        {
            name: 'Pro',
            price: '$5',
            description: 'For active developers',
            features: [
                '1,000 commits/month',
                '10 automated tasks',
                'Custom patterns',
                'Image to pattern',
                'Priority support',
            ],
            popular: true,
        },
        {
            name: 'Premium',
            price: '$10',
            description: 'Monthly subscription',
            features: [
                '2,000 commits/month',
                '20 automated tasks',
                'Custom patterns',
                'Image to pattern',
                'Priority support',
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Navigation */}
            <nav className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        GitFarm
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost">Sign In</Button>
                        </Link>
                        <Link href="/login">
                            <Button>Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="container mx-auto px-6 py-24 text-center">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-800 dark:text-green-300 text-sm font-medium mb-4">
                        🚀 Transform Your GitHub Profile
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                        Manage Your GitHub
                        <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            Contributions
                        </span>
                        Like Never Before
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Automate, visualize, and optimize your GitHub contribution graph with our powerful SaaS platform.
                        Built for developers who care about their profile.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link href="/login">
                            <Button size="lg" className="text-lg px-8">
                                Start Free Today
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="text-lg px-8">
                            View Demo
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        No credit card required • 100 commits free • Cancel anytime
                    </p>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
                    <p className="text-xl text-muted-foreground">
                        Everything you need to master your GitHub presence
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature: any) => {
                        const Icon = feature.icon;
                        return (
                            <Card key={feature.title} className="border-2 hover:border-primary transition-colors">
                                <CardHeader>
                                    <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center mb-4">
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <CardTitle>{feature.title}</CardTitle>
                                    <CardDescription className="text-base">
                                        {feature.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Pricing Section */}
            <section className="container mx-auto px-6 py-24 bg-slate-50 dark:bg-slate-900/50">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
                    <p className="text-xl text-muted-foreground">
                        Choose the plan that fits your needs
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan: any) => (
                        <Card
                            key={plan.name}
                            className={`relative ${plan.popular ? 'border-2 border-primary shadow-lg scale-105' : ''
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                                    Most Popular
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-3">
                                    {plan.features.map((feature: any) => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <Check className="h-5 w-5 text-green-600" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/login">
                                    <Button
                                        className="w-full"
                                        variant={plan.popular ? 'default' : 'outline'}
                                        size="lg"
                                    >
                                        Get Started
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-6 py-24">
                <Card className="border-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    <CardContent className="p-12 text-center">
                        <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
                        <p className="text-xl mb-8 opacity-90">
                            Join thousands of developers optimizing their GitHub profiles
                        </p>
                        <Link href="/login">
                            <Button size="lg" variant="secondary" className="text-lg px-8">
                                Start Free Trial
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </section>

            {/* Footer */}
            <footer className="border-t bg-slate-50 dark:bg-slate-900/50">
                <div className="container mx-auto px-6 py-12">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                                GitFarm
                            </div>
                            <p className="text-muted-foreground">
                                Automate and optimize your GitHub contributions
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <ul className="space-y-2 text-muted-foreground">
                                <li><Link href="/login">Features</Link></li>
                                <li><Link href="/login">Pricing</Link></li>
                                <li><Link href="/login">Dashboard</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Company</h3>
                            <ul className="space-y-2 text-muted-foreground">
                                <li><Link href="#">About</Link></li>
                                <li><Link href="#">Blog</Link></li>
                                <li><Link href="#">Contact</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2 text-muted-foreground">
                                <li><Link href="#">Privacy Policy</Link></li>
                                <li><Link href="#">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
                        <p>© 2026 GitFarm. All rights reserved. Built with ❤️ by developers, for developers.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
