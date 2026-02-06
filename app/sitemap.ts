import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gitfarm.vercel.app';

    const routes = [
        '',
        '/login',
        '/register',
        '/dashboard',
        '/dashboard/editor',
        '/dashboard/tasks',
        '/dashboard/history',
        '/dashboard/plans',
        '/dashboard/settings',
    ];

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly' as any,
        priority: route === '' ? 1.0 : 0.8,
    }));
}
