import { generateStructuredData } from '@/lib/seo';

export function StructuredData({ type = 'website' }: { type?: 'organization' | 'software' | 'website' }) {
    const structuredData = generateStructuredData(type);

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}
