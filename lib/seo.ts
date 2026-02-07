import { Metadata } from 'next';

export interface SEOConfig {
    title?: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: string;
    twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
}

const defaultConfig = {
    siteName: 'GitFarm',
    domain: process.env.NEXT_PUBLIC_APP_URL || 'https://gitfarm.app',
    defaultTitle: 'GitFarm - GitHub Contribution Automation',
    defaultDescription: 'Automate your GitHub contributions with GitFarm. Create custom commit patterns, schedule daily tasks, and build your perfect GitHub activity graph effortlessly.',
    defaultKeywords: [
        'github automation',
        'github contributions',
        'commit automation',
        'github activity',
        'github grass',
        'contribution graph',
        'github profile',
        'developer tools',
        'github commits',
        'git automation',
    ],
    twitterHandle: '@gitfarm', // Update with actual handle
    defaultImage: '/og-image.png', // Create this image (1200x630px)
};

export function generateSEO(config: SEOConfig = {}): Metadata {
    const {
        title = defaultConfig.defaultTitle,
        description = defaultConfig.defaultDescription,
        keywords = defaultConfig.defaultKeywords,
        image = defaultConfig.defaultImage,
        url = defaultConfig.domain,
        type = 'website',
        twitterCard = 'summary_large_image',
    } = config;

    const fullTitle = title === defaultConfig.defaultTitle
        ? title
        : `${title} | ${defaultConfig.siteName}`;

    const fullUrl = url.startsWith('http') ? url : `${defaultConfig.domain}${url}`;
    const imageUrl = image.startsWith('http') ? image : `${defaultConfig.domain}${image}`;

    return {
        title: fullTitle,
        description,
        keywords: keywords.join(', '),
        authors: [{ name: defaultConfig.siteName }],
        creator: defaultConfig.siteName,
        publisher: defaultConfig.siteName,
        formatDetection: {
            email: false,
            address: false,
            telephone: false,
        },
        metadataBase: new URL(defaultConfig.domain),
        alternates: {
            canonical: fullUrl,
        },
        icons: {
            icon: [
                { url: '/favicon.ico', sizes: 'any' },
                { url: '/favicon.svg', type: 'image/svg+xml' },
                { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
            ],
            apple: [
                { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
            ],
        },
        manifest: '/site.webmanifest',
        openGraph: {
            type: type as any,
            siteName: defaultConfig.siteName,
            title: fullTitle,
            description,
            url: fullUrl,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            locale: 'en_US',
        },
        twitter: {
            card: twitterCard,
            site: defaultConfig.twitterHandle,
            creator: defaultConfig.twitterHandle,
            title: fullTitle,
            description,
            images: [imageUrl],
        },
        robots: {
            index: true,
            follow: true,
            nocache: false,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

export function generateStructuredData(type: 'organization' | 'software' | 'website' = 'website') {
    const baseData = {
        '@context': 'https://schema.org',
    };

    switch (type) {
        case 'organization':
            return {
                ...baseData,
                '@type': 'Organization',
                name: defaultConfig.siteName,
                url: defaultConfig.domain,
                logo: `${defaultConfig.domain}/logo.png`,
                description: defaultConfig.defaultDescription,
                sameAs: [
                    // Add social media links
                    'https://github.com/gitfarm',
                    'https://twitter.com/gitfarm',
                ],
            };

        case 'software':
            return {
                ...baseData,
                '@type': 'SoftwareApplication',
                name: defaultConfig.siteName,
                applicationCategory: 'DeveloperApplication',
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                },
                operatingSystem: 'Web',
                description: defaultConfig.defaultDescription,
            };

        case 'website':
        default:
            return {
                ...baseData,
                '@type': 'WebSite',
                name: defaultConfig.siteName,
                url: defaultConfig.domain,
                description: defaultConfig.defaultDescription,
                potentialAction: {
                    '@type': 'SearchAction',
                    target: `${defaultConfig.domain}/search?q={search_term_string}`,
                    'query-input': 'required name=search_term_string',
                },
            };
    }
}
